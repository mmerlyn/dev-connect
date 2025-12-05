import { prisma } from '../../shared/database/client.js';
import { redisClient } from '../../shared/database/redis.js';

export class FeedService {
  // Get personalized feed
  static async getPersonalizedFeed(userId: string, page: number = 1, limit: number = 20) {
    const cacheKey = `feed:user:${userId}:page:${page}`;

    // Try to get from cache
    try {
      const cachedFeed = await redisClient.get(cacheKey);
      if (cachedFeed) {
        return JSON.parse(cachedFeed);
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    const skip = (page - 1) * limit;

    // Get user's following list
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Include own posts

    // Get posts from followed users
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
        },
        skip,
        take: limit,
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
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.post.count({
        where: {
          authorId: { in: followingIds },
        },
      }),
    ]);

    // Check if user has liked each post
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const isLiked = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: post.id,
            },
          },
        });
        return { ...post, isLiked: !!isLiked };
      })
    );

    const result = { posts: postsWithLikeStatus, total, page, limit };

    // Cache for 5 minutes
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    return result;
  }

  // Get trending posts (most liked/commented in last 24 hours)
  static async getTrendingPosts(page: number = 1, limit: number = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      skip,
      take: limit,
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
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Sort by engagement (likes + comments * 2)
    const sortedPosts = posts.sort((a, b) => {
      const aScore = a._count.likes + a._count.comments * 2;
      const bScore = b._count.likes + b._count.comments * 2;
      return bScore - aScore;
    });

    const total = await prisma.post.count({
      where: {
        createdAt: { gte: yesterday },
      },
    });

    // Check if user has liked each post
    if (userId) {
      const postsWithLikeStatus = await Promise.all(
        sortedPosts.map(async (post) => {
          const isLiked = await prisma.like.findUnique({
            where: {
              userId_postId: {
                userId,
                postId: post.id,
              },
            },
          });
          return { ...post, isLiked: !!isLiked };
        })
      );
      return { posts: postsWithLikeStatus, total, page, limit };
    }

    return { posts: sortedPosts, total, page, limit };
  }

  // Get posts from followed users only
  static async getFollowingFeed(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return { posts: [], total: 0, page, limit };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
        },
        skip,
        take: limit,
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
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({
        where: {
          authorId: { in: followingIds },
        },
      }),
    ]);

    return { posts, total, page, limit };
  }
}
