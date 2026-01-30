import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

const apiLatency = new Trend('api_latency', true);
const requestsSuccessful = new Counter('requests_successful');
const requestsFailed = new Counter('requests_failed');
const successRate = new Rate('success_rate');

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 250 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 1000 },
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'api_latency': ['p(95)<100', 'avg<50'],
    'success_rate': ['rate>0.95'],
    'http_req_duration': ['p(95)<100'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/health`);
  const latency = Date.now() - start;

  apiLatency.add(latency);

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'latency < 100ms': () => latency < 100,
  });

  if (ok) {
    requestsSuccessful.add(1);
    successRate.add(1);
  } else {
    requestsFailed.add(1);
    successRate.add(0);
  }

  sleep(0.05);
}

export function handleSummary(data) {
  const apiLat = data.metrics.api_latency?.values || {};
  const vus = data.metrics.vus_max?.values?.max || 0;

  const summary = {
    timestamp: new Date().toISOString(),
    peakConcurrentUsers: vus,
    totalRequests: data.metrics.http_reqs?.values?.count || 0,
    successfulRequests: data.metrics.requests_successful?.values?.count || 0,
    failedRequests: data.metrics.requests_failed?.values?.count || 0,
    successRate: ((data.metrics.success_rate?.values?.rate || 0) * 100).toFixed(2) + '%',
    latency: {
      avg: apiLat.avg?.toFixed(2) || '0',
      p50: apiLat.med?.toFixed(2) || '0',
      p95: apiLat['p(95)']?.toFixed(2) || '0',
      p99: apiLat['p(99)']?.toFixed(2) || '0',
      max: apiLat.max?.toFixed(2) || '0',
    },
    passed: vus >= 900 && (apiLat['p(95)'] || 0) < 100,
  };

  return {
    'tests/load/results/api-load-results.json': JSON.stringify(summary, null, 2),
  };
}
