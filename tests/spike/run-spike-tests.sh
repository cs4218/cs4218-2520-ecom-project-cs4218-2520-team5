#!/usr/bin/env bash
# Ivan Ang, A0259256U
#
# Runs all k6 spike tests and saves JSON + HTML reports to tests/spike/results/.
#
# Prerequisites:
#   - k6 installed (brew install k6)
#   - App running on BASE_URL (default: http://localhost:6060)
#   - For auth test: a test user must exist
#       POST /api/v1/auth/register { name, email, password, phone, address, answer }
#
# Usage:
#   bash tests/spike/run-spike-tests.sh
#   BASE_URL=http://localhost:6060 TEST_EMAIL=admin@test.com TEST_PASSWORD=password123 bash tests/spike/run-spike-tests.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:6060}"
TEST_EMAIL="${TEST_EMAIL:-test@test.com}"
TEST_PASSWORD="${TEST_PASSWORD:-test1234}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "=========================================="
echo "  Virtual Vault — Spike Tests"
echo "  BASE_URL : $BASE_URL"
echo "  TIMESTAMP: $TIMESTAMP"
echo "=========================================="

# Health check — fail fast if the server is not reachable
echo ""
echo "---------- Health check ----------"
if ! curl -sf "${BASE_URL}/api/v1/product/product-count" -o /dev/null; then
  echo "ERROR: Server is not reachable at ${BASE_URL}."
  echo "       Start the server with 'npm run server' and try again."
  exit 1
fi
echo "Server is up."

# Ensure the test user exists (idempotent — silently ignored if already registered)
echo ""
echo "---------- Seeding test user ----------"
curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Spike Test User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"phone\":\"12345678\",\"address\":\"Test Address\",\"answer\":\"test\"}" \
  | grep -q '"success":true' \
  && echo "Test user registered." \
  || echo "Test user already exists (or registration skipped)."

run_spike() {
  local name="$1"
  local script="$2"
  local extra_env="${3:-}"

  echo ""
  echo "---------- Running: $name ----------"

  local json_out="${RESULTS_DIR}/${name}_${TIMESTAMP}.json"

  k6 run \
    --env BASE_URL="$BASE_URL" \
    --env TEST_EMAIL="$TEST_EMAIL" \
    --env TEST_PASSWORD="$TEST_PASSWORD" \
    ${extra_env} \
    --out "json=${json_out}" \
    "$script" \
    && echo "PASSED: $name" \
    || echo "FAILED (thresholds breached): $name — see $json_out"
}

run_spike "spike-categories" "${SCRIPT_DIR}/spike-categories.js"
run_spike "spike-products"   "${SCRIPT_DIR}/spike-products.js"
run_spike "spike-auth"       "${SCRIPT_DIR}/spike-auth.js"

echo ""
echo "=========================================="
echo "  All spike tests complete."
echo "  Results: $RESULTS_DIR"
echo "=========================================="
