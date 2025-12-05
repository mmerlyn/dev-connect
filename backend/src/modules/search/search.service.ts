import { prisma } from '../../shared/database/client.js';

export class SearchService {
  // Universal search
  static async universalSearch(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, posts, hashtags] = await Promise.all([
      // Search users
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              posts: true,
              followers: true,
            },
          },
        },
        take: 10,
      }),

      // Search posts
      prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { codeSnippet: { contains: query, mode: 'insensitive' } },
          ],
        },
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
        take: 10,
      }),

      // Search hashtags
      prisma.hashtag.findMany({
        where: {
          name: { contains: query.replace('#', ''), mode: 'insensitive' },
        },
        orderBy: { count: 'desc' },
        take: 10,
      }),
    ]);

    return { users, posts, hashtags };
  }

  // Search users only
  static async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
            { skills: { has: query } },
          ],
        },
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          skills: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: [
          { followers: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      }),
      prisma.user.count({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return { users, total, page, limit };
  }

  // Search posts only
  static async searchPosts(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { codeSnippet: { contains: query, mode: 'insensitive' } },
            { language: { contains: query, mode: 'insensitive' } },
            { hashtags: { has: query.toLowerCase() } },
          ],
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
        orderBy: [
          { likes: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      }),
      prisma.post.count({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { codeSnippet: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return { posts, total, page, limit };
  }

  // Search hashtags
  static async searchHashtags(query: string) {
    const hashtags = await prisma.hashtag.findMany({
      where: {
        name: { contains: query.replace('#', ''), mode: 'insensitive' },
      },
      orderBy: { count: 'desc' },
      take: 50,
    });

    return hashtags;
  }

  // Get posts by hashtag
  static async getPostsByHashtag(hashtag: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const normalizedTag = hashtag.toLowerCase().replace('#', '');

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          hashtags: { has: `#${normalizedTag}` },
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
          hashtags: { has: `#${normalizedTag}` },
        },
      }),
    ]);

    return { posts, total, page, limit };
  }
}
