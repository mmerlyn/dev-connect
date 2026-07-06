import { config } from '../../config/index.js';
import { tokenBucketLimiter } from '../redis/tokenBucket.middleware.js';

// All limiters below run on the same atomic Redis Lua token-bucket (see
// shared/redis/scripts/token-bucket.lua) that chat's per-message limits use,
// so rate limiting is consistent (and race-free under concurrent requests
// for the same key) across the whole API, not just chat. Pre-auth routes
// key by IP since req.user doesn't exist yet; post-auth routes key by user
// id so limits travel with the account, not the network address.

export const generalLimiter = tokenBucketLimiter({
  capacity: config.rateLimit.maxRequests,
  refillPerSecond: config.rateLimit.maxRequests / (config.rateLimit.windowMs / 1000),
  keyFn: (req) => `ratelimit:general:${req.ip}`,
  message: 'Too many requests, please try again later.',
});

export const authLimiter = tokenBucketLimiter({
  capacity: 10,
  refillPerSecond: 10 / (15 * 60),
  keyFn: (req) => `ratelimit:auth:${req.ip}`,
  message: 'Too many authentication attempts, please try again later.',
});

export const passwordResetLimiter = tokenBucketLimiter({
  capacity: 5,
  refillPerSecond: 5 / (60 * 60),
  keyFn: (req) => `ratelimit:pwreset:${req.ip}`,
  message: 'Too many password reset attempts, please try again later.',
});

export const createPostLimiter = tokenBucketLimiter({
  capacity: 10,
  refillPerSecond: 10 / 60,
  keyFn: (req) => (req.user ? `ratelimit:post:${req.user.id}` : `ratelimit:post:${req.ip}`),
  message: 'Too many posts created, please slow down.',
});

export const followLimiter = tokenBucketLimiter({
  capacity: 20,
  refillPerSecond: 20 / 60,
  keyFn: (req) => (req.user ? `ratelimit:follow:${req.user.id}` : `ratelimit:follow:${req.ip}`),
  message: 'Too many follow actions, please slow down.',
});

export const searchLimiter = tokenBucketLimiter({
  capacity: 30,
  refillPerSecond: 30 / 60,
  keyFn: (req) => `ratelimit:search:${req.ip}`,
  message: 'Too many search requests, please slow down.',
});

export const RateLimitMiddleware = {
  general: generalLimiter,
  auth: authLimiter,
  passwordReset: passwordResetLimiter,
  createPost: createPostLimiter,
  follow: followLimiter,
  search: searchLimiter,
};
