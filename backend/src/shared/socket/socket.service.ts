import { Server, Socket } from 'socket.io';
import { socketMetrics } from './socket.metrics.js';
import {
  socketAuthMiddleware,
  connectionLimitMiddleware,
  decrementConnectionCount,
  instrumentSocket,
} from './socket.middleware.js';
import { RedisPresence } from './redis-adapter.js';

// Map of userId to socket ids (a user can have multiple connections)
const userSockets = new Map<string, Set<string>>();

let io: Server | null = null;

export class SocketService {
  static initialize(socketServer: Server) {
    io = socketServer;

    // Apply authentication middleware
    io.use(socketAuthMiddleware);
    io.use(connectionLimitMiddleware);

    // Start metrics collection
    socketMetrics.start();

    io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId as string;

      // Instrument socket events for latency tracking
      instrumentSocket(socket);

      // Record connection in metrics
      socketMetrics.recordConnection();

      // Register user in local map and Redis presence
      if (userId) {
        SocketService.registerUser(userId, socket.id);
        socket.join(`user:${userId}`);
        socket.emit('authenticated', { success: true, socketId: socket.id });

        // Update Redis presence
        RedisPresence.setOnline(userId, socket.id).catch((err) =>
          console.error('Redis presence error:', err)
        );
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

      socket.on('disconnect', () => {
        socketMetrics.recordDisconnection();
        SocketService.unregisterSocket(socket.id);

        if (userId) {
          decrementConnectionCount(userId);
          RedisPresence.setOffline(userId, socket.id).catch((err) =>
            console.error('Redis presence cleanup error:', err)
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

  static isUserOnline(userId: string): boolean {
    return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
  }

  static async isUserOnlineRedis(userId: string): Promise<boolean> {
    return RedisPresence.isOnline(userId);
  }

  static getConnectedUserCount(): number {
    return userSockets.size;
  }

  // Emit to a specific user
  static emitToUser(userId: string, event: string, data: any) {
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Emit to multiple users
  static emitToUsers(userIds: string[], event: string, data: any) {
    if (io) {
      userIds.forEach((userId) => {
        io!.to(`user:${userId}`).emit(event, data);
      });
    }
  }

  // Emit to all connected clients
  static emitToAll(event: string, data: any) {
    if (io) {
      io.emit(event, data);
    }
  }

  // Emit notification
  static sendNotification(userId: string, notification: any) {
    SocketService.emitToUser(userId, 'notification', notification);
  }

  // Emit new message
  static sendMessage(userId: string, message: any) {
    SocketService.emitToUser(userId, 'message', message);
  }

  // Emit new post (to followers)
  static notifyNewPost(followerIds: string[], postId: string) {
    SocketService.emitToUsers(followerIds, 'new-post', { postId });
  }

  // Graceful shutdown
  static async shutdown() {
    socketMetrics.stop();

    if (io) {
      // Notify all clients of shutdown
      io.emit('server-shutdown', {
        message: 'Server is shutting down for maintenance',
      });

      // Close all connections
      io.close();
      io = null;
    }

    await RedisPresence.disconnect();
  }
}
