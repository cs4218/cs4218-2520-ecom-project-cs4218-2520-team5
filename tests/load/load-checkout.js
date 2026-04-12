// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Load Test (Final Report Run): Checkout Endpoints
// Endpoints: POST /api/v1/auth/login            (authenticate before checkout)
//            GET  /api/v1/product/braintree/token (request payment client token)
//
// --- Why these endpoints ---
// Checkout is the most sensitive and resource-heavy flow. It requires
// authentication (bcrypt), then contacts the external Braintree payment
// gateway for a client token. This external dependency makes it slower
// and more latency-variable than purely local endpoints. Fewer users
// reach checkout than browse products (conversion funnel), so lower VU
// ceilings are realistic.
//
// --- Why these load stages ---
// The VU ceiling is intentionally the lowest of all four tests (default
// 15) because: (a) checkout involves an external network call to
// Braintree, (b) each VU performs a login + token request (2 sequential
// HTTP calls), and (c) real checkout concurrency is naturally lower.
//   Ramp-up   → 2 VUs  (minimal — verify flow works)
//   Step 1    → 5 VUs  (light checkout traffic)
//   Step 2    → 10 VUs (moderate — busy checkout period)
//   Step 3    → 15 VUs (upper-normal — calibrated ceiling)
//   Sustain   → 15 VUs (2 min stable measurement)
//   Ramp-down → 0 VUs
//
// --- Metrics and thresholds ---
// Primary metrics collected:
//   - checkout_login_duration (custom Trend): login latency in checkout ctx
//   - braintree_token_duration (custom Trend): payment token request latency
//   - http_req_duration (built-in): p90 across all HTTP requests
//   - http_req_failed (built-in):   fraction of non-2xx/3xx responses
//   - error_rate (custom Rate):     fraction of 5xx server errors
//   - requestsTotal (custom):       total throughput
//
// Note: The error_rate threshold is more lenient (10%) because the
// Braintree token endpoint may return errors if gateway credentials
// are not configured. This is still a valid data point for load testing.
//
// Run:
//   k6 run tests/load/load-checkout.js
//   k6 run --env BASE_URL=http://localhost:6060 tests/load/load-checkout.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const loginDuration = new Trend("checkout_login_duration", true);
const tokenDuration = new Trend("braintree_token_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

export const options = {
  stages: [
    { duration: "30s", target: 2 },
    { duration: "1m", target: 5 },
    { duration: "1m", target: 10 },
    { duration: "1m", target: 15 },
    { duration: "2m", target: 15 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    checkout_login_duration: ["p(50)<400", "p(90)<800", "p(95)<1000", "p(99)<1200"],
    braintree_token_duration: ["p(50)<1000", "p(90)<2000", "p(95)<2500", "p(99)<3000"],
    error_rate: ["rate<0.10"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const TEST_EMAIL = __ENV.TEST_EMAIL || "test@test.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "test1234";

export default function () {
  const headers = { "Content-Type": "application/json" };

  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers, tags: { name: "checkout-login" } }
  );

  loginDuration.add(loginRes.timings.duration);
  requestsTotal.add(1);

  let token = null;
  if (loginRes.status === 200) {
    try {
      token = loginRes.json("token");
    } catch (_) {}
  }

  check(loginRes, {
    "checkout-login: status 200": (r) => r.status === 200,
    "checkout-login: has token": (r) => {
      try {
        return typeof r.json("token") === "string";
      } catch (_) {
        return false;
      }
    },
  });
  errorRate.add(loginRes.status >= 500);

  sleep(0.3);

  if (token) {
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: token,
    };

    const tokenRes = http.get(
      `${BASE_URL}/api/v1/product/braintree/token`,
      { headers: authHeaders, tags: { name: "braintree-token" } }
    );

    tokenDuration.add(tokenRes.timings.duration);
    requestsTotal.add(1);

    check(tokenRes, {
      "braintree-token: status 200": (r) => r.status === 200,
      "braintree-token: has clientToken": (r) => {
        try {
          return r.json("clientToken") !== undefined;
        } catch (_) {
          return false;
        }
      },
      "braintree-token: response under 2s": (r) =>
        r.timings.duration < 2000,
    });
    errorRate.add(tokenRes.status >= 500);
  }

  sleep(0.5);
}
