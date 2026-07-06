// Production Socket.io configuration constants
export const SOCKET_CONFIG = {
  // Ping/pong heartbeat
  pingInterval: 25000,
  pingTimeout: 20000,

  // WebSocket-only: with 3 gateway replicas behind Nginx, dropping the
  // long-polling fallback means there's no multi-request handshake that
  // needs to land on the same instance, so Nginx can load-balance with
  // plain least_conn instead of sticky sessions (ip_hash) — all real-time
  // state (presence, rooms) already lives in Redis, not in-memory per socket.
  transports: ['websocket'] as const,
  allowUpgrades: false,
  upgradeTimeout: 10000,

  // Compression
  perMessageDeflate: {
    threshold: 1024, // Only compress messages > 1KB
  },

  // Connection limits
  maxHttpBufferSize: 1e6, // 1MB max message size
  connectTimeout: 45000,

  // Per-user connection limits
  maxConnectionsPerUser: 5,

  // Rate limiting for events
  maxEventsPerSecond: 50,

  // Adapter settings for horizontal scaling
  adapter: {
    requestsTimeout: 5000,
    publishOnSpecificResponseChannel: true,
  },
} as const;

export const METRICS_CONFIG = {
  // Rolling window for metrics collection (60 seconds)
  windowSizeMs: 60_000,
  // How often to snapshot metrics
  snapshotIntervalMs: 1_000,
  // Max history length
  maxSnapshots: 60,
} as const;
