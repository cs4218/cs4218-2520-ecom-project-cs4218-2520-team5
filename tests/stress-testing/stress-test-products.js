// Alyssa Ong, A0264663X
// Stress Test — Product Endpoints (Component Isolation)
// Uses ramping-arrival-rate to stress database-heavy product operations
// Assisted by AI
//
// This test isolates product endpoints to determine how DB-heavy queries
// behave under rising demand. Product browsing is the highest-traffic
// activity in e-commerce. Key bottlenecks:
//   - searchProductController: generates N regex patterns per keyword,
//     runs $or across name + description — regex cannot use standard indexes
//   - getProductController: .populate("category").sort().limit(12)
//   - relatedProductController: .populate("category") with $ne exclusion
//
// Each iteration simulates a complete browsing session:
//   get-product → product-count → product-list → search → filters →
//   single-product → related-product → product-category
//
// Run:  k6 run stress-final/stress-test-products.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { BASE_URL, metrics, SEARCH_KEYWORDS, seedTestData, authHeaders, TIMEOUT } from "./helpers.js";

// ── Component-specific metrics ─────────────────────────────────────
const productListFailRate = new Rate("product_list_fail_rate");
const searchFailRate      = new Rate("search_fail_rate");
const filterFailRate      = new Rate("filter_fail_rate");

// ── Arrival-rate stress profile ────────────────────────────────────
// Products are I/O-bound (waiting on MongoDB), so Node.js can pipeline
// more concurrency than CPU-bound auth. Each iteration makes ~8 HTTP
// calls, so effective HTTP RPS ≈ 8 × iteration rate.
//
// VU sizing (Little's Law): VUs = Target_RPS × Avg_Response_Time(s)
//   At 15 iter/s with 2s response → 30 VUs
//   At 40 iter/s with 5s degraded → 200 VUs
//   At 60 iter/s with 8s collapsed → 480 VUs (add headroom)
export const options = {
  scenarios: {
    products_stress: {
      executor: "ramping-arrival-rate",
      startRate: 3,
      timeUnit: "1s",
      preAllocatedVUs: 30,
      maxVUs: 500,
      stages: [
        { duration: "30s", target: 3 },    // Warm-up
        { duration: "30s", target: 8 },    // Light load
        { duration: "30s", target: 15 },   // Moderate load
        { duration: "60s", target: 25 },   // Critical zone (extended hold)
        { duration: "60s", target: 35 },   // Critical zone (extended hold)
        { duration: "60s", target: 45 },   // Critical zone (extended hold)
        { duration: "60s", target: 55 },   // Beyond breaking point
        { duration: "60s", target: 65 },   // Deep stress
        { duration: "90s", target: 65 },   // Sustained peak hold
        { duration: "60s", target: 30 },   // Recovery: reduced load
        { duration: "30s", target: 10 },   // Recovery: near-baseline
        { duration: "30s", target: 0 },    // Recovery: ramp to zero
      ],
    },
  },
  thresholds: {
    "http_req_duration{scenario:products_stress}": ["p(95)<5000"],
    product_list_fail_rate: ["rate<0.3"],
    search_fail_rate: ["rate<0.5"],
    "http_req_failed{scenario:products_stress}": ["rate<0.3"],
  },
};

const headers = { "Content-Type": "application/json" };

// ── Setup — fetch existing products & categories once ───────────────
export function setup() {
  return seedTestData();
}

