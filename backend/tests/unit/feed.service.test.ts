import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mock = (fn: unknown) => fn as jest.Mock<(...args: any[]) => any>;
const fn = () => jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule('../../src/shared/database/client.js', () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/shared/database/redis.js', () => ({
  redisCache: {
    get: fn().mockResolvedValue(null),
    set: fn().mockResolvedValue(false),
    del: fn().mockResolvedValue(false),
  },
  connectRedis: fn().mockResolvedValue(false),
  disconnectRedis: fn().mockResolvedValue(undefined),
  isRedisConnected: fn().mockReturnValue(false),
  getRedisClient: fn().mockReturnValue(null),
}));

const { prisma } = await import('../../src/shared/database/client.js');
const { redisCache } = await import('../../src/shared/database/redis.js');
const { FeedService } = await import('../../src/modules/feed/feed.service.js');

describe('FeedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonalizedFeed', () => {
    it('includes own posts in feed', async () => {
      mock(prisma.follow.findMany).mockResolvedValue([
        { followingId: 'friend-1' },
      ]);
      mock(prisma.post.findMany).mockResolvedValue([]);
      mock(prisma.post.count).mockResolvedValue(0);

      await FeedService.getPersonalizedFeed('user-1');

      const findManyCall = mock(prisma.post.findMany).mock.calls[0] as any[];
      const authorIds = findManyCall[0].where.authorId.in;
      expect(authorIds).toContain('user-1');
      expect(authorIds).toContain('friend-1');
    });

    it('returns cached result on cache hit', async () => {
      const cachedData = { posts: [{ id: 'post-1' }], total: 1, page: 1, limit: 20 };
      mock(redisCache.get).mockResolvedValue(JSON.stringify(cachedData));

      const result = await FeedService.getPersonalizedFeed('user-1');

      expect(result).toEqual(cachedData);
      expect(prisma.follow.findMany).not.toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getFollowingFeed', () => {
    it('returns empty for user with no followers', async () => {
      mock(prisma.follow.findMany).mockResolvedValue([]);

      const result = await FeedService.getFollowingFeed('user-1');

      expect(result).toEqual({ posts: [], total: 0, page: 1, limit: 20 });
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getTrendingPosts', () => {
    it('sorts by engagement score (likes + comments * 2)', async () => {
      mock(prisma.post.findMany).mockResolvedValue([
        {
          id: 'low-engagement',
          author: { id: 'a1', username: 'u1', displayName: 'U1', avatar: null },
          _count: { likes: 1, comments: 0 },
        },
        {
          id: 'high-engagement',
          author: { id: 'a2', username: 'u2', displayName: 'U2', avatar: null },
          _count: { likes: 5, comments: 10 },
        },
        {
          id: 'mid-engagement',
          author: { id: 'a3', username: 'u3', displayName: 'U3', avatar: null },
          _count: { likes: 3, comments: 2 },
        },
      ]);
      mock(prisma.post.count).mockResolvedValue(3);

      const result = await FeedService.getTrendingPosts(1, 20);

      expect(result.posts[0].id).toBe('high-engagement');
      expect(result.posts[1].id).toBe('mid-engagement');
      expect(result.posts[2].id).toBe('low-engagement');
    });
  });
});
