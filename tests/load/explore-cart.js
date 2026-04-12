// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Exploratory Calibration: Cart-Related Endpoints
// Endpoints: GET  /api/v1/product/get-product  (browse products for cart)
//            POST /api/v1/product/product-filters (filter while building cart)
//            GET  /api/v1/product/related-product/:pid/:cid
//
// --- Why these endpoints ---
// The shopping cart in Virtual Vault is managed client-side (localStorage).
// The server-side load during cart-building comes from product detail
// lookups, filter queries (POST with price/category criteria), and
// related-product requests. These represent write-adjacent load because
// each "add to cart" action is preceded by server-side fetches.
//
// --- How to use this script ---
// Run this script repeatedly at increasing VU counts to observe where
// response time, throughput, or error rate begins to degrade.
// Suggested ladder: 3, 8, 15, 20, 25 VUs (lower ceiling than pure
// read endpoints, reflecting the conversion funnel).
//
// --- Metrics and thresholds ---
//   - http_req_duration p(90) < 1500ms (overall)
//   - http_req_failed rate < 1%
//   - Per-endpoint p(90) thresholds on custom Trends
//   - error_rate < 5%
//
// Run:
//   k6 run --env VUS=3  tests/load/explore-cart.js
//   k6 run --env VUS=8  tests/load/explore-cart.js
//   k6 run --env VUS=15 tests/load/explore-cart.js

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const productFetchDuration = new Trend("product_fetch_duration", true);
const filterDuration = new Trend("filter_duration", true);
const relatedDuration = new Trend("related_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

const VUS = parseInt(__ENV.VUS || "3", 10);

export const options = {
  stages: [
    { duration: "15s", target: VUS },
    { duration: "1m", target: VUS },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    product_fetch_duration: ["p(90)<600"],
    filter_duration: ["p(90)<700"],
    related_duration: ["p(90)<600"],
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
