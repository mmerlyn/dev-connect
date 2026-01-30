import rateLimit from 'express-rate-limit';
import { config } from '../../config/index.js';
import { ResponseUtils } from '../utils/response.utils.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // Default: 15 minutes
  max: config.rateLimit.maxRequests, // Default: 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseUtils.error(res, 'Too many requests, please try again later.', 429);
  },
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseUtils.error(res, 'Too many authentication attempts, please try again later.', 429);
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Limiter for password reset (very strict)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseUtils.error(res, 'Too many password reset attempts, please try again later.', 429);
  },
});

// Limiter for post creation
export const createPostLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 posts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseUtils.error(res, 'Too many posts created, please slow down.', 429);
  },
});

// Limiter for message sending
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseUtils.error(res, 'Too many messages sent, please slow down.', 429);
  },
});

// Limiter for follow/unfollow actions
export const followLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 follow/unfollow per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseUtils.error(res, 'Too many follow actions, please slow down.', 429);
  },
});

// Limiter for search
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseUtils.error(res, 'Too many search requests, please slow down.', 429);
  },
});

// Export all limiters
export const RateLimitMiddleware = {
  general: generalLimiter,
  auth: authLimiter,
  passwordReset: passwordResetLimiter,
  createPost: createPostLimiter,
  message: messageLimiter,
  follow: followLimiter,
  search: searchLimiter,
};
