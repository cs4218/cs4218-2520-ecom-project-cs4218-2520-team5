// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Exploratory Calibration: Checkout Endpoints
// Endpoints: POST /api/v1/auth/login     (authenticate before checkout)
//            GET  /api/v1/product/braintree/token  (payment client token)
//
// --- Why these endpoints ---
// Checkout is the most sensitive flow — it involves authentication
// (bcrypt), then contacts the external Braintree payment gateway for a
// client token. This external dependency makes it slower and more
// resource-constrained than purely local endpoints.
//
// --- How to use this script ---
// Run this script repeatedly at increasing VU counts to observe where
// degradation begins. Lower VU ceiling than other endpoints because
// checkout involves external network calls and the natural conversion
// funnel means fewer users reach checkout than browse products.
// Suggested ladder: 2, 5, 10, 15, 20 VUs.
//
// --- Metrics and thresholds ---
//   - http_req_duration p(90) < 1500ms (overall)
//   - http_req_failed rate < 1%
//   - checkout_login_duration p(90) < 800ms
//   - braintree_token_duration p(90) < 2000ms
//   - error_rate < 10% (lenient — Braintree may error without credentials)
//
// Run:
//   k6 run --env VUS=2  tests/load/explore-checkout.js
//   k6 run --env VUS=5  tests/load/explore-checkout.js
//   k6 run --env VUS=10 tests/load/explore-checkout.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const loginDuration = new Trend("checkout_login_duration", true);
const tokenDuration = new Trend("braintree_token_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

const VUS = parseInt(__ENV.VUS || "2", 10);

export const options = {
  stages: [
    { duration: "15s", target: VUS },
    { duration: "1m", target: VUS },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    checkout_login_duration: ["p(90)<800"],
    braintree_token_duration: ["p(90)<2000"],
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
      "braintree-token: response under 2s": (r) =>
        r.timings.duration < 2000,
    });
    errorRate.add(tokenRes.status >= 500);
  }

  sleep(0.5);
}
