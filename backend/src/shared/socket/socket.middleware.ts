import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { socketMetrics } from './socket.metrics.js';
import { SOCKET_CONFIG } from './socket.config.js';
import { getRedisClient, isRedisConnected } from '../database/redis.js';
import { logger } from '../utils/logger.js';

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (socket as any).userId = decoded.userId;
    (socket as any).authenticatedAt = Date.now();
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}

// Per-user connection count, shared via Redis rather than an in-memory Map:
// with 3+ gateway replicas, a plain in-process Map would only ever see the
// connections that landed on *that* instance, silently turning a 5-per-user
// cap into 5-per-gateway (effectively 15 for 3 replicas). INCR/DECR on a
// single Redis key gives one true count across every instance.
const connCountKey = (userId: string) => `conn-count:${userId}`;

export async function connectionLimitMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const userId = (socket as any).userId;
  if (!userId) return next();

  const client = getRedisClient();
  if (!isRedisConnected() || !client) return next(); // fail open, same as this app's other Redis-backed features

  try {
    const count = await client.incr(connCountKey(userId));
    if (count === 1) {
      // Safety net: if a decrement is ever missed (crash between INCR and
      // DECR), the key still self-clears instead of leaking forever.
      await client.expire(connCountKey(userId), 60 * 60);
    }

    if (count > SOCKET_CONFIG.maxConnectionsPerUser) {
      await client.decr(connCountKey(userId));
      return next(
        new Error(
          `Maximum connections (${SOCKET_CONFIG.maxConnectionsPerUser}) exceeded`
        )
      );
    }

    next();
  } catch (err) {
    logger.error(err, 'Redis connection-limit error');
    next(); // fail open
  }
}

export async function decrementConnectionCount(userId: string): Promise<void> {
  const client = getRedisClient();
  if (!isRedisConnected() || !client) return;

  try {
    const remaining = await client.decr(connCountKey(userId));
    if (remaining <= 0) {
      await client.del(connCountKey(userId));
    }
  } catch (err) {
    logger.error(err, 'Redis connection-limit decrement error');
  }
}

// Event instrumentation middleware - wraps socket.on to track latency
export function instrumentSocket(socket: Socket) {
  const originalOn = socket.on.bind(socket);

  socket.on = function (event: string, listener: (...args: any[]) => void) {
    if (
      event === 'disconnect' ||
      event === 'error' ||
      event === 'connect'
    ) {
      return originalOn(event, listener);
    }

    return originalOn(event, (...args: any[]) => {
      const start = performance.now();
      const result = listener(...args);
      const latency = performance.now() - start;
      socketMetrics.recordEvent(latency);
      return result;
    });
  } as any;
}
