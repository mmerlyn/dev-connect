import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server } from 'socket.io';
import { config } from '../../config/index.js';
import { SOCKET_CONFIG } from './socket.config.js';
import { logger } from '../utils/logger.js';

export async function setupRedisAdapter(io: Server): Promise<void> {
  const pubClient = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port,
      ...(config.redis.tls ? { tls: true } : {}),
    },
    password: config.redis.password,
  });

  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) =>
    logger.error(err, 'Redis Adapter Pub Error')
  );
  subClient.on('error', (err) =>
    logger.error(err, 'Redis Adapter Sub Error')
  );

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(
    createAdapter(pubClient, subClient, {
      requestsTimeout: SOCKET_CONFIG.adapter.requestsTimeout,
    })
  );

  logger.info('Redis adapter connected for Socket.io horizontal scaling');
}

// Presence is TTL-based: each connected socket owns a heartbeat key that
// expires if nobody refreshes it. A client that vanishes without a clean
// disconnect (crashed tab, dropped network) still reads as offline within
// one TTL window, instead of lingering online forever like a plain
// connect/disconnect flag would.
const PRESENCE_TTL_SECONDS = 30;
const socketKey = (userId: string, socketId: string) => `presence:ttl:${userId}:${socketId}`;
const indexKey = (userId: string) => `presence:sockets:${userId}`;

export class RedisPresence {
  private static redisClient: ReturnType<typeof createClient> | null = null;

  static async initialize() {
    RedisPresence.redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        ...(config.redis.tls ? { tls: true } : {}),
      },
      password: config.redis.password,
    });

    RedisPresence.redisClient.on('error', (err) =>
      logger.error(err, 'Redis Presence Error')
    );

    await RedisPresence.redisClient.connect();
  }

  // Called on socket connect, and again on every heartbeat while connected.
  static async setOnline(userId: string, socketId: string) {
    if (!RedisPresence.redisClient) return;
    await RedisPresence.redisClient.sAdd(indexKey(userId), socketId);
    await RedisPresence.redisClient.set(socketKey(userId, socketId), '1', {
      EX: PRESENCE_TTL_SECONDS,
    });
  }

  // Alias kept for call-site clarity: a heartbeat is just re-asserting "online".
  static async refresh(userId: string, socketId: string) {
    await RedisPresence.setOnline(userId, socketId);
  }

  // Called on clean disconnect. Unclean disconnects are handled by the TTL
  // expiring the heartbeat key on its own — isOnline() self-heals the index
  // the next time it's checked.
  static async setOffline(userId: string, socketId: string) {
    if (!RedisPresence.redisClient) return;
    const key = indexKey(userId);
    await RedisPresence.redisClient.sRem(key, socketId);
    await RedisPresence.redisClient.del(socketKey(userId, socketId));

    const remaining = await RedisPresence.redisClient.sCard(key);
    if (remaining === 0) {
      await RedisPresence.redisClient.del(key);
    }
  }

  static async isOnline(userId: string): Promise<boolean> {
    if (!RedisPresence.redisClient) return false;

    const key = indexKey(userId);
    const socketIds = await RedisPresence.redisClient.sMembers(key);
    if (socketIds.length === 0) return false;

    const staleIds: string[] = [];
    let aliveCount = 0;

    for (const id of socketIds) {
      const alive = await RedisPresence.redisClient.exists(socketKey(userId, id));
      if (alive) {
        aliveCount++;
      } else {
        staleIds.push(id);
      }
    }

    if (staleIds.length > 0) {
      await RedisPresence.redisClient.sRem(key, staleIds);
    }

    return aliveCount > 0;
  }

  static async getOnlineUsers(userIds: string[]): Promise<string[]> {
    if (!RedisPresence.redisClient) return [];
    const online: string[] = [];
    for (const userId of userIds) {
      if (await RedisPresence.isOnline(userId)) {
        online.push(userId);
      }
    }
    return online;
  }

  static async disconnect() {
    if (RedisPresence.redisClient) {
      await RedisPresence.redisClient.quit();
      RedisPresence.redisClient = null;
    }
  }
}
