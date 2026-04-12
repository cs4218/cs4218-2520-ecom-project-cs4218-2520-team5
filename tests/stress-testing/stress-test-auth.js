// Alyssa Ong, A0264663X
// Stress Test — Authentication Endpoints (Component Isolation)
// Uses ramping-arrival-rate to stress CPU-bound auth operations
// Assisted by AI
//
// This test isolates auth endpoints to determine whether bcrypt's CPU cost
// is the primary system bottleneck. Node.js is single-threaded; bcrypt.compare
// and bcrypt.hash consume ~100ms of synchronous CPU per call, blocking the
// entire event loop. Under concurrent auth requests, ALL other endpoints
// (even lightweight reads) queue behind the blocked event loop.
//
// Endpoints tested:
//   POST /api/v1/auth/register       — bcrypt.hash (10 salt rounds)
//   POST /api/v1/auth/login          — bcrypt.compare
//   POST /api/v1/auth/forgot-password — bcrypt.hash for new password
//
// The full auth flow (register → login → forgot-password → re-login)
// is tested per iteration to exercise the sequential dependency chain
// and trigger multiple bcrypt operations.
//
// Run:  k6 run stress-final/stress-test-auth.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { BASE_URL, metrics, TIMEOUT } from "./helpers.js";

// ── Component-specific metrics ─────────────────────────────────────
const registerFailRate = new Rate("register_fail_rate");
const loginFailRate    = new Rate("login_fail_rate");
const forgotPwFailRate = new Rate("forgot_pw_fail_rate");

// ── Arrival-rate stress profile ────────────────────────────────────
// Auth is the most CPU-expensive component. Each iteration triggers
// 3-4 bcrypt operations (~300-400ms of synchronous CPU).
//
// RPS targets are lower than other components because:
//   - At 10 iter/s × 3 bcrypt calls = 30 bcrypt calls/s
//   - At ~100ms per bcrypt call, 30 calls/s would require ~3 CPU cores
//     but Node.js has 1 thread → event loop saturates at ~10 iter/s
//
// VU sizing (Little's Law): VUs = Target_RPS × Avg_Response_Time(s)
//   At 10 iter/s with 1s response → 10 VUs
//   At 25 iter/s with 3s degraded → 75 VUs
//   At 40 iter/s with 5s collapsed → 200 VUs (add headroom)
export const options = {
  scenarios: {
    auth_stress: {
      executor: "ramping-arrival-rate",
      startRate: 2,
      timeUnit: "1s",
      preAllocatedVUs: 30,
      maxVUs: 300,
      stages: [
        { duration: "30s", target: 2 },    // Warm-up
        { duration: "30s", target: 5 },    // Light load
        { duration: "30s", target: 10 },   // Moderate — event loop pressure starts
        { duration: "60s", target: 15 },   // Critical zone (extended hold)
        { duration: "60s", target: 20 },   // Critical zone (extended hold)
        { duration: "60s", target: 25 },   // Critical zone (extended hold)
        { duration: "60s", target: 30 },   // Beyond breaking point
        { duration: "90s", target: 40 },   // Sustained peak hold
        { duration: "60s", target: 20 },   // Recovery: reduced load
        { duration: "30s", target: 5 },    // Recovery: near-baseline
        { duration: "30s", target: 0 },    // Recovery: ramp to zero
      ],
    },
  },
  thresholds: {
    "http_req_duration{scenario:auth_stress}": ["p(95)<5000"],
    register_fail_rate: ["rate<0.5"],
    login_fail_rate: ["rate<0.5"],
    "http_req_failed{scenario:auth_stress}": ["rate<0.5"],
  },
};

const headers = { "Content-Type": "application/json" };

// ── Default function — one full auth flow per iteration ─────────────
export default function () {
  const unique = `${__VU}_${__ITER}_${Date.now()}`;

  // ── 1. Register a new user ────────────────────────────────────────
  const regPayload = JSON.stringify({
    name: `Stress Auth ${unique}`,
    email: `stress_auth_${unique}@test.com`,
    password: "Test@12345",
    phone: "91234567",
    address: "Stress Test Address",
    answer: "soccer",
  });

  const regRes = http.post(`${BASE_URL}/api/v1/auth/register`, regPayload, {
    headers,
    tags: { name: "POST /auth/register" },
    timeout: TIMEOUT,
  });
  metrics.register.add(regRes.timings.duration);
  const regOk = check(regRes, {
    "register status 201": (r) => r.status === 201,
  });
  registerFailRate.add(!regOk);
  metrics.failRate.add(!regOk);

  sleep(0.3);

  // ── 2. Login with the registered user ─────────────────────────────
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: `stress_auth_${unique}@test.com`,
      password: "Test@12345",
    }),
    { headers, tags: { name: "POST /auth/login" }, timeout: TIMEOUT }
  );
  metrics.login.add(loginRes.timings.duration);
  const loginOk = check(loginRes, {
    "login status 200": (r) => r.status === 200,
    "login returns token": (r) => {
      try { return !!JSON.parse(r.body).token; } catch { return false; }
    },
  });
  loginFailRate.add(!loginOk);
  metrics.failRate.add(!loginOk);

  sleep(0.3);

  // ── 3. Forgot password ───────────────────────────────────────────
  const forgotRes = http.post(
    `${BASE_URL}/api/v1/auth/forgot-password`,
    JSON.stringify({
      email: `stress_auth_${unique}@test.com`,
      answer: "soccer",
      newPassword: "NewPass@12345",
    }),
    { headers, tags: { name: "POST /auth/forgot-password" }, timeout: TIMEOUT }
  );
  metrics.forgotPassword.add(forgotRes.timings.duration);
  const forgotOk = check(forgotRes, {
    "forgot-password status 200": (r) => r.status === 200,
  });
  forgotPwFailRate.add(!forgotOk);
  metrics.failRate.add(!forgotOk);

  // ── 4. Verify login with new password ─────────────────────────────
  if (forgotOk) {
    sleep(0.2);
    const reLoginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        email: `stress_auth_${unique}@test.com`,
        password: "NewPass@12345",
      }),
      { headers, tags: { name: "POST /auth/login (after reset)" }, timeout: TIMEOUT }
    );
    check(reLoginRes, {
      "re-login after reset status 200": (r) => r.status === 200,
    });
  }

  sleep(0.3);
}
