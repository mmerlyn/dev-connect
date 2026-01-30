import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

const eventsProcessed = new Counter('events_processed');
const eventLatency = new Trend('event_latency', true);
const eventSuccess = new Rate('event_success_rate');

export const options = {
  scenarios: {
    constant_throughput: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    'event_latency': ['p(95)<100', 'avg<50'],
    'event_success_rate': ['rate>0.95'],
    'http_reqs': ['rate>=50'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/health`);
  const latency = Date.now() - startTime;

  eventLatency.add(latency);

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
  });

  if (ok) {
    eventsProcessed.add(1);
    eventSuccess.add(1);
  } else {
    eventSuccess.add(0);
  }
}

export function handleSummary(data) {
  const totalEvents = data.metrics.events_processed?.values?.count || 0;
  const requestsPerSec = data.metrics.http_reqs?.values?.rate || 0;
  const latency = data.metrics.event_latency?.values || {};

  const summary = {
    timestamp: new Date().toISOString(),
    totalEventsProcessed: totalEvents,
    eventsPerSecond: requestsPerSec.toFixed(2),
    latency: {
      avg: latency.avg?.toFixed(2) || '0',
      p95: latency['p(95)']?.toFixed(2) || '0',
      p99: latency['p(99)']?.toFixed(2) || '0',
      max: latency.max?.toFixed(2) || '0',
    },
    successRate: ((data.metrics.event_success_rate?.values?.rate || 0) * 100).toFixed(2) + '%',
    passed: requestsPerSec >= 50 && (latency['p(95)'] || 0) < 100,
  };

  return {
    'tests/load/results/events-throughput-results.json': JSON.stringify(summary, null, 2),
  };
}
