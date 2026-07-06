import pino from 'pino';

// GATEWAY_ID is set per-container in docker-compose.yml so logs (and the
// k6 failover run) can tell which of the 3 gateway replicas handled a given
// connection or request.
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: process.env.GATEWAY_ID ? { gatewayId: process.env.GATEWAY_ID } : undefined,
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
