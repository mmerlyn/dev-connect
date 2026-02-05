import { createClient, RedisClientType } from 'redis';
import { config } from '../../config/index.js';

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

export const isRedisConnected = () => isRedisAvailable;

export const getRedisClient = () => redisClient;

export const redisCache = {
  async get(key: string): Promise<string | null> {
    if (!isRedisAvailable || !redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!isRedisAvailable || !redisClient) return false;
    try {
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!isRedisAvailable || !redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },
};

export const connectRedis = async (): Promise<boolean> => {
  if (!config.redis.host) {
    console.log('Redis not configured - caching disabled');
    return false;
  }

  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        connectTimeout: 5000,
        ...(config.redis.tls ? { tls: true } : {}),
      },
      password: config.redis.password || undefined,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis connected');
      isRedisAvailable = true;
    });

    redisClient.on('end', () => {
      console.log('Redis connection closed');
      isRedisAvailable = false;
    });

    await redisClient.connect();
    isRedisAvailable = true;
    return true;
  } catch (error) {
    console.warn('Redis unavailable - caching disabled:', (error as Error).message);
    isRedisAvailable = false;
    redisClient = null;
    return false;
  }
};

export const disconnectRedis = async () => {
  if (redisClient && isRedisAvailable) {
    try {
      await redisClient.quit();
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
  isRedisAvailable = false;
  redisClient = null;
};
