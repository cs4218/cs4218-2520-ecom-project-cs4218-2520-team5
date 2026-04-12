// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Load Test (Final Report Run): Login Endpoint
// Endpoint: POST /api/v1/auth/login
//
// --- Why this endpoint ---
// Login is the most CPU-intensive endpoint due to bcrypt password hashing.
// Under concurrent load, bcrypt's intentional slowness can saturate the
// event loop. It is also the gateway to all authenticated flows, so its
// latency directly affects the perceived speed of the entire application.
//
// --- Why these load stages ---
// The gradual ramp avoids confounding warm-up effects with steady-state
// behaviour. Each step is held long enough (~1 min) to collect stable
// percentile data. The VU ceiling (default 30) should be set just below
// the degradation onset identified during exploratory calibration.
//   Ramp-up   → 5 VUs  (warm caches and connection pools)
//   Step 1    → 10 VUs (light baseline — measure healthy latency)
//   Step 2    → 20 VUs (moderate load — detect early degradation)
//   Step 3    → 30 VUs (upper-normal — ceiling from calibration)
//   Sustain   → 30 VUs (hold for 2 min — stable measurement window)
//   Ramp-down → 0 VUs  (graceful wind-down)
//
// --- Metrics and thresholds ---
// Primary metrics collected:
//   - login_duration (custom Trend): p90 response time per login request
//   - http_req_duration (built-in):  p90 across all HTTP requests
//   - http_req_failed (built-in):    fraction of non-2xx/3xx responses
//   - error_rate (custom Rate):      fraction of 5xx server errors
//   - login_success_rate (custom):   fraction of logins returning a token
//   - requestsTotal (custom):        total request throughput
//
// Run:
//   k6 run tests/load/load-login.js
//   k6 run --env BASE_URL=http://localhost:6060 tests/load/load-login.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const loginDuration = new Trend("login_duration", true);
const errorRate = new Rate("error_rate");
const loginSuccessRate = new Rate("login_success_rate");
const requestsTotal = new Counter("requests_total");

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 10 },
    { duration: "1m", target: 20 },
    { duration: "1m", target: 30 },
    { duration: "2m", target: 30 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    login_duration: ["p(50)<400", "p(90)<800", "p(95)<1000", "p(99)<1200"],
    error_rate: ["rate<0.05"],
    login_success_rate: ["rate>0.95"],
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
