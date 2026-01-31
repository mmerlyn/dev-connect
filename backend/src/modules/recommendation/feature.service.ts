import { prisma } from '../../shared/database/client.js';
import { redisCache } from '../../shared/database/redis.js';
import { VocabularyService } from './vocabulary.service.js';
import {
  HASHTAG_VOCAB_SIZE,
  SKILL_VOCAB_SIZE,
  POST_VECTOR_DIM,
  type UserFeatureVector,
  type PostFeatureVector,
} from './recommendation.types.js';

const USER_FEATURE_PREFIX = 'rec:feat:user:';
const POST_FEATURE_PREFIX = 'rec:feat:post:';
const FEATURE_TTL = 3600; // 1 hour cache

// L2 normalize a vector
function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export class FeatureService {
  // Build user interest vector (196-dim)
  // [hashtag_tfidf(128) | skill_profile(64) | engagement_features(4)]
  static async buildUserVector(userId: string): Promise<UserFeatureVector> {
    // Check cache (returns null if Redis unavailable)
    const cached = await redisCache.get(`${USER_FEATURE_PREFIX}${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const hashtagVocab = VocabularyService.getHashtagVocab() || await VocabularyService.buildHashtagVocab();
    const skillVocab = VocabularyService.getSkillVocab() || await VocabularyService.buildSkillVocab();

    // 1. Hashtag interest vector (TF-IDF weighted from liked/commented posts)
    const hashtagVector = new Array(HASHTAG_VOCAB_SIZE).fill(0);

    const likedPosts = await prisma.like.findMany({
      where: { userId, postId: { not: null } },
      include: {
        post: { select: { hashtags: true } },
      },
      take: 200,
    });

    const commentedPosts = await prisma.comment.findMany({
      where: { authorId: userId },
      include: {
        post: { select: { hashtags: true } },
      },
      take: 200,
    });

    // Count hashtag interactions
    const hashtagCounts = new Map<string, number>();
    for (const like of likedPosts) {
      if (like.post) {
        for (const tag of like.post.hashtags) {
          const normalized = tag.toLowerCase();
          hashtagCounts.set(normalized, (hashtagCounts.get(normalized) || 0) + 1);
        }
      }
    }
    for (const comment of commentedPosts) {
      if (comment.post) {
        for (const tag of comment.post.hashtags) {
          const normalized = tag.toLowerCase();
          hashtagCounts.set(normalized, (hashtagCounts.get(normalized) || 0) + 2); // Weight comments higher
        }
      }
    }

    // TF-IDF: term frequency normalized by max count
    const maxCount = Math.max(1, ...hashtagCounts.values());
    for (const [tag, count] of hashtagCounts) {
      const idx = hashtagVocab.get(tag);
      if (idx !== undefined) {
        hashtagVector[idx] = count / maxCount;
      }
    }

    // 2. Skill profile vector
    const skillVector = new Array(SKILL_VOCAB_SIZE).fill(0);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    });

    if (user) {
      for (const skill of user.skills) {
        const idx = skillVocab.get(skill.toLowerCase());
        if (idx !== undefined) {
          skillVector[idx] = 1;
        }
      }
    }

    // 3. Engagement features
    const [likesCount, commentsCount, postsCount] = await Promise.all([
      prisma.like.count({ where: { userId } }),
      prisma.comment.count({ where: { authorId: userId } }),
      prisma.post.count({ where: { authorId: userId } }),
    ]);

    const engagementFeatures = [
      Math.min(likesCount / 100, 1),    // likes_given (normalized)
      Math.min(commentsCount / 50, 1),   // comments_made (normalized)
      0.5,                                // avg_session (placeholder, normalized)
      Math.min(postsCount / 20, 1),       // post_frequency (normalized)
    ];

    // Combine and L2-normalize
    const rawVector = [...hashtagVector, ...skillVector, ...engagementFeatures];
    const vector = l2Normalize(rawVector);

    const result: UserFeatureVector = { userId, vector };

    // Cache (no-op if Redis unavailable)
    await redisCache.set(`${USER_FEATURE_PREFIX}${userId}`, JSON.stringify(result), FEATURE_TTL);

    return result;
  }

  // Build post feature vector (197-dim)
  // [hashtag_presence(128) | author_skills(64) | engagement_meta(5)]
  static async buildPostVector(postId: string): Promise<PostFeatureVector> {
    // Check cache (returns null if Redis unavailable)
    const cached = await redisCache.get(`${POST_FEATURE_PREFIX}${postId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const hashtagVocab = VocabularyService.getHashtagVocab() || await VocabularyService.buildHashtagVocab();
    const skillVocab = VocabularyService.getSkillVocab() || await VocabularyService.buildSkillVocab();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { skills: true, followers: { select: { id: true } } } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) {
      return { postId, vector: new Array(POST_VECTOR_DIM).fill(0) };
    }

    // 1. Hashtag presence vector
    const hashtagVector = new Array(HASHTAG_VOCAB_SIZE).fill(0);
    for (const tag of post.hashtags) {
      const idx = hashtagVocab.get(tag.toLowerCase());
      if (idx !== undefined) {
        hashtagVector[idx] = 1;
      }
    }

    // 2. Author skill vector
    const skillVector = new Array(SKILL_VOCAB_SIZE).fill(0);
    for (const skill of post.author.skills) {
      const idx = skillVocab.get(skill.toLowerCase());
      if (idx !== undefined) {
        skillVector[idx] = 1;
      }
    }

    // 3. Engagement + recency meta features
    const now = Date.now();
    const postAge = now - new Date(post.createdAt).getTime();
    const hoursSincePost = postAge / (1000 * 60 * 60);
    const recencyScore = Math.exp(-hoursSincePost / 48); // Decay over 48 hours

    const metaFeatures = [
      Math.min(post._count.likes / 50, 1),           // like_count_norm
      Math.min(post._count.comments / 20, 1),        // comment_count_norm
      Math.min(post.views / 500, 1),                  // view_count_norm
      recencyScore,                                    // recency_score
      Math.min(post.author.followers.length / 100, 1), // author_follower_norm
    ];

    // Combine and L2-normalize
    const rawVector = [...hashtagVector, ...skillVector, ...metaFeatures];
    const vector = l2Normalize(rawVector);

    const result: PostFeatureVector = { postId, vector };

    // Cache (no-op if Redis unavailable)
    await redisCache.set(`${POST_FEATURE_PREFIX}${postId}`, JSON.stringify(result), FEATURE_TTL);

    return result;
  }

  // Batch build post vectors for multiple posts
  static async buildPostVectors(postIds: string[]): Promise<PostFeatureVector[]> {
    return Promise.all(postIds.map((id) => FeatureService.buildPostVector(id)));
  }

  // Invalidate cached features for a user
  static async invalidateUser(userId: string) {
    await redisCache.del(`${USER_FEATURE_PREFIX}${userId}`);
  }

  // Invalidate cached features for a post
  static async invalidatePost(postId: string) {
    await redisCache.del(`${POST_FEATURE_PREFIX}${postId}`);
  }
}
