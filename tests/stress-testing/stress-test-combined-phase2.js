// Alyssa Ong, A0264663X
// Stress Test Phase 2: Collapse Observation (Combined Realistic Traffic)
// Runs beyond the breaking point WITHOUT auto-abort to observe full collapse
// Assisted by AI
//
// PURPOSE: Observe complete system failure behaviour beyond the breaking
// point identified in Phase 1. This phase answers:
//   - Does the system fail gradually or cliff suddenly?
//   - Does throughput plateau, collapse, or oscillate?
//   - Do VUs spike as k6 tries to maintain target RPS?
//   - Do dropped_iterations appear (k6 ran out of VUs)?
//   - Is the failure mode CPU saturation, DB connection queuing, or broad collapse?
//   - Does the system recover after load drops?
//
// METHODOLOGY: Same ramping-arrival-rate pattern as Phase 1, but:
//   - NO auto-abort — the test runs through all stages regardless
//   - Higher maxVUs (2,000) — allows deeper observation before VU exhaustion
//   - Sustained peak (60s at 150 RPS) — observes steady-state collapse
//   - Recovery ramp-down (60s to 0 RPS) — tests post-stress recovery
//
// KEY COLLAPSE INDICATORS:
//   - dropped_iterations > 0: k6 exhausted all VUs, cannot maintain target RPS
//   - vus hitting vus_max: all VUs are occupied, new iterations wait/drop
//   - http_req_duration climbing with flat http_reqs: pure latency inflation
//   - failed_requests rate climbing: server returning errors, not just slow
//
// Run:  K6_TIMEOUT=30s K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_PERIOD=1s K6_WEB_DASHBOARD_EXPORT=combined-phase2-report.html k6 run stress-final/stress-test-combined-phase2.js

import { seedTestData, pickRandomEndpoint } from "./helpers.js";

const PHASE2_SETUP_TIMEOUT = __ENV.K6_SETUP_TIMEOUT || "180s";

// ── Phase 2 Options ──────────────────────────────────────────────────────────
// Removes auto-abort and raises VU ceiling to 2,000.
// Run with K6_TIMEOUT=30s to capture true unclipped latency (not capped at 5s).
// This allows full observation of cascade failure, true latency distributions,
// and VU exhaustion under sustained overload.
//
// VU sizing (Little's Law):
//   At 150 RPS with 15s uncapped response → ~2,250 VUs needed
//   maxVUs=2,000 accommodates VUs stuck in long-running requests when
//   TIMEOUT is raised. Dropped iterations are still a collapse indicator.
//
// Stage durations extended to 60s in the critical zone (30–80 RPS) to allow
// slow-onset symptoms (memory pressure, connection pool exhaustion, GC
// thrashing) to fully manifest — these take 60–90s to surface.
export const options = {
  setupTimeout: PHASE2_SETUP_TIMEOUT,
  scenarios: {
    combined_phase2: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 2000,
      stages: [
        { duration: "30s", target: 5 },    // Warm-up: baseline metrics
        { duration: "30s", target: 10 },   // Light load
        { duration: "30s", target: 20 },   // Moderate load
        { duration: "60s", target: 30 },   // Entering critical zone (extended)
        { duration: "60s", target: 40 },   // Critical zone (extended)
        { duration: "60s", target: 50 },   // Critical zone (extended)
        { duration: "60s", target: 60 },   // Expected breaking point (extended)
        { duration: "60s", target: 80 },   // Beyond breaking point (extended)
        { duration: "60s", target: 100 },  // Deep stress (extended)
        { duration: "60s", target: 120 },  // Deep stress (extended)
        { duration: "60s", target: 150 },  // Peak overload (extended)
        { duration: "90s", target: 150 },  // Sustained peak — observe full collapse (extended)
        { duration: "60s", target: 80 },   // Recovery: half-load (extended)
        { duration: "30s", target: 30 },   // Recovery: reduced load
        { duration: "30s", target: 5 },    // Recovery: near-baseline
        { duration: "30s", target: 0 },    // Recovery: ramp to zero
      ],
    },
  },
  thresholds: {
    // No auto-abort — lenient thresholds allow full observation of collapse.
    // Scenario scoping excludes setup/teardown requests from threshold evaluation.
    "http_req_duration{scenario:combined_phase2}": ["p(95)<30000"],
    "http_req_failed{scenario:combined_phase2}": ["rate<0.95"],
    // SLA breach tracks % of requests exceeding 5s user-patience threshold.
    // This replaces the role the 5s timeout-based failures used to play.
    sla_breach_rate: ["rate<0.8"],
  },
};

// ── Setup: runs once before the test ─────────────────────────────────────────
export function setup() {
  console.log("Phase 2: Setting up test data...");
  console.log(`Phase 2: setupTimeout=${PHASE2_SETUP_TIMEOUT}`);
  if (!__ENV.K6_TIMEOUT) {
    console.warn("Phase 2 warning: K6_TIMEOUT is not set. Use K6_TIMEOUT=30s to avoid clipping collapsed latency.");
  }
  const data = seedTestData();
  console.log("Phase 2: Setup complete. Running extended collapse observation (no auto-abort).");
  console.log("Phase 2: This test includes a sustained peak and recovery phase.");
  return data;
}

// ── Main VU function: runs for each iteration ────────────────────────────────
export default function (data) {
  const endpointFn = pickRandomEndpoint();
  endpointFn(data);
}

// ── Teardown: runs once after the test ───────────────────────────────────────
export function teardown(data) {
  console.log("Phase 2: Collapse observation complete.");
  console.log("Phase 2: Key metrics to review:");
  console.log("  - failed_requests rate: proportion of non-2xx responses");
  console.log("  - dropped_iterations: iterations k6 couldn't attempt (VU exhaustion)");
  console.log("  - vus_max: peak concurrent virtual users used");
  console.log("  - Per-endpoint *_duration: which endpoints collapsed first");
  console.log("  - Recovery: did metrics return to baseline after ramp-down?");
}
