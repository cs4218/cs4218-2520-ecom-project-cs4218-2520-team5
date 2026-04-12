// Alyssa Ong, A0264663X
// Stress Test — Order & Profile Endpoints (Component Isolation)
// Uses ramping-arrival-rate to stress authenticated operations with heavy DB joins
// Assisted by AI
//
// This test isolates order/profile endpoints which combine two bottleneck types:
//   1. JWT auth middleware (CPU cost for token verification on every request)
//   2. Heavy database joins (double .populate() across orders → products + buyer)
//
// The all-orders admin endpoint is potentially the heaviest single query in
// the application — it fetches every order and populates both product and
// buyer data for each one.
//
// Endpoints tested:
//   GET  /api/v1/auth/user-auth            (JWT validation only — no DB)
//   GET  /api/v1/auth/admin-auth           (JWT validation + admin role check)
//   PUT  /api/v1/auth/profile              (optional bcrypt.hash + 2 DB writes)
//   GET  /api/v1/auth/orders               (double populate — user-scoped)
//   GET  /api/v1/auth/all-orders           (double populate — ALL orders, admin)
//   PUT  /api/v1/auth/order-status/:id     (findByIdAndUpdate with status enum)
//
// Run:  k6 run stress-final/stress-test-orders.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate } from "k6/metrics";
import { BASE_URL, metrics, seedTestData, authHeaders, TIMEOUT } from "./helpers.js";

// ── Component-specific metrics ─────────────────────────────────────
const profileUpdateFailRate = new Rate("profile_update_fail_rate");
const getOrdersFailRate     = new Rate("get_orders_fail_rate");
const adminOrdersFailRate   = new Rate("admin_orders_fail_rate");

// ── Arrival-rate stress profile ────────────────────────────────────
// Orders combine auth (CPU) + heavy-DB (I/O), so they're moderately
// expensive. Each iteration does 6 HTTP calls.
//
// VU sizing (Little's Law):
//   At 10 iter/s with 2s response → 20 VUs
//   At 30 iter/s with 5s degraded → 150 VUs
//   At 45 iter/s with 5s collapsed → 225 VUs (add headroom)
export const options = {
  scenarios: {
    orders_stress: {
      executor: "ramping-arrival-rate",
      startRate: 3,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: 350,
      stages: [
        { duration: "30s", target: 3 },    // Warm-up
        { duration: "30s", target: 8 },    // Light load
        { duration: "30s", target: 15 },   // Moderate load
        { duration: "60s", target: 22 },   // Critical zone (extended hold)
        { duration: "60s", target: 30 },   // Critical zone (extended hold)
        { duration: "60s", target: 38 },   // Critical zone (extended hold)
        { duration: "60s", target: 45 },   // Beyond breaking point
        { duration: "90s", target: 45 },   // Sustained peak hold
        { duration: "60s", target: 25 },   // Recovery: reduced load
        { duration: "30s", target: 8 },    // Recovery: near-baseline
        { duration: "30s", target: 0 },    // Recovery: ramp to zero
      ],
    },
  },
  thresholds: {
    "http_req_duration{scenario:orders_stress}": ["p(95)<5000"],
    profile_update_fail_rate: ["rate<0.5"],
    get_orders_fail_rate: ["rate<0.5"],
    "http_req_failed{scenario:orders_stress}": ["rate<0.5"],
  },
};

// ── Setup — create admin + user, fetch order IDs ────────────────────
export function setup() {
  return seedTestData();
}

// ── Default function — full auth operations flow per iteration ──────
export default function (data) {
  const { adminToken, userToken, orderIds } = data;

  // ── 1. Token validation (user-auth: JWT only, no DB) ──────────────
  if (userToken) {
    group("GET /auth/user-auth", () => {
      const res = http.get(`${BASE_URL}/api/v1/auth/user-auth`, {
        headers: authHeaders(userToken),
        tags: { name: "GET /auth/user-auth" },
        timeout: TIMEOUT,
      });
      metrics.userAuth.add(res.timings.duration);
      check(res, { "user-auth 200": (r) => r.status === 200 });
    });
    sleep(0.2);
  }

  // ── 2. Admin token validation ─────────────────────────────────────
  if (adminToken) {
    group("GET /auth/admin-auth", () => {
      const res = http.get(`${BASE_URL}/api/v1/auth/admin-auth`, {
        headers: authHeaders(adminToken),
        tags: { name: "GET /auth/admin-auth" },
        timeout: TIMEOUT,
      });
      metrics.adminAuth.add(res.timings.duration);
      check(res, { "admin-auth 200": (r) => r.status === 200 });
    });
    sleep(0.2);
  }

  // ── 3. Update profile (user) ──────────────────────────────────────
  if (userToken) {
    group("PUT /auth/profile", () => {
      const payload = JSON.stringify({
        name: `Stress User ${__VU}_${__ITER}`,
        phone: `9${String(__ITER).padStart(7, "0")}`,
        address: `${__ITER} Stress Avenue`,
      });
      const res = http.put(`${BASE_URL}/api/v1/auth/profile`, payload, {
        headers: authHeaders(userToken),
        tags: { name: "PUT /auth/profile" },
        timeout: TIMEOUT,
      });
      metrics.updateProfile.add(res.timings.duration);
      const ok = check(res, {
        "profile update 200": (r) => r.status === 200,
      });
      profileUpdateFailRate.add(!ok);
      metrics.failRate.add(!ok);
    });
    sleep(0.2);
  }

  // ── 4. Get user orders (double populate — key bottleneck) ─────────
  if (userToken) {
    group("GET /auth/orders", () => {
      const res = http.get(`${BASE_URL}/api/v1/auth/orders`, {
        headers: authHeaders(userToken),
        tags: { name: "GET /auth/orders" },
        timeout: TIMEOUT,
      });
      metrics.getOrders.add(res.timings.duration);
      const ok = check(res, { "get orders 200": (r) => r.status === 200 });
      getOrdersFailRate.add(!ok);
      metrics.failRate.add(!ok);
    });
    sleep(0.2);
  }

  // ── 5. Get all orders (admin — heaviest query in the app) ─────────
  if (adminToken) {
    group("GET /auth/all-orders", () => {
      const res = http.get(`${BASE_URL}/api/v1/auth/all-orders`, {
        headers: authHeaders(adminToken),
        tags: { name: "GET /auth/all-orders" },
        timeout: TIMEOUT,
      });
      metrics.allOrders.add(res.timings.duration);
      const ok = check(res, { "all-orders 200": (r) => r.status === 200 });
      adminOrdersFailRate.add(!ok);
      metrics.failRate.add(!ok);
    });
    sleep(0.2);
  }

  // ── 6. Update order status (admin) ────────────────────────────────
  if (adminToken && orderIds && orderIds.length > 0) {
    group("PUT /auth/order-status/:orderId", () => {
      const orderId = orderIds[__ITER % orderIds.length];
      const statuses = ["Not Process", "Processing", "Shipped", "Delivered", "Cancelled"];
      const status = statuses[__ITER % statuses.length];
      const res = http.put(
        `${BASE_URL}/api/v1/auth/order-status/${orderId}`,
        JSON.stringify({ status }),
        {
          headers: authHeaders(adminToken),
          tags: { name: "PUT /auth/order-status/:orderId" },
          timeout: TIMEOUT,
        }
      );
      metrics.orderStatus.add(res.timings.duration);
      check(res, { "order-status update 200": (r) => r.status === 200 });
    });
  }

  sleep(0.3);
}
