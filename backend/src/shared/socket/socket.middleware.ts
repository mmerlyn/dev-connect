import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { socketMetrics } from './socket.metrics.js';
import { SOCKET_CONFIG } from './socket.config.js';

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// JWT authentication middleware for Socket.io connections
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

// Connection rate limiting per user
const userConnectionCounts = new Map<string, number>();

export function connectionLimitMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const userId = (socket as any).userId;
  if (!userId) return next();

  const currentCount = userConnectionCounts.get(userId) || 0;
  if (currentCount >= SOCKET_CONFIG.maxConnectionsPerUser) {
    return next(
      new Error(
        `Maximum connections (${SOCKET_CONFIG.maxConnectionsPerUser}) exceeded`
      )
    );
  }

  userConnectionCounts.set(userId, currentCount + 1);
  next();
}

export function decrementConnectionCount(userId: string) {
  const count = userConnectionCounts.get(userId) || 0;
  if (count <= 1) {
    userConnectionCounts.delete(userId);
  } else {
    userConnectionCounts.set(userId, count - 1);
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
