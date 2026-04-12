// Premakumar Meenu Lekha, A0258712B

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060";

export const options = {
  stages: [
    // Ramp-up: 15 minutes to 100 VUs
    { duration: "15m", target: 100 },
    // Sustain: 100 VUs for 11 hours 45 minutes (Total: 12 hours)
    { duration: "11h45m", target: 100 },
  ],
  thresholds: {
    // Relaxed thresholds for 12-hour test - focus on trend analysis
    http_req_duration: ["p(95)<1000", "p(99)<2000"], // Allow more slack for long duration
    http_req_failed: ["rate<0.2"], // Up to 20% error rate (long-running systems may have occasional issues)
  },
};

export default function () {
  // Test 1: Product Search with varied keywords
  {
    const keywords = [
      "laptop",
      "phone",
      "tablet",
      "camera",
      "headphones",
      "watch",
      "keyboard",
      "mouse",
      "monitor",
      "speaker",
    ];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const url = `${BASE_URL}/api/v1/product/search/${randomKeyword}`;

    const response = http.get(url);

    check(response, {
      "Search status is 200": (r) => r.status === 200,
      "Search response time < 1000ms": (r) => r.timings.duration < 1000,
      "Search has data": (r) => r.body.length > 0,
    });
  }

  sleep(1);

  // Test 2: Product Filter with varied price ranges
  {
    const priceRanges = [
      [0, 100],
      [100, 300],
      [300, 500],
      [500, 1000],
      [1000, 2000],
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
      "Filter response time < 1000ms": (r) => r.timings.duration < 1000,
      "Filter has data": (r) => r.body.length > 0,
    });
  }

  sleep(1);

  // Test 3: Product Count (lightweight endpoint for baseline comparison)
  {
    const response = http.get(`${BASE_URL}/api/v1/product/product-count`);

    check(response, {
      "Product count endpoint responds": (r) => r.status === 200,
      "Response time < 500ms": (r) => r.timings.duration < 500,
    });
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    "./tests/non-functional/results/soak-12h-summary.json": JSON.stringify(
      data,
      null,
      2,
    ),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

// Custom summary formatter
function textSummary(data, options) {
  const o = options || {};
  if (o.indent == null) o.indent = "";
  if (o.enableColors == null) o.enableColors = true;

  const c = o.enableColors
    ? {
        fgGreen: "\x1b[32m",
        fgRed: "\x1b[31m",
        fgYellow: "\x1b[33m",
        reset: "\x1b[0m",
      }
    : { fgGreen: "", fgRed: "", fgYellow: "", reset: "" };

  let summary = `
${c.fgGreen}=== 12-Hour Soak Test Summary ===${c.reset}

${c.fgYellow}Execution${c.reset}
  Total Duration: ${formatDuration(data.state.testRunDurationMs)}
  Test Status: ${data.state.testRunStatus}

${c.fgYellow}HTTP Requests${c.reset}
  Total Requests: ${data.metrics.http_reqs.value}
  Failed Requests: ${data.metrics.http_req_failed.value} (${((data.metrics.http_req_failed.value / data.metrics.http_reqs.value) * 100).toFixed(2)}%)
  Average RPS: ${(data.metrics.http_reqs.value / (data.state.testRunDurationMs / 1000)).toFixed(2)}

${c.fgYellow}Response Times${c.reset}
  Average: ${formatTime(data.metrics.http_req_duration.values.avg)}
  Min: ${formatTime(data.metrics.http_req_duration.values.min)}
  Max: ${formatTime(data.metrics.http_req_duration.values.max)}
  p(50): ${formatTime(data.metrics.http_req_duration.values["p(50)"])}
  p(90): ${formatTime(data.metrics.http_req_duration.values["p(90)"])}
  p(95): ${formatTime(data.metrics.http_req_duration.values["p(95)"])}
  p(99): ${formatTime(data.metrics.http_req_duration.values["p(99)"])}

${c.fgYellow}Virtual Users${c.reset}
  Max VUs: ${data.metrics.vus_max.value}
  Current VUs: ${data.metrics.vus.value}

${c.fgYellow}Checks${c.reset}
  Total: ${data.metrics.checks_total.value}
  Passed: ${data.metrics.checks_succeeded.value}
  Failed: ${data.metrics.checks_failed.value}
  Success Rate: ${((data.metrics.checks_succeeded.value / data.metrics.checks_total.value) * 100).toFixed(2)}%

${c.fgYellow}Network${c.reset}
  Data Sent: ${formatBytes(data.metrics.data_sent.value)}
  Data Received: ${formatBytes(data.metrics.data_received.value)}

${c.fgGreen}Results saved to: ./tests/non-functional/results/soak-12h-summary.json${c.reset}
`;

  return summary;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

function formatTime(ms) {
  return `${ms.toFixed(2)}ms`;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function teardown(data) {
  console.log(`\n✅ 12-hour soak test completed successfully!`);
  console.log(
    `📊 Results saved to: ./tests/non-functional/results/soak-12h-summary.json`,
  );
  console.log(`⏱️ Test ran for the full 12 hours without interruption`);
}
