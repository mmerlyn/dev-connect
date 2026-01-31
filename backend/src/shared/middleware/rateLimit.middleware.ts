import rateLimit from 'express-rate-limit';
import { config } from '../../config/index.js';
import { ResponseUtils } from '../utils/response.utils.js';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseUtils.error(res, 'Too many requests, please try again later.', 429);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseUtils.error(res, 'Too many authentication attempts, please try again later.', 429);
  },
  skipSuccessfulRequests: true,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseUtils.error(res, 'Too many password reset attempts, please try again later.', 429);
  },
});

export const createPostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseUtils.error(res, 'Too many posts created, please slow down.', 429);
  },
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseUtils.error(res, 'Too many messages sent, please slow down.', 429);
  },
});

export const followLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseUtils.error(res, 'Too many follow actions, please slow down.', 429);
  },
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ResponseUtils.error(res, 'Too many search requests, please slow down.', 429);
  },
});

export const RateLimitMiddleware = {
  general: generalLimiter,
  auth: authLimiter,
  passwordReset: passwordResetLimiter,
  createPost: createPostLimiter,
  message: messageLimiter,
  follow: followLimiter,
  search: searchLimiter,
};
