// Ivan Ang, A0259256U
// Assisted by AI
//
// Spike Test: Product Listing & Search Endpoints
// Tests: GET /api/v1/product/get-product
//        GET /api/v1/product/product-list/:page
//        GET /api/v1/product/product-count
//        GET /api/v1/product/search/:keyword
//
// Spike pattern:
//   Warm-up  →  Baseline  →  SPIKE (10x)  →  Recovery  →  Cool-down
//
// Run: k6 run tests/spike/spike-products.js
//      k6 run --env BASE_URL=http://localhost:6060 tests/spike/spike-products.js

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ---------- Custom metrics ----------
const productListDuration = new Trend("product_list_duration", true);
const productCountDuration = new Trend("product_count_duration", true);
const searchDuration = new Trend("search_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

// ---------- Spike test stages ----------
export const options = {
  stages: [
    // Warm-up
    { duration: "15s", target: 5 },
    // Baseline load
    { duration: "30s", target: 25 },
    // SPIKE — sudden 10× increase simulating flash sale / viral traffic
    { duration: "10s", target: 250 },
    // Recovery
    { duration: "30s", target: 25 },
    // Cool-down
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    product_list_duration: ["p(95)<600"],
    product_count_duration: ["p(95)<400"],
    search_duration: ["p(95)<700"],
    error_rate: ["rate<0.05"],
    http_req_duration: ["p(99)<1200"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// Sample search keywords to randomise requests
const SEARCH_KEYWORDS = ["phone", "book", "shirt", "laptop", "shoe", "watch"];

export default function () {
  // ---- 1. Product count ----
  group("product-count", () => {
    const countRes = http.get(`${BASE_URL}/api/v1/product/product-count`, {
      tags: { name: "product-count" },
    });

    productCountDuration.add(countRes.timings.duration);
    requestsTotal.add(1);

    check(countRes, {
      "product-count: status 200": (r) => r.status === 200,
      "product-count: has total": (r) => {
        try {
          return typeof r.json("total") === "number";
        } catch (_) {
          return false;
        }
      },
      "product-count: response under 400ms": (r) => r.timings.duration < 400,
    });

    errorRate.add(countRes.status >= 400); // only actual HTTP errors, not latency misses
  });

  sleep(0.1);

  // ---- 2. Product list (page 1) ----
  group("product-list-page1", () => {
    const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`, {
      tags: { name: "product-list" },
    });

    productListDuration.add(listRes.timings.duration);
    requestsTotal.add(1);

    check(listRes, {
      "product-list: status 200": (r) => r.status === 200,
      "product-list: has products array": (r) => {
        try {
          return Array.isArray(r.json("products"));
        } catch (_) {
          return false;
        }
      },
      "product-list: response under 600ms": (r) => r.timings.duration < 600,
    });

    errorRate.add(listRes.status >= 400); // only actual HTTP errors, not latency misses
  });

  sleep(0.2);

  // ---- 3. Search products ----
  group("product-search", () => {
    const keyword =
      SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const searchRes = http.get(
      `${BASE_URL}/api/v1/product/search/${keyword}`,
      { tags: { name: "product-search" } }
    );

    searchDuration.add(searchRes.timings.duration);
    requestsTotal.add(1);

    check(searchRes, {
      "search: status 200": (r) => r.status === 200,
      "search: returns array": (r) => {
        try {
          return Array.isArray(r.json());
        } catch (_) {
          return false;
        }
      },
      "search: response under 700ms": (r) => r.timings.duration < 700,
    });

    errorRate.add(searchRes.status >= 400); // only actual HTTP errors, not latency misses
  });

  sleep(0.3);
}
