// Alyssa Ong, A0264663X
// Stress Test Phase 1: Breaking-Point Detection (Combined Realistic Traffic)
// Uses ramping-arrival-rate with threshold-based auto-abort
// Assisted by AI
//
// PURPOSE: Rapidly identify the RPS threshold where the system transitions
// from "degraded but functional" to "unacceptable." This phase answers:
//   - At what RPS does P95 latency exceed 5 seconds?
//   - Which endpoint degrades first?
//   - Is the failure CPU-bound (bcrypt) or DB-bound (populate/regex)?
//
// METHODOLOGY: The ramping-arrival-rate executor is an open-model executor
// that targets a specific RPS independently of server response time. If the
// app slows down, k6 allocates more VUs to maintain the target rate. This
// models real demand pressure (e.g., flash sale) more accurately than VU-based
// executors, where achieved RPS drops as response times increase.
//
// AUTO-ABORT: By default, when P95 response time exceeds 5,000ms, the test
// aborts (after a 10s delay to avoid false positives from transient GC
// pauses). The abort RPS is the system's breaking point.
//
// For measurement-focused runs, disable abort and raise timeout to capture
// unclipped tail latency:
//   PHASE1_ABORT_ON_FAIL=false K6_TIMEOUT=30s k6 run ...
//
// TRAFFIC MIX: Weighted random endpoint selection simulates realistic
// e-commerce traffic:
//   - 35% heavy DB reads (products, search, orders)
//   - 20% CPU-bound auth (login, profile update with bcrypt)
//   - 30% light DB reads (categories, count, pagination)
//   - 15% write operations (category creation, product filters)
//
// Run:  k6 run stress-final/stress-test-combined-phase1.js

import { seedTestData, pickRandomEndpoint } from "./helpers.js";

const PHASE1_ABORT_ON_FAIL = __ENV.PHASE1_ABORT_ON_FAIL !== "false";
const PHASE1_ABORT_DELAY = __ENV.PHASE1_ABORT_DELAY || "10s";

// ── Phase 1 Options ──────────────────────────────────────────────────────────
// Bottleneck analysis estimates sustainable mixed throughput at 30-60 RPS:
//   - bcrypt.compare in loginController is CPU-bound (~100ms), blocking the
//     single-threaded event loop
//   - getOrdersController does double .populate() across 3 collections
//   - searchProductController generates N regex patterns per keyword
//
// The ramp uses finer 10-RPS steps in the 30-70 RPS critical zone where
// degradation onset is expected, then coarser steps beyond.
//
// VU sizing (Little's Law): VUs = Target_RPS × Avg_Response_Time(s)
//   At 60 RPS with 2s degraded response → ~120 VUs
//   At 100 RPS with 5s response → ~500 VUs
//   maxVUs=500 is sufficient to observe degradation onset.
export const options = {
  scenarios: {
    combined_phase1: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: "30s", target: 5 },    // Warm-up: baseline metrics
        { duration: "30s", target: 10 },   // Light load
        { duration: "30s", target: 20 },   // Moderate load
        { duration: "30s", target: 30 },   // Entering critical zone
        { duration: "30s", target: 40 },   // Critical zone: fine granularity
        { duration: "30s", target: 50 },   // Critical zone
        { duration: "30s", target: 60 },   // Critical zone: expected breaking point
        { duration: "30s", target: 80 },   // Beyond breaking point
        { duration: "30s", target: 100 },  // Deep stress
        { duration: "30s", target: 120 },  // Deep stress
        { duration: "30s", target: 150 },  // Peak overload
      ],
    },
  },
  thresholds: {
    // Auto-abort when Phase 1 scenario P95 exceeds 5 seconds.
    // Scenario scoping excludes setup/teardown requests from abort logic.
    // The 10s delay prevents premature abort on transient GC pauses.
    "http_req_duration{scenario:combined_phase1}": [
      {
        threshold: "p(95)<5000",
        abortOnFail: PHASE1_ABORT_ON_FAIL,
        delayAbortEval: PHASE1_ABORT_DELAY,
      },
    ],
    // Fail if more than 10% of Phase 1 scenario requests fail.
    "http_req_failed{scenario:combined_phase1}": ["rate<0.1"],
  },
};

// ── Setup: runs once before the test ─────────────────────────────────────────
export function setup() {
  console.log("Phase 1: Setting up test data...");
  const data = seedTestData();
  console.log("Phase 1: Setup complete. Starting breaking-point detection.");
  if (PHASE1_ABORT_ON_FAIL) {
    console.log(`Phase 1: Test will auto-abort when P95 > 5,000ms (delay=${PHASE1_ABORT_DELAY}).`);
  } else {
    console.log("Phase 1: Auto-abort disabled (PHASE1_ABORT_ON_FAIL=false) for full-profile latency measurement.");
  }
  if (!__ENV.K6_TIMEOUT) {
    console.warn("Phase 1 warning: K6_TIMEOUT is not set. Use K6_TIMEOUT=30s to avoid clipping p95 at 5s.");
  }
  return data;
}

// ── Main VU function: runs for each iteration ────────────────────────────────
// Each iteration picks one random endpoint based on the weighted traffic mix.
// This models realistic mixed demand where all endpoint types compete for
// the same event loop and connection pool.
export default function (data) {
  const endpointFn = pickRandomEndpoint();
  endpointFn(data);
}

// ── Teardown: runs once after the test ───────────────────────────────────────
export function teardown(data) {
  console.log("Phase 1: Breaking-point detection complete.");
  if (PHASE1_ABORT_ON_FAIL) {
    console.log("Phase 1: The RPS level at which this test aborted is the system's breaking point.");
  } else {
    console.log("Phase 1: Auto-abort was disabled, so this run captures full-profile degradation instead of a single abort point.");
  }
  console.log("Phase 1: Check per-endpoint *_duration metrics to see which endpoint degraded first.");
}
