import { prisma } from '../../shared/database/client.js';
import { redisCache } from '../../shared/database/redis.js';
import { FeatureService } from './feature.service.js';
import { ModelService } from './model.service.js';
import {
  RECOMMENDATION_CONFIG,
  TRAINING_CONFIG,
  type RecommendationResult,
  type RecommendationStatus,
} from './recommendation.types.js';

const REC_CACHE_PREFIX = 'rec:feed:';

export class RecommendationService {
  // Get recommended feed for a user
  static async getRecommendedFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: any[]; total: number; page: number; limit: number }> {
    // Check cache (returns null if Redis unavailable)
    const cacheKey = `${REC_CACHE_PREFIX}${userId}:${page}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Check if user has enough interactions for ML
    const interactionCount = await prisma.like.count({
      where: { userId, postId: { not: null } },
    });

    let recommendations: RecommendationResult[];

    if (
      interactionCount >= TRAINING_CONFIG.minInteractionsForML &&
      ModelService.isModelTrained()
    ) {
      recommendations = await RecommendationService.mlRecommendations(userId);
    } else {
      recommendations = await RecommendationService.heuristicRecommendations(userId);
    }

    // Apply diversity: max 2 posts per author
    const diversified = await RecommendationService.enforceDiversity(recommendations);

    // Inject exploration posts (10%)
    const withExploration = await RecommendationService.injectExploration(
      diversified,
      userId
    );

    // Paginate
    const total = withExploration.length;
    const start = (page - 1) * limit;
    const pageResults = withExploration.slice(start, start + limit);

    // Fetch full post data
    const postIds = pageResults.map((r) => r.postId);
    const posts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    // Maintain recommendation order and add like status
    const orderedPosts = await Promise.all(
      postIds.map(async (id) => {
        const post = posts.find((p) => p.id === id);
        if (!post) return null;

        const isLiked = await prisma.like.findUnique({
          where: { userId_postId: { userId, postId: id } },
        });

        return { ...post, isLiked: !!isLiked };
      })
    );

    const result = {
      posts: orderedPosts.filter(Boolean),
      total,
      page,
      limit,
    };

    // Cache for 10 minutes (no-op if Redis unavailable)
    await redisCache.set(cacheKey, JSON.stringify(result), RECOMMENDATION_CONFIG.cacheTTL);

    return result;
  }

  // ML-based recommendations
  private static async mlRecommendations(
    userId: string
  ): Promise<RecommendationResult[]> {
    // Get user feature vector
    const userFeature = await FeatureService.buildUserVector(userId);

    // Get candidate posts (recent, not by user, not already liked)
    const likedPostIds = (
      await prisma.like.findMany({
        where: { userId, postId: { not: null } },
        select: { postId: true },
      })
    )
      .map((l) => l.postId)
      .filter((id): id is string => id !== null);

    const candidates = await prisma.post.findMany({
      where: {
        authorId: { not: userId },
        id: { notIn: likedPostIds },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: RECOMMENDATION_CONFIG.candidatePoolSize,
    });

    if (candidates.length === 0) {
      return [];
    }

    // Build feature vectors for candidates
    const postVectors = await FeatureService.buildPostVectors(
      candidates.map((c) => c.id)
    );

    // Predict scores
    const scores = await ModelService.predict(
      userFeature.vector,
      postVectors.map((pv) => pv.vector)
    );

    // Combine and sort by score
    const results: RecommendationResult[] = candidates.map((c, i) => ({
      postId: c.id,
      score: scores[i],
      source: 'ml' as const,
    }));

    results.sort((a, b) => b.score - a.score);

    return results;
  }

  // Heuristic fallback for new users
  private static async heuristicRecommendations(
    userId: string
  ): Promise<RecommendationResult[]> {
    // Get user's skills for content matching
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 7); // Last 7 days for new users

    // Get recent posts with engagement, preferring matching skills/hashtags
    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: yesterday },
        authorId: { not: userId },
      },
      include: {
        author: { select: { skills: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: RECOMMENDATION_CONFIG.candidatePoolSize,
    });

    const userSkills = new Set(
      (user?.skills || []).map((s) => s.toLowerCase())
    );

    // Score posts heuristically
    const results: RecommendationResult[] = posts.map((post) => {
      let score = 0;

      // Engagement score
      score += post._count.likes * 0.3;
      score += post._count.comments * 0.5;

      // Skill overlap bonus
      const authorSkills = post.author.skills.map((s) => s.toLowerCase());
      const skillOverlap = authorSkills.filter((s) => userSkills.has(s)).length;
      score += skillOverlap * 2;

      // Hashtag relevance (simple check)
      score += post.hashtags.length * 0.1;

      // Recency bonus
      const hoursAgo =
        (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 10 - hoursAgo * 0.1);

      return {
        postId: post.id,
        score,
        source: 'heuristic' as const,
      };
    });

    results.sort((a, b) => b.score - a.score);

    return results;
  }

  // Diversity enforcement: max N posts per author
  private static async enforceDiversity(
    recommendations: RecommendationResult[]
  ): Promise<RecommendationResult[]> {
    const authorCounts = new Map<string, number>();
    const diversified: RecommendationResult[] = [];

    // Fetch post author mapping
    const postIds = recommendations.map((r) => r.postId);
    const posts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, authorId: true },
    });
    const postAuthorMap = new Map(posts.map((p) => [p.id, p.authorId]));

    for (const rec of recommendations) {
      const authorId = postAuthorMap.get(rec.postId);
      if (!authorId) continue;

      const count = authorCounts.get(authorId) || 0;
      if (count < RECOMMENDATION_CONFIG.maxPostsPerAuthor) {
        diversified.push(rec);
        authorCounts.set(authorId, count + 1);
      }
    }

    return diversified;
  }

  // Inject exploration posts (random recent posts not in recommendations)
  private static async injectExploration(
    recommendations: RecommendationResult[],
    userId: string
  ): Promise<RecommendationResult[]> {
    const explorationCount = Math.ceil(
      recommendations.length * RECOMMENDATION_CONFIG.explorationRate
    );

    if (explorationCount === 0) return recommendations;

    const existingIds = new Set(recommendations.map((r) => r.postId));

    const explorePosts = await prisma.post.findMany({
      where: {
        id: { notIn: [...existingIds] },
        authorId: { not: userId },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: explorationCount * 3, // Fetch more to allow random selection
    });

    // Random selection
    const shuffled = explorePosts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, explorationCount);

    const explorationResults: RecommendationResult[] = selected.map((p) => ({
      postId: p.id,
      score: 0,
      source: 'exploration' as const,
    }));

    // Interleave exploration posts roughly evenly
    const result = [...recommendations];
    const step = Math.max(
      1,
      Math.floor(result.length / (explorationResults.length + 1))
    );

    for (let i = 0; i < explorationResults.length; i++) {
      const insertIdx = Math.min((i + 1) * step, result.length);
      result.splice(insertIdx, 0, explorationResults[i]);
    }

    return result;
  }

  // Get recommendation status for a user
  static async getStatus(userId: string): Promise<RecommendationStatus> {
    const interactionCount = await prisma.like.count({
      where: { userId, postId: { not: null } },
    });

    return {
      modelTrained: ModelService.isModelTrained(),
      lastTrainedAt: ModelService.getLastTrainedAt()?.toISOString() || null,
      totalTrainingExamples: ModelService.getTotalTrainingExamples(),
      userInteractionCount: interactionCount,
      usingMLRecommendations:
        interactionCount >= TRAINING_CONFIG.minInteractionsForML &&
        ModelService.isModelTrained(),
    };
  }
}
