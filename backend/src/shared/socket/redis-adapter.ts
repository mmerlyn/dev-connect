import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server } from 'socket.io';
import { config } from '../../config/index.js';
import { SOCKET_CONFIG } from './socket.config.js';

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
    console.error('Redis Adapter Pub Error:', err)
  );
  subClient.on('error', (err) =>
    console.error('Redis Adapter Sub Error:', err)
  );

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(
    createAdapter(pubClient, subClient, {
      requestsTimeout: SOCKET_CONFIG.adapter.requestsTimeout,
    })
  );

  console.log('Redis adapter connected for Socket.io horizontal scaling');
}

const PRESENCE_PREFIX = 'presence:';
const PRESENCE_TTL = 300;

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
      console.error('Redis Presence Error:', err)
    );

    await RedisPresence.redisClient.connect();
  }

  static async setOnline(userId: string, socketId: string) {
    if (!RedisPresence.redisClient) return;
    const key = `${PRESENCE_PREFIX}${userId}`;
    await RedisPresence.redisClient.sAdd(key, socketId);
    await RedisPresence.redisClient.expire(key, PRESENCE_TTL);
  }

  static async setOffline(userId: string, socketId: string) {
    if (!RedisPresence.redisClient) return;
    const key = `${PRESENCE_PREFIX}${userId}`;
    await RedisPresence.redisClient.sRem(key, socketId);
    // Clean up empty sets
    const remaining = await RedisPresence.redisClient.sCard(key);
    if (remaining === 0) {
      await RedisPresence.redisClient.del(key);
    }
  }

  static async isOnline(userId: string): Promise<boolean> {
    if (!RedisPresence.redisClient) return false;
    const key = `${PRESENCE_PREFIX}${userId}`;
    const count = await RedisPresence.redisClient.sCard(key);
    return count > 0;
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
