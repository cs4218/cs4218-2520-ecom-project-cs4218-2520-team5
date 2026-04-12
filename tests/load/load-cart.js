// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Load Test (Final Report Run): Cart-Related Endpoints
// Endpoints: GET  /api/v1/product/get-product
//            POST /api/v1/product/product-filters
//            GET  /api/v1/product/related-product/:pid/:cid
//
// --- Why these endpoints ---
// The shopping cart in Virtual Vault is managed client-side (localStorage).
// The server-side load during cart-building comes from product detail
// fetches, filter queries (POST with price/category criteria), and
// related-product lookups. These represent the write-adjacent workload:
// each "add to cart" action is preceded by at least one product fetch
// and often a filter or related-product request.
//
// --- Why these load stages ---
// Cart-building involves mixed read/write patterns (POST filters) and
// is typically performed by a subset of visitors (not everyone who
// browses adds to cart). The VU ceiling is lower than pure read
// endpoints to reflect this natural funnel. Each step is 1 min for
// stable measurement.
//   Ramp-up   → 3 VUs  (minimal baseline)
//   Step 1    → 8 VUs  (light cart activity)
//   Step 2    → 15 VUs (moderate — busy shopping period)
//   Step 3    → 18 VUs (upper-normal — calibrated ceiling) - NOTE: adjusted to 18 due to 
//   Sustain   → 18 VUs (2 min stable measurement)
//   Ramp-down → 0 VUs
//
// --- Metrics and thresholds ---
// Primary metrics collected:
//   - product_fetch_duration, filter_duration, related_duration
//     (custom Trends): per-endpoint p90 response times
//   - http_req_duration (built-in): p90 across all HTTP requests
//   - http_req_failed (built-in):   fraction of non-2xx/3xx responses
//   - error_rate (custom Rate):     fraction of 4xx/5xx errors
//   - requestsTotal (custom):       total throughput
//
// Run:
//   k6 run tests/load/load-cart.js
//   k6 run --env BASE_URL=http://localhost:6060 tests/load/load-cart.js

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const productFetchDuration = new Trend("product_fetch_duration", true);
const filterDuration = new Trend("filter_duration", true);
const relatedDuration = new Trend("related_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

export const options = {
  stages: [
    { duration: "30s", target: 3 },
    { duration: "1m", target: 8 },
    { duration: "1m", target: 15 },
    { duration: "1m", target: 18 },
    { duration: "2m", target: 18 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    product_fetch_duration: ["p(50)<300", "p(90)<600", "p(95)<800", "p(99)<1000"],
    filter_duration: ["p(50)<350", "p(90)<700", "p(95)<900", "p(99)<1100"],
    related_duration: ["p(50)<300", "p(90)<600", "p(95)<800", "p(99)<1000"],
    error_rate: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

let productCache = [];

export default function () {
  group("get-products", () => {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { name: "get-products" },
    });
    productFetchDuration.add(res.timings.duration);
    requestsTotal.add(1);

    check(res, {
      "get-products: status 200": (r) => r.status === 200,
      "get-products: has products": (r) => {
        try {
          return Array.isArray(r.json("products"));
        } catch (_) {
          return false;
        }
      },
    });
    errorRate.add(res.status >= 400);

    try {
      const body = res.json();
      if (body && Array.isArray(body.products) && body.products.length > 0) {
        productCache = body.products;
      }
    } catch (_) {}
  });

  sleep(0.2);

  group("product-filters", () => {
    const priceRanges = [
      [[0, 50]],
      [[50, 200]],
      [[200, 500]],
      [[0, 1000]],
    ];
    const range =
      priceRanges[Math.floor(Math.random() * priceRanges.length)];
    const payload = JSON.stringify({ checked: [], radio: range });

    const res = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "product-filters" },
      }
    );
    filterDuration.add(res.timings.duration);
    requestsTotal.add(1);

    check(res, {
      "product-filters: status 200": (r) => r.status === 200,
      "product-filters: has products": (r) => {
        try {
          return Array.isArray(r.json("products"));
        } catch (_) {
          return false;
        }
      },
    });
    errorRate.add(res.status >= 400);
  });

  sleep(0.2);

  group("related-product", () => {
    if (productCache.length > 0) {
      const product =
        productCache[Math.floor(Math.random() * productCache.length)];
      const pid = product._id;
      const cid = product.category?._id || product.category;
      if (pid && cid) {
        const res = http.get(
          `${BASE_URL}/api/v1/product/related-product/${pid}/${cid}`,
          { tags: { name: "related-product" } }
        );
        relatedDuration.add(res.timings.duration);
        requestsTotal.add(1);

        check(res, {
          "related-product: status 200": (r) => r.status === 200,
        });
        errorRate.add(res.status >= 400);
      }
    }
  });

  sleep(0.3);
}
