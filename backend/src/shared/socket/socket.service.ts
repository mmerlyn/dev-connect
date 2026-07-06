import { Server, Socket } from 'socket.io';
import { socketMetrics } from './socket.metrics.js';
import {
  socketAuthMiddleware,
  connectionLimitMiddleware,
  decrementConnectionCount,
  instrumentSocket,
} from './socket.middleware.js';
import { RedisPresence } from './redis-adapter.js';
import { logger } from '../utils/logger.js';
import { catchUpForUser } from '../../modules/chat/chat.streams.consumer.js';

// Map of userId to socket ids (a user can have multiple connections)
const userSockets = new Map<string, Set<string>>();

let io: Server | null = null;

export class SocketService {
  static initialize(socketServer: Server) {
    io = socketServer;

    io.use(socketAuthMiddleware);
    io.use(connectionLimitMiddleware);

    socketMetrics.start();

    io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId as string;

      instrumentSocket(socket);
      socketMetrics.recordConnection();

      if (userId) {
        SocketService.registerUser(userId, socket.id);
        socket.join(`user:${userId}`);
        socket.emit('authenticated', { success: true, socketId: socket.id });

        RedisPresence.setOnline(userId, socket.id).catch((err) =>
          logger.error(err, 'Redis presence error')
        );

        // One-shot: deliver whatever this user missed while disconnected.
        // Not a standing loop — see chat.streams.consumer.ts.
        catchUpForUser(userId).catch((err) => logger.error(err, 'Chat catch-up error'));
      }

      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
      });

      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
      });

      socket.on('ping-latency', (callback: (ts: number) => void) => {
        if (typeof callback === 'function') {
          callback(Date.now());
        }
      });

      // Client sends this every ~15s (half the presence TTL) to keep the
      // Redis presence key alive. Missing a few in a row (crash, dropped
      // network) lets it expire on its own — no explicit offline event needed.
      socket.on('heartbeat', () => {
        if (userId) {
          RedisPresence.refresh(userId, socket.id).catch((err) =>
            logger.error(err, 'Redis presence heartbeat error')
          );
        }
      });

      // Ephemeral, no persistence: losing one is fine, latency is what matters.
      socket.on('typing', ({ recipientId }: { recipientId: string }) => {
        if (userId && recipientId) {
          SocketService.emitToUser(recipientId, 'typing', { userId });
        }
      });

      socket.on('disconnect', () => {
        socketMetrics.recordDisconnection();
        SocketService.unregisterSocket(socket.id);

        if (userId) {
          decrementConnectionCount(userId);
          RedisPresence.setOffline(userId, socket.id).catch((err) =>
            logger.error(err, 'Redis presence cleanup error')
          );
        }
      });
    });
  }

  static registerUser(userId: string, socketId: string) {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socketId);
  }

  static unregisterSocket(socketId: string) {
    for (const [userId, sockets] of userSockets.entries()) {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
        break;
      }
    }
  }

  // Redis-backed, so it answers correctly regardless of which gateway
  // replica a user's socket(s) are connected to — the in-memory
  // userSockets map above only reflects this one process.
  static async isUserOnline(userId: string): Promise<boolean> {
    return RedisPresence.isOnline(userId);
  }

  static getConnectedUserCount(): number {
    return userSockets.size;
  }

  static emitToUser(userId: string, event: string, data: any) {
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  }

  static emitToUsers(userIds: string[], event: string, data: any) {
    if (io) {
      userIds.forEach((userId) => {
        io!.to(`user:${userId}`).emit(event, data);
      });
    }
  }

  static emitToAll(event: string, data: any) {
    if (io) {
      io.emit(event, data);
    }
  }

  static sendNotification(userId: string, notification: any) {
    SocketService.emitToUser(userId, 'notification', notification);
  }

  static sendMessage(userId: string, message: any) {
    SocketService.emitToUser(userId, 'message', message);
  }

  static notifyNewPost(followerIds: string[], postId: string) {
    SocketService.emitToUsers(followerIds, 'new-post', { postId });
  }

  static async shutdown() {
    socketMetrics.stop();

    if (io) {
      io.emit('server-shutdown', {
        message: 'Server is shutting down for maintenance',
      });

      io.close();
      io = null;
    }

    await RedisPresence.disconnect();
  }
}
