import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mock = (fn: unknown) => fn as jest.Mock<(...args: any[]) => any>;
const fn = () => jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule('../../src/shared/database/client.js', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    post: { findMany: jest.fn() },
    like: { findMany: jest.fn(), count: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/shared/database/redis.js', () => ({
  redisCache: { get: fn().mockResolvedValue(null), set: fn().mockResolvedValue(false), del: fn().mockResolvedValue(false) },
  connectRedis: fn().mockResolvedValue(false),
  disconnectRedis: fn().mockResolvedValue(undefined),
  isRedisConnected: fn().mockReturnValue(false),
  getRedisClient: fn().mockReturnValue(null),
}));

jest.unstable_mockModule('../../src/modules/recommendation/model.service.js', () => ({
  ModelService: {
    isModelTrained: fn().mockReturnValue(false),
    getLastTrainedAt: fn().mockReturnValue(null),
    getTotalTrainingExamples: fn().mockReturnValue(0),
    predict: fn().mockResolvedValue([]),
  },
}));

jest.unstable_mockModule('../../src/modules/recommendation/feature.service.js', () => ({
  FeatureService: {
    buildUserVector: fn().mockResolvedValue({ userId: 'user-1', vector: [] }),
    buildPostVectors: fn().mockResolvedValue([]),
  },
}));

const { prisma } = await import('../../src/shared/database/client.js');
const { ModelService } = await import('../../src/modules/recommendation/model.service.js');
const { FeatureService } = await import('../../src/modules/recommendation/feature.service.js');
const { RecommendationService } = await import('../../src/modules/recommendation/recommendation.service.js');

describe('RecommendationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock(ModelService.isModelTrained).mockReturnValue(false);
    mock(ModelService.getLastTrainedAt).mockReturnValue(null);
    mock(ModelService.getTotalTrainingExamples).mockReturnValue(0);
  });

  describe('getRecommendedFeed', () => {
    it('uses heuristic fallback for users with few interactions', async () => {
      mock(prisma.like.count).mockResolvedValue(3);
      mock(ModelService.isModelTrained).mockReturnValue(false);
      mock(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        skills: ['typescript', 'react'],
      });

      const now = new Date();
      mock(prisma.post.findMany)
        .mockResolvedValueOnce([ // heuristic candidates
          {
            id: 'post-1', hashtags: ['#typescript'], createdAt: now,
            authorId: 'author-1', author: { skills: ['typescript', 'node'] },
            _count: { likes: 10, comments: 5 },
          },
          {
            id: 'post-2', hashtags: [], createdAt: now,
            authorId: 'author-2', author: { skills: ['python'] },
            _count: { likes: 1, comments: 0 },
          },
        ])
        .mockResolvedValueOnce([ // diversity check
          { id: 'post-1', authorId: 'author-1' },
          { id: 'post-2', authorId: 'author-2' },
        ])
        .mockResolvedValueOnce([]) // exploration candidates
        .mockResolvedValueOnce([]); // final post fetch

      const result = await RecommendationService.getRecommendedFeed('user-1');

      expect(ModelService.predict).not.toHaveBeenCalled();
      expect(FeatureService.buildUserVector).not.toHaveBeenCalled();
      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('total');
    });

    it('uses ML path when user has enough interactions and model is trained', async () => {
      mock(prisma.like.count).mockResolvedValue(10);
      mock(ModelService.isModelTrained).mockReturnValue(true);

      mock(prisma.like.findMany).mockResolvedValue([{ postId: 'liked-1' }]);
      mock(prisma.post.findMany)
        .mockResolvedValueOnce([{ id: 'candidate-1' }, { id: 'candidate-2' }])
        .mockResolvedValueOnce([{ id: 'candidate-1', authorId: 'a1' }, { id: 'candidate-2', authorId: 'a2' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mock(FeatureService.buildUserVector).mockResolvedValue({
        userId: 'user-1',
        vector: new Array(196).fill(0),
      });
      mock(FeatureService.buildPostVectors).mockResolvedValue([
        { postId: 'candidate-1', vector: new Array(197).fill(0) },
        { postId: 'candidate-2', vector: new Array(197).fill(0) },
      ]);
      mock(ModelService.predict).mockResolvedValue([0.9, 0.3]);

      await RecommendationService.getRecommendedFeed('user-1');

      expect(ModelService.predict).toHaveBeenCalled();
      expect(FeatureService.buildUserVector).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getStatus', () => {
    it('returns correct recommendation status', async () => {
      mock(prisma.like.count).mockResolvedValue(12);
      mock(ModelService.isModelTrained).mockReturnValue(true);
      mock(ModelService.getLastTrainedAt).mockReturnValue(new Date('2026-01-15'));
      mock(ModelService.getTotalTrainingExamples).mockReturnValue(500);

      const status = await RecommendationService.getStatus('user-1');

      expect(status.modelTrained).toBe(true);
      expect(status.userInteractionCount).toBe(12);
      expect(status.usingMLRecommendations).toBe(true);
      expect(status.totalTrainingExamples).toBe(500);
    });

    it('reports not using ML when interactions are below threshold', async () => {
      mock(prisma.like.count).mockResolvedValue(3);
      mock(ModelService.isModelTrained).mockReturnValue(true);

      const status = await RecommendationService.getStatus('user-1');

      expect(status.usingMLRecommendations).toBe(false);
    });
  });
});
