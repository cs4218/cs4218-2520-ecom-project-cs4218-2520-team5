// Ivan Ang, A0259256U
// Assisted by AI
//
// Spike Test: Category Endpoints
// Tests: GET /api/v1/category/get-category
//        GET /api/v1/category/single-category/:slug
//
// Spike pattern:
//   Warm-up  →  Baseline  →  SPIKE (10x)  →  Recovery  →  Cool-down
//
// Run: k6 run tests/spike/spike-categories.js
//      k6 run --env BASE_URL=http://localhost:6060 tests/spike/spike-categories.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ---------- Custom metrics ----------
const categoryListDuration = new Trend("category_list_duration", true);
const singleCategoryDuration = new Trend("single_category_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

// ---------- Spike test stages ----------
export const options = {
  stages: [
    // Warm-up
    { duration: "15s", target: 5 },
    // Baseline load
    { duration: "30s", target: 20 },
    // SPIKE — sudden 10× increase
    { duration: "10s", target: 200 },
    // Recovery — back to baseline
    { duration: "30s", target: 20 },
    // Cool-down
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    // 95% of category-list responses must be under 500 ms
    category_list_duration: ["p(95)<500"],
    // 95% of single-category responses must be under 600 ms
    single_category_duration: ["p(95)<600"],
    // Overall HTTP error rate must stay under 5%
    error_rate: ["rate<0.05"],
    // Overall p99 across all requests must be under 1 s
    http_req_duration: ["p(99)<1000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// A few known slugs to randomise requests (will be populated at runtime from the list response)
let categorySlugs = ["electronics", "books", "clothing"];

export default function () {
  // ---- 1. Get all categories ----
  const listRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { name: "get-category" },
  });

  categoryListDuration.add(listRes.timings.duration);
  requestsTotal.add(1);

  const listOk = check(listRes, {
    "get-category: status 200": (r) => r.status === 200,
    "get-category: has success flag": (r) => {
      try {
        return r.json("success") === true;
      } catch (_) {
        return false;
      }
    },
    "get-category: response under 500ms": (r) => r.timings.duration < 500,
  });

  errorRate.add(!listOk);

  // Harvest slugs from the response for subsequent requests
  try {
    const body = listRes.json();
    if (body && Array.isArray(body.category) && body.category.length > 0) {
      categorySlugs = body.category.map((c) => c.slug).filter(Boolean);
    }
  } catch (_) {
    // ignore parse errors during spike — slugs array stays as-is
  }

  sleep(0.2);

  // ---- 2. Get a single category by slug ----
  if (categorySlugs.length > 0) {
    const slug = categorySlugs[Math.floor(Math.random() * categorySlugs.length)];
    const singleRes = http.get(
      `${BASE_URL}/api/v1/category/single-category/${slug}`,
      { tags: { name: "single-category" } }
    );

    singleCategoryDuration.add(singleRes.timings.duration);
    requestsTotal.add(1);

    const singleOk = check(singleRes, {
      "single-category: status 200": (r) => r.status === 200,
      "single-category: has category": (r) => {
        try {
          return r.json("category") !== undefined;
        } catch (_) {
          return false;
        }
      },
      "single-category: response under 600ms": (r) => r.timings.duration < 600,
    });

    errorRate.add(!singleOk);
  }

  sleep(0.3);
}
