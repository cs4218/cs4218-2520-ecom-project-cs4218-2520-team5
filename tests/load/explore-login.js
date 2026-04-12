// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Exploratory Calibration: Login Endpoint
// Endpoint: POST /api/v1/auth/login
//
// --- Why this endpoint ---
// Login is CPU-intensive due to bcrypt hashing. It is the gateway to all
// authenticated flows and the most likely single-endpoint bottleneck.
//
// --- How to use this script ---
// Run this script repeatedly at increasing VU counts to observe where
// response time, throughput, or error rate begins to degrade.
// Suggested ladder: 5, 10, 20, 30, 40 VUs.
//
// --- Metrics and thresholds ---
// Thresholds here are intentionally generous — the purpose is to observe
// trends, not to enforce pass/fail. A threshold breach at a given VU
// level signals the onset of degradation.
//   - http_req_duration p(90) < 1500ms (overall)
//   - http_req_failed rate < 1%
//   - login_duration p(90) < 800ms (per-endpoint)
//   - error_rate < 5%
//   - login_success_rate > 90%
//
// Run:
//   k6 run --env VUS=5  tests/load/explore-login.js
//   k6 run --env VUS=10 tests/load/explore-login.js
//   k6 run --env VUS=20 tests/load/explore-login.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const loginDuration = new Trend("login_duration", true);
const errorRate = new Rate("error_rate");
const loginSuccessRate = new Rate("login_success_rate");
const requestsTotal = new Counter("requests_total");

const VUS = parseInt(__ENV.VUS || "5", 10);

export const options = {
  stages: [
    { duration: "15s", target: VUS },
    { duration: "1m", target: VUS },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    login_duration: ["p(90)<800"],
    error_rate: ["rate<0.05"],
    login_success_rate: ["rate>0.90"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const TEST_EMAIL = __ENV.TEST_EMAIL || "test@test.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "test1234";

export default function () {
  const headers = { "Content-Type": "application/json" };
  const payload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
    headers,
    tags: { name: "login" },
  });

  loginDuration.add(res.timings.duration);
  requestsTotal.add(1);

  const succeeded =
    res.status === 200 &&
    (() => {
      try {
        return typeof res.json("token") === "string";
      } catch (_) {
        return false;
      }
    })();

  check(res, {
    "login: status 200": (r) => r.status === 200,
    "login: has token": (r) => {
      try {
        return typeof r.json("token") === "string";
      } catch (_) {
        return false;
      }
    },
    "login: response under 1500ms": (r) => r.timings.duration < 1500,
  });

  loginSuccessRate.add(succeeded);
  errorRate.add(res.status >= 500);

  sleep(0.5);
}
