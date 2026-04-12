#!/usr/bin/env bash
# Ong Xin Hui Lynnette, A0257058X
# Assisted by AI
#
# Final Load Test Runner
#
# Runs the calibrated load test profiles for all four endpoint groups
# and saves JSON results to tests/load/results/.
#
# Prerequisites:
#   - k6 installed (brew install k6)
#   - App running on BASE_URL (default: http://localhost:6060)
#   - Exploratory calibration completed (run-explore.sh)
#   - VU ceilings in load-*.js adjusted based on exploratory results
#
# Usage:
#   bash tests/load/run-load-tests.sh
#   bash tests/load/run-load-tests.sh login      # run only login
#   bash tests/load/run-load-tests.sh product    # run only product
#   bash tests/load/run-load-tests.sh cart        # run only cart
#   bash tests/load/run-load-tests.sh checkout    # run only checkout

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:6060}"
TEST_EMAIL="${TEST_EMAIL:-test@test.com}"
TEST_PASSWORD="${TEST_PASSWORD:-test1234}"
FILTER="${1:-all}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results/final"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "=========================================="
echo "  Virtual Vault — Final Load Tests"
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

run_load() {
  local name="$1"
  local script="$2"

  echo ""
  echo "---------- Running: $name ----------"

  local json_out="${RESULTS_DIR}/${name}_${TIMESTAMP}.json"

  k6 run \
    --env BASE_URL="$BASE_URL" \
    --env TEST_EMAIL="$TEST_EMAIL" \
    --env TEST_PASSWORD="$TEST_PASSWORD" \
    --out "json=${json_out}" \
    "$script" \
    && echo "PASSED: $name" \
    || echo "FAILED (thresholds breached): $name — see $json_out"
}

if [[ "$FILTER" == "all" || "$FILTER" == "login" ]]; then
  run_load "load-login" "${SCRIPT_DIR}/load-login.js"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "product" ]]; then
  run_load "load-product" "${SCRIPT_DIR}/load-product.js"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "cart" ]]; then
  run_load "load-cart" "${SCRIPT_DIR}/load-cart.js"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "checkout" ]]; then
  run_load "load-checkout" "${SCRIPT_DIR}/load-checkout.js"
fi

echo ""
echo "=========================================="
echo "  All final load tests complete."
echo "  Results: $RESULTS_DIR"
echo "=========================================="
