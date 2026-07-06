// Load-tests the actual resume claims: concurrent WebSocket connections
// across the 3-gateway Nginx stack, and end-to-end chat message delivery
// latency (timestamp at send, measured at receive).
//
// k6's `k6/ws` module speaks raw WebSocket, not the Socket.IO wire
// protocol, so the Engine.IO/Socket.IO handshake and ping/pong are
// hand-implemented below (validated against the real server before this
// script was written).
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';

const BASE_URL = __ENV.API_URL || 'http://localhost:8090';
const WS_URL = BASE_URL.replace(/^http/, 'ws');

const NUM_USERS = parseInt(__ENV.NUM_USERS || '300', 10);
// Matches SOCKET_CONFIG.maxConnectionsPerUser -- the real, Redis-enforced
// per-user cap, so this is the most connections we can legitimately open
// per registered user.
const CONNECTIONS_PER_USER = 5;
const MAX_VUS = NUM_USERS * CONNECTIONS_PER_USER;

const RAMP_DURATION = __ENV.RAMP_DURATION || '30s';
const HOLD_DURATION = __ENV.HOLD_DURATION || '60s';
const RAMPDOWN_DURATION = '15s';
const SENDER_VUS = parseInt(__ENV.SENDER_VUS || '10', 10);

const messageLatency = new Trend('chat_message_delivery_ms', true);
const messagesReceived = new Counter('chat_messages_received');
const wsConnectSuccess = new Counter('ws_connect_success');
const wsConnectErrors = new Counter('ws_connect_errors');
const messagesSent = new Counter('chat_messages_sent');
const messagesSendFailed = new Counter('chat_messages_send_failed');

export const options = {
  scenarios: {
    receivers: {
      executor: 'ramping-vus',
      exec: 'receiver',
      startVUs: 0,
      stages: [
        { duration: RAMP_DURATION, target: MAX_VUS },
        { duration: HOLD_DURATION, target: MAX_VUS },
        { duration: RAMPDOWN_DURATION, target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    senders: {
      executor: 'constant-vus',
      exec: 'sender',
      vus: SENDER_VUS,
      startTime: RAMP_DURATION,
      duration: HOLD_DURATION,
    },
  },
};

export function setup() {
  const users = [];
  const BATCH_SIZE = 25;

  for (let batchStart = 0; batchStart < NUM_USERS; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, NUM_USERS);
    const requests = [];
    // Username cap is 20 chars (auth.validation.ts) -- a short run id plus
    // index keeps every registration unique across repeated test runs
    // without blowing that limit.
    const runId = Date.now().toString(36).slice(-5);
    for (let i = batchStart; i < batchEnd; i++) {
      requests.push({
        method: 'POST',
        url: `${BASE_URL}/api/auth/register`,
        body: JSON.stringify({
          email: `lt${runId}${i}@example.com`,
          username: `lt${runId}${i}`,
          password: 'LoadTest123!',
          displayName: `Load Test ${i}`,
        }),
        params: { headers: { 'Content-Type': 'application/json' } },
      });
    }

    const responses = http.batch(requests);
    for (const res of responses) {
      if (res.status === 201 || res.status === 200) {
        const body = JSON.parse(res.body);
        users.push({ id: body.data.user.id, token: body.data.accessToken });
      } else {
        console.log(`register failed: status=${res.status} body=${res.body}`);
      }
    }
  }

  console.log(`Registered ${users.length}/${NUM_USERS} users for load test`);
  return { users };
}

function connectSocket(token, onMessage) {
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;
  return ws.connect(url, {}, function (socket) {
    let authenticated = false;

    socket.on('message', function (data) {
      const packetType = data[0];
      if (packetType === '0') {
        // Engine.IO OPEN -> send Socket.IO CONNECT with our JWT as auth payload.
        socket.send('40' + JSON.stringify({ token }));
      } else if (packetType === '2') {
        // Engine.IO PING -> must PONG within pingTimeout or the server drops us.
        socket.send('3');
      } else if (data.startsWith('40')) {
        authenticated = true;
        wsConnectSuccess.add(1);
      } else if (data.startsWith('42')) {
        onMessage(JSON.parse(data.slice(2)));
      }
    });

    socket.on('error', function () {
      if (!authenticated) wsConnectErrors.add(1);
    });

    // Held open for the whole test; k6 tears the VU (and this connection)
    // down on ramp-down/test end.
    socket.setTimeout(function () {
      socket.close();
    }, 5 * 60 * 1000);
  });
}

export function receiver(data) {
  const idx = (exec.vu.idInTest - 1) % data.users.length;
  const user = data.users[idx];

  const res = connectSocket(user.token, function (payload) {
    const [event, msg] = payload;
    if (event !== 'message') return;
    try {
      const { sentAt } = JSON.parse(msg.content);
      if (sentAt) {
        messageLatency.add(Date.now() - sentAt);
        messagesReceived.add(1);
      }
    } catch {
      // not one of our timestamped load-test messages, ignore
    }
  });

  check(res, { 'ws handshake status 101': (r) => r && r.status === 101 });
}

export function sender(data) {
  const senderIdx = Math.floor(Math.random() * data.users.length);
  let recipientIdx = Math.floor(Math.random() * data.users.length);
  while (recipientIdx === senderIdx) {
    recipientIdx = Math.floor(Math.random() * data.users.length);
  }

  const senderUser = data.users[senderIdx];
  const recipientUser = data.users[recipientIdx];

  const res = http.post(
    `${BASE_URL}/api/messages`,
    JSON.stringify({ recipientId: recipientUser.id, content: JSON.stringify({ sentAt: Date.now() }) }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senderUser.token}`,
      },
    }
  );

  if (res.status === 201) {
    messagesSent.add(1);
  } else {
    messagesSendFailed.add(1);
  }

  sleep(0.3);
}

export function handleSummary(data) {
  const latency = data.metrics.chat_message_delivery_ms?.values || {};
  const summary = {
    timestamp: new Date().toISOString(),
    testName: 'WebSocket Concurrency + Message Delivery Latency',
    config: {
      numUsers: NUM_USERS,
      connectionsPerUser: CONNECTIONS_PER_USER,
      targetConcurrentConnections: MAX_VUS,
      rampDuration: RAMP_DURATION,
      holdDuration: HOLD_DURATION,
    },
    connections: {
      peakVUs: data.metrics.vus_max?.values?.max || 0,
      wsConnectSuccess: data.metrics.ws_connect_success?.values?.count || 0,
      wsConnectErrors: data.metrics.ws_connect_errors?.values?.count || 0,
      wsSessions: data.metrics.ws_sessions?.values?.count || 0,
    },
    messages: {
      sent: data.metrics.chat_messages_sent?.values?.count || 0,
      sendFailed: data.metrics.chat_messages_send_failed?.values?.count || 0,
    },
    sendRequestMs: {
      avg: data.metrics.http_req_duration?.values?.avg?.toFixed(2) || null,
      p95: data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || null,
      max: data.metrics.http_req_duration?.values?.max?.toFixed(2) || null,
    },
    deliveryLatencyMs: {
      count: data.metrics.chat_messages_received?.values?.count || 0,
      avg: latency.avg?.toFixed(2) || null,
      p50: latency.med?.toFixed(2) || null,
      p95: latency['p(95)']?.toFixed(2) || null,
      p99: latency['p(99)']?.toFixed(2) || null,
      max: latency.max?.toFixed(2) || null,
    },
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    'tests/load/results/ws-concurrency-results.json': JSON.stringify(summary, null, 2),
  };
}
