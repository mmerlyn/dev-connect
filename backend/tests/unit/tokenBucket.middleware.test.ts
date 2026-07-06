import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mock = (fn: unknown) => fn as jest.Mock<(...args: any[]) => any>;
const fn = () => jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule('../../src/shared/database/redis.js', () => ({
  redisScript: {
    loadScript: fn().mockResolvedValue('fake-sha'),
    runScript: fn(),
  },
  isRedisConnected: fn().mockReturnValue(true),
}));

const { redisScript, isRedisConnected } = await import('../../src/shared/database/redis.js');
const { consumeTokenBucket, tokenBucketLimiter } = await import(
  '../../src/shared/redis/tokenBucket.middleware.js'
);

describe('tokenBucket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock(isRedisConnected).mockReturnValue(true);
  });

  describe('consumeTokenBucket', () => {
    it('fails open when Redis is not connected', async () => {
      mock(isRedisConnected).mockReturnValue(false);

      const allowed = await consumeTokenBucket('bucket:1', {
        capacity: 1,
        refillPerSecond: 1,
      });

      expect(allowed).toBe(true);
      expect(redisScript.runScript).not.toHaveBeenCalled();
    });

    it('fails open when the script returns null (Redis error mid-request)', async () => {
      mock(redisScript.runScript).mockResolvedValue(null);

      const allowed = await consumeTokenBucket('bucket:1', {
        capacity: 1,
        refillPerSecond: 1,
      });

      expect(allowed).toBe(true);
    });

    it('is allowed when the script reports a token was available', async () => {
      mock(redisScript.runScript).mockResolvedValue([1, 0]);

      const allowed = await consumeTokenBucket('bucket:1', {
        capacity: 1,
        refillPerSecond: 1,
      });

      expect(allowed).toBe(true);
    });

    it('is blocked when the script reports no tokens left', async () => {
      mock(redisScript.runScript).mockResolvedValue([0, 0]);

      const allowed = await consumeTokenBucket('bucket:1', {
        capacity: 1,
        refillPerSecond: 1,
      });

      expect(allowed).toBe(false);
    });
  });

  describe('tokenBucketLimiter', () => {
    const makeRes = () => {
      const res: any = {};
      res.status = fn().mockReturnValue(res);
      res.json = fn().mockReturnValue(res);
      return res;
    };

    it('skips rate limiting when keyFn returns null (e.g. unauthenticated)', async () => {
      const middleware = tokenBucketLimiter({
        capacity: 1,
        refillPerSecond: 1,
        keyFn: () => null,
      });
      const next = fn();

      await middleware({} as any, makeRes(), next as any);

      expect(next).toHaveBeenCalled();
      expect(redisScript.runScript).not.toHaveBeenCalled();
    });

    it('calls next() when the bucket allows the request', async () => {
      mock(redisScript.runScript).mockResolvedValue([1, 0]);
      const middleware = tokenBucketLimiter({
        capacity: 1,
        refillPerSecond: 1,
        keyFn: () => 'bucket:user-1',
      });
      const next = fn();

      await middleware({} as any, makeRes(), next as any);

      expect(next).toHaveBeenCalled();
    });

    it('responds 429 and does not call next() when the bucket is empty', async () => {
      mock(redisScript.runScript).mockResolvedValue([0, 0]);
      const middleware = tokenBucketLimiter({
        capacity: 1,
        refillPerSecond: 1,
        keyFn: () => 'bucket:user-1',
        message: 'slow down',
      });
      const next = fn();
      const res = makeRes();

      await middleware({} as any, res, next as any);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'slow down' })
      );
    });

    it('checks multiple bucket keys and short-circuits on the first that blocks', async () => {
      mock(redisScript.runScript)
        .mockResolvedValueOnce([1, 0]) // first key (per-user) allowed
        .mockResolvedValueOnce([0, 0]); // second key (per-conversation) blocked
      const middleware = tokenBucketLimiter({
        capacity: 1,
        refillPerSecond: 1,
        keyFn: () => ['bucket:user-1', 'bucket:conv-1'],
      });
      const next = fn();
      const res = makeRes();

      await middleware({} as any, res, next as any);

      expect(redisScript.runScript).toHaveBeenCalledTimes(2);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });
});
