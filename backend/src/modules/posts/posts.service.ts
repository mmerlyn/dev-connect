import { prisma } from '../../shared/database/client.js';

export class PostsService {
  // Create post
  static async createPost(userId: string, data: any) {
    // Extract hashtags from content
    const hashtags = this.extractHashtags(data.content);

    const post = await prisma.post.create({
      data: {
        content: data.content,
        codeSnippet: data.codeSnippet,
        language: data.language,
        images: data.images || [],
        hashtags,
        authorId: userId,
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
    });

    // Update hashtag counts
    if (hashtags.length > 0) {
      await this.updateHashtagCounts(hashtags);
    }

    return post;
  }

  // Get all posts with pagination
  static async getAllPosts(page: number = 1, limit: number = 20, userId?: string) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
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
      prisma.post.count(),
    ]);

    // Check if user has liked each post
    if (userId) {
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
      return { posts: postsWithLikeStatus, total, page, limit };
    }

    return { posts, total, page, limit };
  }

  // Get single post
  static async getPost(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
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

    if (!post) {
      throw new Error('Post not found');
    }

    // Increment views
    await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });

    // Check if user has liked the post
    if (userId) {
      const isLiked = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      return { ...post, isLiked: !!isLiked };
    }

    return post;
  }

  // Update post
  static async updatePost(postId: string, userId: string, data: any) {
    // Check if post exists and user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new Error('Post not found');
    }

    if (existingPost.authorId !== userId) {
      throw new Error('Unauthorized to update this post');
    }

    const hashtags = this.extractHashtags(data.content || existingPost.content);

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        content: data.content,
        codeSnippet: data.codeSnippet,
        language: data.language,
        images: data.images,
        hashtags,
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
    });

    return post;
  }

  // Delete post
  static async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.authorId !== userId) {
      throw new Error('Unauthorized to delete this post');
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return true;
  }

  // Like post
  static async likePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      throw new Error('Post already liked');
    }

    const like = await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    // Create notification if not own post
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'LIKE_POST',
          content: 'liked your post',
          recipientId: post.authorId,
          senderId: userId,
          postId,
        },
      });
    }

    return like;
  }

  // Unlike post
  static async unlikePost(postId: string, userId: string) {
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!like) {
      throw new Error('Post not liked');
    }

    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return true;
  }

  // Get post likes
  static async getPostLikes(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { postId },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.like.count({ where: { postId } }),
    ]);

    return {
      likes: likes.map((like) => like.user),
      total,
      page,
      limit,
    };
  }

  // Extract hashtags from content
  private static extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    if (!matches) return [];
    return [...new Set(matches.map((tag) => tag.toLowerCase()))];
  }

  // Update hashtag counts
  private static async updateHashtagCounts(hashtags: string[]) {
    for (const tag of hashtags) {
      const name = tag.replace('#', '');
      await prisma.hashtag.upsert({
        where: { name },
        update: { count: { increment: 1 } },
        create: { name, count: 1 },
      });
    }
  }
}
