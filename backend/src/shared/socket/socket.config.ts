// Production Socket.io configuration constants
export const SOCKET_CONFIG = {
  // Ping/pong heartbeat
  pingInterval: 25000,
  pingTimeout: 20000,

  // Transport settings
  transports: ['websocket', 'polling'] as const,
  allowUpgrades: true,
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
