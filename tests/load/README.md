# Load Testing — Two-Phase Methodology

**Author:** Ong Xin Hui Lynnette (A0257058X)
**Tool:** [Grafana k6](https://k6.io)
**Location:** `tests/load/` (consistent with project convention: `tests/spike/`, `tests/volume/`, etc.)

---

## Why empirical calibration matters

When no official traffic target or SLA is given for a system, it is tempting to pick a round number of virtual users (e.g. 20 VUs) and call it a load test. This approach is fragile: the chosen level may be far below the point where performance begins to degrade, producing a meaninglessly optimistic report, or it may overshoot into stress-test territory and conflate load behaviour with failure behaviour.

**The VU limits used in these tests are justified empirically, not assumed.** Rather than guessing what "normal load" looks like, we first run short exploratory trials at progressively higher concurrency levels and observe where response time, throughput, or error rate begins to deteriorate. The final load profiles are then calibrated to span from a comfortable baseline up to — but not past — the onset of degradation.

The goal of load testing is to identify the point where performance starts to deteriorate under expected load, not necessarily to find the absolute breaking point. That distinction belongs to stress testing. Load testing answers the question: "How does the system behave under the realistic upper range of normal traffic?"

---

## Why load testing the same endpoints as spike/volume/soak is valid

Other team members may test some of the same API endpoints using different non-functional test types (spike, volume, soak). This does **not** make load testing redundant. Each test type answers a fundamentally different question:

| Test Type | Question It Answers | Load Pattern |
|-----------|-------------------|-------------|
| **Load** | How does the system perform under sustained, expected traffic? | Gradual ramp to realistic concurrency |
| **Spike** | Can the system survive a sudden, extreme traffic burst? | Abrupt 10x jump, then recovery |
| **Volume** | Does the system handle large data volumes correctly? | Seed thousands of records, then query |
| **Soak** | Does performance degrade over extended periods? | Constant load for hours |
| **Stress** | Where does the system break under extreme load? | Escalate until failure |

Load testing specifically measures **steady-state performance under realistic concurrency**. The same `/api/v1/auth/login` endpoint tested in a spike test (200 VU burst for 10 seconds) behaves very differently under a load test (gradual ramp to 30 VUs sustained for 2 minutes). Spike testing reveals crash-and-recovery resilience; load testing reveals whether baseline latency is acceptable and where the performance knee occurs.

---

## Phase 1: Exploratory Calibration

### Purpose

Run short, fixed-duration trials at progressively higher VU counts to build an empirical picture of each endpoint's capacity curve. For each step in the ladder, record:

- **p50 / p90 / p95 / p99 response time** — does latency jump at a specific VU level?
- **Throughput (requests/sec)** — does it plateau or drop?
- **Error rate** — does it cross the 1–5% threshold?
- **Threshold breaches** — does k6 report any threshold failures?

### VU Ladders

Each endpoint group has its own ladder, reflecting expected relative traffic volume:

| Endpoint Group | Script | VU Ladder |
|----------------|--------|-----------|
| Login | `explore-login.js` | 5, 10, 20, 30, 40 |
| Product listing & search | `explore-product.js` | 5, 10, 20, 30, 40 |
| Cart (browse & filter) | `explore-cart.js` | 3, 8, 15, 20, 25 |
| Checkout (auth + payment token) | `explore-checkout.js` | 2, 5, 10, 15, 20 |

Each trial runs for approximately 1 minute 25 seconds (15s ramp-up, 1m sustained, 10s ramp-down) with a 10-second cooldown between steps.

### How to run

```bash
# Run all ladders (takes ~30 minutes)
bash tests/load/run-explore.sh

# Run a single endpoint ladder
bash tests/load/run-explore.sh login
bash tests/load/run-explore.sh product
bash tests/load/run-explore.sh cart
bash tests/load/run-explore.sh checkout

# Override defaults
BASE_URL=http://localhost:6060 \
TEST_EMAIL=user@example.com \
TEST_PASSWORD=secret123 \
bash tests/load/run-explore.sh
```

Results are saved as JSON to `tests/load/results/explore/`.

### Interpreting results

After running the ladder, compare the k6 summary output across VU levels. Look for:

1. **Latency inflection** — p95 response time stays flat at low VU counts, then rises sharply. The VU level just before the sharp rise is your upper-normal ceiling.
2. **Throughput plateau** — requests/sec increases linearly with VUs, then flattens. The plateau point indicates saturation.
3. **Error cliff** — error rate stays near 0% then suddenly jumps. This is your hard ceiling (for stress testing, not load testing).

Example interpretation:

```
Login endpoint:
  5 VUs  → p95 = 120ms, errors = 0%     ← baseline
  10 VUs → p95 = 135ms, errors = 0%     ← linear scaling
  20 VUs → p95 = 210ms, errors = 0%     ← still healthy
  30 VUs → p95 = 480ms, errors = 0.2%   ← degradation begins
  40 VUs → p95 = 920ms, errors = 3.1%   ← beyond load territory

  → Set final load ceiling at ~25 VUs (below 30 VU degradation onset)
```

---

## Phase 2: Final Report Runs

### Purpose

After exploratory calibration reveals where degradation begins, configure a gradual ramp profile for each endpoint that spans from a comfortable baseline up to the empirically-determined upper-normal load. This profile produces the metrics used in the final report.

### Default Ramp Profiles

These defaults are starting points. **Adjust the VU targets in each `load-*.js` file** based on your actual exploratory results.

**Login** (`load-login.js`):

| Stage | Duration | VU Target | Purpose |
|-------|----------|-----------|---------|
| Ramp-up | 30s | 5 | Warm caches, establish connections |
| Step 1 | 1m | 10 | Light load baseline |
| Step 2 | 1m | 20 | Moderate load |
| Step 3 | 1m | 30 | Upper-normal load |
| Sustain | 2m | 30 | Hold for stable measurement |
| Ramp-down | 30s | 0 | Graceful wind-down |

**Product listing & search** (`load-product.js`):

| Stage | Duration | VU Target |
|-------|----------|-----------|
| Ramp-up | 30s | 5 |
| Step 1 | 1m | 10 |
| Step 2 | 1m | 20 |
| Step 3 | 1m | 30 |
| Sustain | 2m | 30 |
| Ramp-down | 30s | 0 |

**Cart (browse & filter)** (`load-cart.js`):

| Stage | Duration | VU Target |
|-------|----------|-----------|
| Ramp-up | 30s | 3 |
| Step 1 | 1m | 8 |
| Step 2 | 1m | 15 |
| Step 3 | 1m | 20 |
| Sustain | 2m | 20 |
| Ramp-down | 30s | 0 |

**Checkout (auth + payment token)** (`load-checkout.js`):

| Stage | Duration | VU Target |
|-------|----------|-----------|
| Ramp-up | 30s | 2 |
| Step 1 | 1m | 5 |
| Step 2 | 1m | 10 |
| Step 3 | 1m | 15 |
| Sustain | 2m | 15 |
| Ramp-down | 30s | 0 |

### How to run

```bash
# Run all final load tests
bash tests/load/run-load-tests.sh

# Run a single endpoint
bash tests/load/run-load-tests.sh login
bash tests/load/run-load-tests.sh product
bash tests/load/run-load-tests.sh cart
bash tests/load/run-load-tests.sh checkout

# Or use npm scripts
npm run test:load
npm run test:load:login
npm run test:load:product
npm run test:load:cart
npm run test:load:checkout
```

Results are saved as JSON to `tests/load/results/final/`.

### Thresholds

All scripts enforce two universal thresholds from the original test plan, plus per-endpoint thresholds:

**Universal (all scripts):**
- `http_req_duration p(90) < 1500ms` — 90th percentile of all HTTP requests must stay under 1.5 seconds
- `http_req_failed rate < 0.01` — fewer than 1% of HTTP requests may return non-2xx/3xx status codes

**Per-endpoint:**

| Test | Endpoint Thresholds |
|------|---------------|
| Login | `login_duration p(90) < 800ms`, `error_rate < 5%`, `login_success_rate > 95%` |
| Product | `product_list_duration p(90) < 600ms`, `search_duration p(90) < 700ms`, `error_rate < 5%` |
| Cart | `product_fetch_duration p(90) < 600ms`, `filter_duration p(90) < 700ms`, `error_rate < 5%` |
| Checkout | `checkout_login_duration p(90) < 800ms`, `braintree_token_duration p(90) < 2000ms`, `error_rate < 10%` |

### How to interpret threshold results

k6 prints a pass/fail summary for each threshold at the end of a run. Example:

```
✓ http_req_duration.............: avg=142ms  min=45ms  p(90)=312ms  p(95)=425ms
✓ http_req_failed...............: 0.00%  ✓ 0  ✗ 1847
✗ login_duration................: avg=389ms  min=102ms p(90)=856ms  p(95)=1.1s
```

- A **✓** means the metric stayed within the threshold for the entire run.
- A **✗** means the threshold was breached — the metric exceeded the limit at some point during the test. This is the key signal: it means the system could not sustain acceptable performance at the tested load level.

When a threshold breaches during a final load test, consider:
1. Is the VU ceiling too high? Re-run exploratory calibration to confirm.
2. Is the threshold too tight? Compare against real user expectations.
3. Is the system genuinely degrading? Profile the bottleneck (CPU, DB, network).

---

## Metrics to Record for the Report

For each final load test run, record the following from the k6 end-of-run summary:

| Metric | What to Record | Source |
|--------|---------------|--------|
| **P90 response time** | `p(90)` value from `http_req_duration` and per-endpoint custom Trends | k6 summary |
| **Average response time** | `avg` value from `http_req_duration` | k6 summary |
| **Throughput** | `http_reqs` count and rate (requests/second) | k6 summary |
| **Error rate** | `http_req_failed` percentage and `error_rate` custom metric | k6 summary |
| **VU peak** | Maximum concurrent VUs during the test | k6 summary (`vus_max`) |
| **Threshold pass/fail** | Which thresholds passed (✓) and failed (✗) | k6 summary |

These six data points, collected for each endpoint group, provide a complete picture of system behaviour under load.

---

## File Inventory

| File | Purpose |
|------|---------|
| `explore-login.js` | Exploratory calibration for login |
| `explore-product.js` | Exploratory calibration for product listing & search |
| `explore-cart.js` | Exploratory calibration for cart-related endpoints |
| `explore-checkout.js` | Exploratory calibration for checkout flow |
| `load-login.js` | Final load test for login |
| `load-product.js` | Final load test for product listing & search |
| `load-cart.js` | Final load test for cart-related endpoints |
| `load-checkout.js` | Final load test for checkout flow |
| `run-explore.sh` | Orchestrates all exploratory calibration ladders |
| `run-load-tests.sh` | Orchestrates all final load test runs |
| `results/explore/` | JSON output from exploratory runs |
| `results/final/` | JSON output from final report runs |

---

## Prerequisites

1. **k6 installed**: `brew install k6`
2. **Server running** on port 6060: `npm run server`
3. **Test user registered** in the database (the shell scripts handle this automatically)
4. **Braintree credentials** configured in `.env` (for checkout tests; token endpoint will return errors without valid gateway credentials, which is itself a useful data point)
