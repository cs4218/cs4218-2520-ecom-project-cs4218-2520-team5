// Alyssa Ong, A0264663X
// Stress Test — Category Endpoints (Component Isolation)
// Uses ramping-arrival-rate to stress read/write contention
// Assisted by AI
//
// This test isolates category endpoints to study concurrent read/write
// contention. Category reads (find({})) are simple queries that serve as
// **control endpoints** — if even these degrade under stress, it confirms
// a system-wide bottleneck (event loop saturation or connection pool
// exhaustion) rather than a query-specific issue.
//
// Write operations (create → update → delete) compete with reads for
// MongoDB locks and Mongoose connection pool slots. Under stress, this
// write-read contention can cause deadlocks or timeout cascades.
//
// Endpoints tested:
//   GET    /api/v1/category/get-category             (all categories)
//   GET    /api/v1/category/single-category/:slug     (single category)
//   POST   /api/v1/category/create-category           (create — admin)
//   PUT    /api/v1/category/update-category/:id       (update — admin)
//   DELETE /api/v1/category/delete-category/:id       (delete — admin)
//
// Run:  k6 run stress-final/stress-test-categories.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate } from "k6/metrics";
import { BASE_URL, metrics, seedTestData, authHeaders, TIMEOUT } from "./helpers.js";

// ── Component-specific metrics ─────────────────────────────────────
const getCatFailRate    = new Rate("get_category_fail_rate");
const createCatFailRate = new Rate("create_category_fail_rate");

// ── Arrival-rate stress profile ────────────────────────────────────
// Categories are lightweight individually, but write operations add
// contention. Each iteration does 1 read + 1 single-read + 1 create +
// 1 update + 1 delete = 5 HTTP calls, ~3 of which are writes.
//
// VU sizing (Little's Law):
//   At 20 iter/s with 1s response → 20 VUs
//   At 50 iter/s with 3s degraded → 150 VUs
//   At 80 iter/s with 5s collapsed → 400 VUs
export const options = {
  scenarios: {
    categories_stress: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 30,
      maxVUs: 400,
      stages: [
        { duration: "30s", target: 5 },    // Warm-up
        { duration: "30s", target: 10 },   // Light load
        { duration: "30s", target: 20 },   // Moderate load
        { duration: "60s", target: 35 },   // Critical zone (extended hold)
        { duration: "60s", target: 50 },   // Critical zone (extended hold)
        { duration: "60s", target: 70 },   // Critical zone (extended hold)
        { duration: "60s", target: 90 },   // Beyond breaking point
        { duration: "90s", target: 90 },   // Sustained peak hold
        { duration: "60s", target: 50 },   // Recovery: reduced load
        { duration: "30s", target: 15 },   // Recovery: near-baseline
        { duration: "30s", target: 0 },    // Recovery: ramp to zero
      ],
    },
  },
  thresholds: {
    "http_req_duration{scenario:categories_stress}": ["p(95)<5000"],
    get_category_fail_rate: ["rate<0.3"],
    create_category_fail_rate: ["rate<0.5"],
    "http_req_failed{scenario:categories_stress}": ["rate<0.3"],
  },
};

// ── Setup — create admin user, fetch existing categories ────────────
export function setup() {
  return seedTestData();
}

// ── Default function — full category CRUD cycle per iteration ───────
export default function (data) {
  const { adminToken, categories } = data;

  // ── 1. Get all categories (public, high-frequency read) ───────────
  group("GET /category/get-category", () => {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "GET /category/get-category" },
      timeout: TIMEOUT,
    });
    metrics.getCategories.add(res.timings.duration);
    const ok = check(res, {
      "get-category 200": (r) => r.status === 200,
      "get-category has array": (r) => {
        try { return Array.isArray(JSON.parse(r.body).category); }
        catch { return false; }
      },
    });
    getCatFailRate.add(!ok);
    metrics.failRate.add(!ok);
  });

  sleep(0.2);

  // ── 2. Get single category by slug ────────────────────────────────
  if (categories && categories.length > 0) {
    group("GET /category/single-category/:slug", () => {
      const cat = categories[__ITER % categories.length];
      const res = http.get(
        `${BASE_URL}/api/v1/category/single-category/${cat.slug}`,
        { tags: { name: "GET /category/single-category/:slug" }, timeout: TIMEOUT }
      );
      metrics.singleCategory.add(res.timings.duration);
      check(res, { "single-category 200": (r) => r.status === 200 });
    });
    sleep(0.2);
  }

  // ── 3. Create → Update → Delete cycle (admin writes) ──────────────
  if (adminToken) {
    group("POST /category/create-category", () => {
      const unique = `StressCat_${__VU}_${__ITER}_${Date.now()}`;
      const res = http.post(
        `${BASE_URL}/api/v1/category/create-category`,
        JSON.stringify({ name: unique }),
        {
          headers: authHeaders(adminToken),
          tags: { name: "POST /category/create-category" },
          timeout: TIMEOUT,
        }
      );
      metrics.createCategory.add(res.timings.duration);
      const ok = check(res, {
        "create-category 2xx": (r) => r.status === 201 || r.status === 200,
      });
      createCatFailRate.add(!ok);
      metrics.failRate.add(!ok);

      // Update + delete the created category
      try {
        const body = JSON.parse(res.body);
        if (body.category && body.category._id) {
          sleep(0.1);

          // Update
          group("PUT /category/update-category/:id", () => {
            const updateRes = http.put(
              `${BASE_URL}/api/v1/category/update-category/${body.category._id}`,
              JSON.stringify({ name: `Updated_${unique}` }),
              {
                headers: authHeaders(adminToken),
                tags: { name: "PUT /category/update-category/:id" },
                timeout: TIMEOUT,
              }
            );
            metrics.updateCategory.add(updateRes.timings.duration);
            check(updateRes, { "update-category 200": (r) => r.status === 200 });
          });

          sleep(0.1);

          // Delete (cleanup to avoid polluting DB)
          group("DELETE /category/delete-category/:id", () => {
            const delRes = http.del(
              `${BASE_URL}/api/v1/category/delete-category/${body.category._id}`,
              null,
              {
                headers: authHeaders(adminToken),
                tags: { name: "DELETE /category/delete-category/:id" },
                timeout: TIMEOUT,
              }
            );
            metrics.deleteCategory.add(delRes.timings.duration);
            check(delRes, { "delete-category 200": (r) => r.status === 200 });
          });
        }
      } catch { /* parsing failed under stress — expected */ }
    });
  }

  sleep(0.3);
}
