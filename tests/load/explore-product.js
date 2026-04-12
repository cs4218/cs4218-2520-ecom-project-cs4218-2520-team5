// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Exploratory Calibration: Product Listing & Search Endpoints
// Endpoints: GET /api/v1/product/product-list/:page
//            GET /api/v1/product/product-count
//            GET /api/v1/product/search/:keyword
//
// --- Why these endpoints ---
// Product browsing and search are the core hot path. Search uses MongoDB
// regex ($or on name + description); listing uses sort/skip/limit. Both
// are read-heavy and sensitive to DB connection pool contention.
//
// --- How to use this script ---
// Run this script repeatedly at increasing VU counts to observe where
// response time, throughput, or error rate begins to degrade.
// Suggested ladder: 5, 10, 20, 30, 40 VUs.
//
// --- Metrics and thresholds ---
//   - http_req_duration p(90) < 1500ms (overall)
//   - http_req_failed rate < 1%
//   - Per-endpoint p(90) thresholds on custom Trends
//   - error_rate < 5%
//
// Run:
//   k6 run --env VUS=5  tests/load/explore-product.js
//   k6 run --env VUS=10 tests/load/explore-product.js
//   k6 run --env VUS=20 tests/load/explore-product.js

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const productListDuration = new Trend("product_list_duration", true);
const productCountDuration = new Trend("product_count_duration", true);
const searchDuration = new Trend("search_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

const VUS = parseInt(__ENV.VUS || "5", 10);

const SEARCH_KEYWORDS = ["phone", "book", "shirt", "laptop", "shoe", "watch"];

export const options = {
  stages: [
    { duration: "15s", target: VUS },
    { duration: "1m", target: VUS },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    product_list_duration: ["p(90)<600"],
    product_count_duration: ["p(90)<400"],
    search_duration: ["p(90)<700"],
    error_rate: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

export default function () {
  group("product-count", () => {
    const res = http.get(`${BASE_URL}/api/v1/product/product-count`, {
      tags: { name: "product-count" },
    });
    productCountDuration.add(res.timings.duration);
    requestsTotal.add(1);

    check(res, {
      "product-count: status 200": (r) => r.status === 200,
      "product-count: has total": (r) => {
        try {
          return typeof r.json("total") === "number";
        } catch (_) {
          return false;
        }
      },
    });
    errorRate.add(res.status >= 400);
  });

  sleep(0.1);

  group("product-list", () => {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
      tags: { name: "product-list" },
    });
    productListDuration.add(res.timings.duration);
    requestsTotal.add(1);

    check(res, {
      "product-list: status 200": (r) => r.status === 200,
      "product-list: has products array": (r) => {
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

  group("product-search", () => {
    const keyword =
      SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const res = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`, {
      tags: { name: "product-search" },
    });
    searchDuration.add(res.timings.duration);
    requestsTotal.add(1);

    check(res, {
      "search: status 200": (r) => r.status === 200,
      "search: returns array": (r) => {
        try {
          return Array.isArray(r.json());
        } catch (_) {
          return false;
        }
      },
    });
    errorRate.add(res.status >= 400);
  });

  sleep(0.3);
}
