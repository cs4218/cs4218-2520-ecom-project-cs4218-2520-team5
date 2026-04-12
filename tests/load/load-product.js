// Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
//
// Load Test (Final Report Run): Product Listing & Search Endpoints
// Endpoints: GET /api/v1/product/product-list/:page
//            GET /api/v1/product/product-count
//            GET /api/v1/product/search/:keyword
//
// --- Why these endpoints ---
// Product browsing and search form the core hot path of any e-commerce
// session. Product search uses a MongoDB regex scan ($or across name and
// description), and product listing uses .sort().skip().limit() — both
// are sensitive to concurrency because they compete for the same DB
// connection pool and working set.
//
// --- Why these load stages ---
// Read-heavy endpoints typically tolerate higher concurrency than write
// endpoints, so the VU ceiling here matches the login test (default 30).
// The stepped ramp lets us observe whether latency scales linearly or
// shows a knee at a particular step.
//   Ramp-up   → 5 VUs  (warm caches)
//   Step 1    → 10 VUs (light read load)
//   Step 2    → 20 VUs (moderate read load)
//   Step 3    → 30 VUs (upper-normal read load)
//   Sustain   → 30 VUs (2 min stable measurement)
//   Ramp-down → 0 VUs
//
// --- Metrics and thresholds ---
// Primary metrics collected:
//   - product_list_duration, product_count_duration, search_duration
//     (custom Trends): per-endpoint p90 response times
//   - http_req_duration (built-in): p90 across all HTTP requests
//   - http_req_failed (built-in):   fraction of non-2xx/3xx responses
//   - error_rate (custom Rate):     fraction of 4xx/5xx errors
//   - requestsTotal (custom):       total throughput
//
// Run:
//   k6 run tests/load/load-product.js
//   k6 run --env BASE_URL=http://localhost:6060 tests/load/load-product.js

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const productListDuration = new Trend("product_list_duration", true);
const productCountDuration = new Trend("product_count_duration", true);
const searchDuration = new Trend("search_duration", true);
const errorRate = new Rate("error_rate");
const requestsTotal = new Counter("requests_total");

const SEARCH_KEYWORDS = ["phone", "book", "shirt", "laptop", "shoe", "watch"];

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 10 },
    { duration: "1m", target: 20 },
    { duration: "1m", target: 30 },
    { duration: "2m", target: 30 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<1500"],
    http_req_failed: ["rate<0.01"],
    product_list_duration: ["p(50)<300", "p(90)<600", "p(95)<800", "p(99)<1000"],
    product_count_duration: ["p(50)<200", "p(90)<400", "p(95)<600", "p(99)<800"],
    search_duration: ["p(50)<350", "p(90)<700", "p(95)<900", "p(99)<1100"],
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
