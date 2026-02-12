import { createClient, RedisClientType } from 'redis';
import { config } from '../../config/index.js';
import { logger } from '../utils/logger.js';

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
      logger.error(error, 'Redis get error');
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
      logger.error(error, 'Redis set error');
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!isRedisAvailable || !redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(error, 'Redis del error');
      return false;
    }
  },
};

export const connectRedis = async (): Promise<boolean> => {
  if (!config.redis.host) {
    logger.info('Redis not configured - caching disabled');
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
      logger.error({ err: err.message }, 'Redis Client Error');
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
      isRedisAvailable = true;
    });

    redisClient.on('end', () => {
      logger.info('Redis connection closed');
      isRedisAvailable = false;
    });

    await redisClient.connect();
    isRedisAvailable = true;
    return true;
  } catch (error) {
    logger.warn({ err: (error as Error).message }, 'Redis unavailable - caching disabled');
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
      logger.error(error, 'Error disconnecting Redis');
    }
  }
  isRedisAvailable = false;
  redisClient = null;
};
