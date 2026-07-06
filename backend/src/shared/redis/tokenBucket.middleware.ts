import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Response, NextFunction } from 'express';
import { redisScript, isRedisConnected } from '../database/redis.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { AuthRequest } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_BUCKET_SCRIPT = readFileSync(
  join(__dirname, 'scripts', 'token-bucket.lua'),
  'utf-8'
);

interface TokenBucketConfig {
  capacity: number;
  refillPerSecond: number;
  cost?: number;
}

// Runs the token-bucket Lua script for a single bucket key. Fails open
// (allows the request) if Redis is unavailable — rate limiting degrades
// gracefully like the rest of this app's Redis-backed features.
export async function consumeTokenBucket(
  bucketKey: string,
  { capacity, refillPerSecond, cost = 1 }: TokenBucketConfig
): Promise<boolean> {
  if (!isRedisConnected()) return true;

  const result = (await redisScript.runScript(
    'token-bucket',
    TOKEN_BUCKET_SCRIPT,
    [bucketKey],
    [capacity, refillPerSecond, cost, Date.now()]
  )) as [number, number] | null;

  if (result === null) return true;
  return result[0] === 1;
}

interface TokenBucketLimiterOptions extends TokenBucketConfig {
  // Returns one or more bucket keys this request must have tokens in.
  // Returning null skips rate limiting for the request (e.g. unauthenticated).
  keyFn: (req: AuthRequest) => string | string[] | null;
  message?: string;
}

export function tokenBucketLimiter(options: TokenBucketLimiterOptions) {
  const { keyFn, message, ...bucketConfig } = options;

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const keys = keyFn(req);
    if (!keys) return next();

    const bucketKeys = Array.isArray(keys) ? keys : [keys];

    for (const bucketKey of bucketKeys) {
      const allowed = await consumeTokenBucket(bucketKey, bucketConfig);
      if (!allowed) {
        return ResponseUtils.error(
          res,
          message || 'Too many requests, please slow down.',
          429
        );
      }
    }

    next();
  };
}