// ── Default function — full product browsing session per iteration ───
export default function (data) {
  const { products, categories } = data;

  // ── 1. Get all products ───────────────────────────────────────────
  group("GET /product/get-product", () => {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { name: "GET /product/get-product" },
      timeout: TIMEOUT,
    });
    metrics.getProducts.add(res.timings.duration);
    const ok = check(res, {
      "get-product 200": (r) => r.status === 200,
    });
    productListFailRate.add(!ok);
    metrics.failRate.add(!ok);
  });

  sleep(0.2);

  // ── 2. Product count ──────────────────────────────────────────────
  group("GET /product/product-count", () => {
    const res = http.get(`${BASE_URL}/api/v1/product/product-count`, {
      tags: { name: "GET /product/product-count" },
      timeout: TIMEOUT,
    });
    metrics.productCount.add(res.timings.duration);
    check(res, { "product-count 200": (r) => r.status === 200 });
  });

  sleep(0.2);

  // ── 3. Paginated product list ─────────────────────────────────────
  group("GET /product/product-list/:page", () => {
    const page = (__ITER % 5) + 1;
    const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
      tags: { name: "GET /product/product-list/:page" },
      timeout: TIMEOUT,
    });
    metrics.productList.add(res.timings.duration);
    check(res, { "product-list 200": (r) => r.status === 200 });
  });

  sleep(0.2);

  // ── 4. Search products (regex-heavy — key bottleneck) ─────────────
  group("GET /product/search/:keyword", () => {
    const keyword = SEARCH_KEYWORDS[__ITER % SEARCH_KEYWORDS.length];
    const res = http.get(
      `${BASE_URL}/api/v1/product/search/${encodeURIComponent(keyword)}`,
      { tags: { name: "GET /product/search/:keyword" }, timeout: TIMEOUT }
    );
    metrics.searchProducts.add(res.timings.duration);
    const ok = check(res, {
      "search 200": (r) => r.status === 200,
    });
    searchFailRate.add(!ok);
    metrics.failRate.add(!ok);
  });

  sleep(0.2);

  // ── 5. Product filters ────────────────────────────────────────────
  group("POST /product/product-filters", () => {
    const catIds = categories && categories.length > 0
      ? [categories[__ITER % categories.length]._id]
      : [];
    const payload = JSON.stringify({ checked: catIds, radio: [[0, 100]] });
    const res = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      payload,
      { headers, tags: { name: "POST /product/product-filters" }, timeout: TIMEOUT }
    );
    metrics.productFilters.add(res.timings.duration);
    const ok = check(res, { "filter 200": (r) => r.status === 200 });
    filterFailRate.add(!ok);
    metrics.failRate.add(!ok);
  });

  sleep(0.2);

  // ── 6. Single product by slug ─────────────────────────────────────
  if (products && products.length > 0) {
    group("GET /product/get-product/:slug", () => {
      const product = products[__ITER % products.length];
      const res = http.get(
        `${BASE_URL}/api/v1/product/get-product/${product.slug}`,
        { tags: { name: "GET /product/get-product/:slug" }, timeout: TIMEOUT }
      );
      metrics.singleProduct.add(res.timings.duration);
      check(res, { "single-product 200": (r) => r.status === 200 });
    });

    sleep(0.1);

    // ── 7. Related products ───────────────────────────────────────────
    group("GET /product/related-product/:pid/:cid", () => {
      const product = products[__ITER % products.length];
      const cid = product.category?._id || product.category;
      if (cid) {
        const res = http.get(
          `${BASE_URL}/api/v1/product/related-product/${product._id}/${cid}`,
          { tags: { name: "GET /product/related-product" }, timeout: TIMEOUT }
        );
        metrics.relatedProducts.add(res.timings.duration);
        check(res, { "related-product 200": (r) => r.status === 200 });
      }
    });
  }

  // ── 8. Products by category ─────────────────────────────────────
  if (categories && categories.length > 0) {
    group("GET /product/product-category/:slug", () => {
      const cat = categories[__ITER % categories.length];
      const res = http.get(
        `${BASE_URL}/api/v1/product/product-category/${cat.slug}`,
        { tags: { name: "GET /product/product-category/:slug" }, timeout: TIMEOUT }
      );
      metrics.productCategory.add(res.timings.duration);
      check(res, { "product-category 200": (r) => r.status === 200 });
    });
  }

  sleep(0.3);
}
