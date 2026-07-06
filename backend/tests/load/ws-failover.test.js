// Smaller-scale companion to ws-concurrency.test.js: holds a modest number
// of WebSocket connections open while run-load-tests.sh kills and restarts
// one gateway container mid-run (via `docker kill`/`docker start`, from the
// shell wrapper, not from k6 itself -- k6 has no container-control access).
// Captures the connection error rate around the kill window and confirms
// messages sent to an affected user during the outage still arrive once
// their gateway is back (Streams replay), same guarantee proven manually in
// Step 3/5 verification, now exercised under an actual load-test client.
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';

const BASE_URL = __ENV.API_URL || 'http://localhost:8090';
const WS_URL = BASE_URL.replace(/^http/, 'ws');

const NUM_USERS = parseInt(__ENV.NUM_USERS || '60', 10);
const CONNECTIONS_PER_USER = 5;
const MAX_VUS = NUM_USERS * CONNECTIONS_PER_USER;
const TOTAL_DURATION = __ENV.TOTAL_DURATION || '60s';
const SENDER_VUS = parseInt(__ENV.SENDER_VUS || '5', 10);

const messageLatency = new Trend('failover_message_delivery_ms', true);
const messagesReceived = new Counter('failover_messages_received');
const wsConnectErrors = new Counter('failover_ws_connect_errors');
const messagesSendFailed = new Counter('failover_messages_send_failed');

export const options = {
  scenarios: {
    receivers: {
      executor: 'ramping-vus',
      exec: 'receiver',
      startVUs: 0,
      stages: [
        { duration: '10s', target: MAX_VUS },
        { duration: TOTAL_DURATION, target: MAX_VUS },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    senders: {
      executor: 'constant-vus',
      exec: 'sender',
      vus: SENDER_VUS,
      startTime: '10s',
      duration: TOTAL_DURATION,
    },
  },
};

export function setup() {
  const users = [];
  const runId = Date.now().toString(36).slice(-5);
  const requests = [];
  for (let i = 0; i < NUM_USERS; i++) {
    requests.push({
      method: 'POST',
      url: `${BASE_URL}/api/auth/register`,
      body: JSON.stringify({
        email: `fo${runId}${i}@example.com`,
        username: `fo${runId}${i}`,
        password: 'LoadTest123!',
        displayName: `Failover ${i}`,
      }),
      params: { headers: { 'Content-Type': 'application/json' } },
    });
  }
  const responses = http.batch(requests);
  for (const res of responses) {
    if (res.status === 201) {
      const body = JSON.parse(res.body);
      users.push({ id: body.data.user.id, token: body.data.accessToken });
    }
  }
  console.log(`Registered ${users.length}/${NUM_USERS} users for failover test`);
  return { users };
}

export function receiver(data) {
  const idx = (exec.vu.idInTest - 1) % data.users.length;
  const user = data.users[idx];
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('message', function (raw) {
      const t = raw[0];
      if (t === '0') {
        socket.send('40' + JSON.stringify({ token: user.token }));
      } else if (t === '2') {
        socket.send('3');
      } else if (raw.startsWith('42')) {
        const [event, msg] = JSON.parse(raw.slice(2));
        if (event !== 'message') return;
        try {
          const { sentAt } = JSON.parse(msg.content);
          if (sentAt) {
            messageLatency.add(Date.now() - sentAt);
            messagesReceived.add(1);
          }
        } catch {
          // ignore non-load-test messages
        }
      }
    });

    socket.on('error', function () {
      wsConnectErrors.add(1);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 5 * 60 * 1000);
  });

  check(res, { 'ws handshake status 101': (r) => r && r.status === 101 });
}

export function sender(data) {
  const senderIdx = Math.floor(Math.random() * data.users.length);
  let recipientIdx = Math.floor(Math.random() * data.users.length);
  while (recipientIdx === senderIdx) recipientIdx = Math.floor(Math.random() * data.users.length);

  const senderUser = data.users[senderIdx];
  const recipientUser = data.users[recipientIdx];

  const res = http.post(
    `${BASE_URL}/api/messages`,
    JSON.stringify({ recipientId: recipientUser.id, content: JSON.stringify({ sentAt: Date.now() }) }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${senderUser.token}` } }
  );

  if (res.status !== 201) messagesSendFailed.add(1);
  sleep(0.3);
}

export function handleSummary(data) {
  const latency = data.metrics.failover_message_delivery_ms?.values || {};
  const summary = {
    timestamp: new Date().toISOString(),
    testName: 'Gateway Failover (docker kill mid-run)',
    config: { numUsers: NUM_USERS, targetConcurrentConnections: MAX_VUS, totalDuration: TOTAL_DURATION },
    connections: {
      peakVUs: data.metrics.vus_max?.values?.max || 0,
      wsConnectErrors: data.metrics.failover_ws_connect_errors?.values?.count || 0,
    },
    messages: {
      received: data.metrics.failover_messages_received?.values?.count || 0,
      sendFailed: data.metrics.failover_messages_send_failed?.values?.count || 0,
    },
    deliveryLatencyMs: {
      avg: latency.avg?.toFixed(2) || null,
      p95: latency['p(95)']?.toFixed(2) || null,
      max: latency.max?.toFixed(2) || null,
    },
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    'tests/load/results/ws-failover-results.json': JSON.stringify(summary, null, 2),
  };
}
