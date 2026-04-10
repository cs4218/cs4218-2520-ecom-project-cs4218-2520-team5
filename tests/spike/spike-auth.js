// Ivan Ang, A0259256U
// Assisted by AI
//
// Spike Test: Authentication Endpoints
// Tests: POST /api/v1/auth/login
//        GET  /api/v1/auth/user-auth   (protected — requires token)
//
// Spike pattern:
//   Warm-up  →  Baseline  →  SPIKE (10x)  →  Recovery  →  Cool-down
//
// This test simulates a flood of concurrent login attempts (e.g. after a
// marketing event where many users try to log in simultaneously).
//
// Run: k6 run tests/spike/spike-auth.js
//      k6 run --env BASE_URL=http://localhost:6060 \
//              --env TEST_EMAIL=test@test.com \
//              --env TEST_PASSWORD=test1234 \
//              tests/spike/spike-auth.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ---------- Custom metrics ----------
const loginDuration = new Trend("login_duration", true);
const authCheckDuration = new Trend("auth_check_duration", true);
const errorRate = new Rate("error_rate");
const loginSuccessRate = new Rate("login_success_rate");
const requestsTotal = new Counter("requests_total");

// ---------- Spike test stages ----------
export const options = {
  stages: [
    // Warm-up
    { duration: "15s", target: 5 },
    // Baseline login load
    { duration: "30s", target: 20 },
    // SPIKE — sudden 10× burst of concurrent login requests
    { duration: "10s", target: 200 },
    // Recovery
    { duration: "30s", target: 20 },
    // Cool-down
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    login_duration: ["p(95)<800"],
    auth_check_duration: ["p(95)<500"],
    error_rate: ["rate<0.05"],
    // Login itself may fail for wrong credentials — track separately
    login_success_rate: ["rate>0.90"],
    http_req_duration: ["p(99)<1500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const TEST_EMAIL = __ENV.TEST_EMAIL || "test@test.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "test1234";

export default function () {
  const headers = { "Content-Type": "application/json" };

  // ---- 1. Login request ----
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    loginPayload,
    { headers, tags: { name: "login" } }
  );

  loginDuration.add(loginRes.timings.duration);
  requestsTotal.add(1);

  const loginOk = check(loginRes, {
    "login: status 200": (r) => r.status === 200,
    "login: has token": (r) => {
      try {
        return typeof r.json("token") === "string";
      } catch (_) {
        return false;
      }
    },
    "login: response under 800ms": (r) => r.timings.duration < 800,
  });

  loginSuccessRate.add(loginOk);
  errorRate.add(loginRes.status >= 500); // only server errors count as failures

  sleep(0.2);

  // ---- 2. Protected auth-check (if login succeeded) ----
  let token = null;
  try {
    token = loginRes.json("token");
  } catch (_) {
    // token unavailable — skip protected endpoint
  }

  if (token) {
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: token,
    };

    const authRes = http.get(`${BASE_URL}/api/v1/auth/user-auth`, {
      headers: authHeaders,
      tags: { name: "user-auth" },
    });

    authCheckDuration.add(authRes.timings.duration);
    requestsTotal.add(1);

    check(authRes, {
      "user-auth: status 200": (r) => r.status === 200,
      "user-auth: ok flag true": (r) => {
        try {
          return r.json("ok") === true;
        } catch (_) {
          return false;
        }
      },
      "user-auth: response under 500ms": (r) => r.timings.duration < 500,
    });

    errorRate.add(authRes.status >= 400); // only actual HTTP errors, not latency misses
  }

  sleep(0.3);
}
