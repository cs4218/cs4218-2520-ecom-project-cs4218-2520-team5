// Premakumar Meenu Lekha, A0258712B

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060";

export const options = {
  stages: [
    // Ramp-up: 10 minutes to 75 VUs
    { duration: "10m", target: 75 },
    // Sustain: 75 VUs for 3 hours 50 minutes (Total: 4 hours)
    { duration: "3h50m", target: 75 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<750", "p(99)<1500"],
    http_req_failed: ["rate<0.15"],
  },
};

export default function () {
  // Test 1: Product Search with various keywords
  {
    const keywords = [
      "laptop",
      "phone",
      "tablet",
      "camera",
      "headphones",
      "watch",
    ];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const url = `${BASE_URL}/api/v1/product/search/${randomKeyword}`;

    const response = http.get(url);

    check(response, {
      "Search status is 200": (r) => r.status === 200,
      "Search response time < 750ms": (r) => r.timings.duration < 750,
    });
  }

  sleep(1);

  // Test 2: Product Filter with different price ranges
  {
    const priceRanges = [
      [0, 100],
      [100, 500],
      [500, 1000],
      [0, 5000],
    ];

    const randomRange =
      priceRanges[Math.floor(Math.random() * priceRanges.length)];
    const payload = JSON.stringify({
      checked: [],
      radio: randomRange,
    });

    const response = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    check(response, {
      "Filter status is 200": (r) => r.status === 200,
      "Filter response time < 750ms": (r) => r.timings.duration < 750,
    });
  }

  sleep(1);

  // Test 3: Product Category listing
  {
    const response = http.get(`${BASE_URL}/api/v1/product/product-count`);

    check(response, {
      "Product count endpoint responds": (r) => r.status !== 0,
      "Response time < 750ms": (r) => r.timings.duration < 750,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    "./tests/non-functional/results/soak-4h-summary.json": JSON.stringify(data),
  };
}

export function teardown(data) {
  console.log("4-hour soak test completed");
  console.log(
    "Results saved to: ./tests/non-functional/results/soak-4h-summary.json",
  );
}
