#!/usr/bin/env bash
# Ong Xin Hui Lynnette, A0257058X
# Assisted by AI
#
# Exploratory Calibration Runner
#
# Iterates through progressively higher VU levels for each endpoint group
# and saves results to tests/load/results/. Compare metrics across runs
# to identify where response time, throughput, or error rate degrades.
#
# Prerequisites:
#   - k6 installed (brew install k6)
#   - App running on BASE_URL (default: http://localhost:6060)
#   - For auth/checkout tests: a test user must exist
#
# Usage:
#   bash tests/load/run-explore.sh
#   bash tests/load/run-explore.sh login          # run only login ladder
#   bash tests/load/run-explore.sh product        # run only product ladder
#   bash tests/load/run-explore.sh cart            # run only cart ladder
#   bash tests/load/run-explore.sh checkout        # run only checkout ladder

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:6060}"
TEST_EMAIL="${TEST_EMAIL:-test@test.com}"
TEST_PASSWORD="${TEST_PASSWORD:-test1234}"
FILTER="${1:-all}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results/explore"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "=========================================="
echo "  Virtual Vault — Exploratory Calibration"
echo "  BASE_URL : $BASE_URL"
echo "  FILTER   : $FILTER"
echo "  TIMESTAMP: $TIMESTAMP"
echo "=========================================="

echo ""
echo "---------- Health check ----------"
if ! curl -sf "${BASE_URL}/api/v1/product/product-count" -o /dev/null; then
  echo "ERROR: Server is not reachable at ${BASE_URL}."
  echo "       Start the server with 'npm run server' and try again."
  exit 1
fi
echo "Server is up."

echo ""
echo "---------- Seeding test user ----------"
curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Load Test User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"phone\":\"12345678\",\"address\":\"Test Address\",\"answer\":\"test\"}" \
  | grep -q '"success":true' \
  && echo "Test user registered." \
  || echo "Test user already exists (or registration skipped)."

run_ladder() {
  local name="$1"
  local script="$2"
  shift 2
  local levels=("$@")

  echo ""
  echo "=========================================="
  echo "  Calibrating: $name"
  echo "  VU ladder: ${levels[*]}"
  echo "=========================================="

  for vus in "${levels[@]}"; do
    echo ""
    echo "---------- $name @ ${vus} VUs ----------"

    local json_out="${RESULTS_DIR}/${name}_vus${vus}_${TIMESTAMP}.json"

    k6 run \
      --env BASE_URL="$BASE_URL" \
      --env TEST_EMAIL="$TEST_EMAIL" \
      --env TEST_PASSWORD="$TEST_PASSWORD" \
      --env VUS="$vus" \
      --out "json=${json_out}" \
      "$script" \
      && echo "  DONE: $name @ ${vus} VUs" \
      || echo "  THRESHOLD BREACH: $name @ ${vus} VUs — see $json_out"

    echo "  Cooling down (10s)..."
    sleep 10
  done
}

if [[ "$FILTER" == "all" || "$FILTER" == "login" ]]; then
  run_ladder "explore-login" "${SCRIPT_DIR}/explore-login.js" 5 10 20 30 40
fi

if [[ "$FILTER" == "all" || "$FILTER" == "product" ]]; then
  run_ladder "explore-product" "${SCRIPT_DIR}/explore-product.js" 5 10 20 30 40
fi

if [[ "$FILTER" == "all" || "$FILTER" == "cart" ]]; then
  run_ladder "explore-cart" "${SCRIPT_DIR}/explore-cart.js" 3 8 15 20 25
fi

if [[ "$FILTER" == "all" || "$FILTER" == "checkout" ]]; then
  run_ladder "explore-checkout" "${SCRIPT_DIR}/explore-checkout.js" 2 5 10 15 20
fi

echo ""
echo "=========================================="
echo "  Exploratory calibration complete."
echo "  Results: $RESULTS_DIR"
echo ""
echo "  Next steps:"
echo "    1. Compare p95/p99 latency and error_rate across VU levels"
echo "    2. Identify where degradation begins for each endpoint"
echo "    3. Set the final load profile VU ceiling just below that point"
echo "    4. Run: bash tests/load/run-load-tests.sh"
echo "=========================================="
