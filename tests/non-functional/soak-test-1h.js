// Premakumar Meenu Lekha, A0258712B

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:6060';

export const options = {
  stages: [
    // Ramp-up: 5 minutes to 50 VUs
    { duration: '5m', target: 50 },
    // Sustain: 50 VUs for 55 minutes (Total: 1 hour)
    { duration: '55m', target: 50 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
  },
};

export default function () {
  // Test 1: Product Search
  {
    const keywords = ['laptop', 'phone', 'tablet', 'camera'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const url = `${BASE_URL}/api/v1/product/search/${randomKeyword}`;
    const response = http.get(url);

    check(response, {
      'Search status is 200': (r) => r.status === 200,
      'Search response time < 500ms': (r) => r.timings.duration < 500,
    });
  }

  sleep(1);

  // Test 2: Product Filter
  {
    const url = `${BASE_URL}/api/v1/product/product-filters`;
    const payload = JSON.stringify({
      checked: [],
      radio: [0, 1000],
    });

    const response = http.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      'Filter status is 200': (r) => r.status === 200,
      'Filter response time < 500ms': (r) => r.timings.duration < 500,
    });
  }

  sleep(2);
}

export function teardown(data) {
  console.log('1-hour soak test completed');
}
