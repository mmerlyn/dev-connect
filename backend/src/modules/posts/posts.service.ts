import { prisma } from '../../shared/database/client.js';
import { SocketService } from '../../shared/socket/socket.service.js';

export class PostsService {
  static async createPost(userId: string, data: any) {
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

    if (hashtags.length > 0) {
      await this.updateHashtagCounts(hashtags);
    }

    return post;
  }

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

    await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });

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

  static async updatePost(postId: string, userId: string, data: any) {
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

  static async likePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

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

    if (post.authorId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          type: 'LIKE_POST',
          content: 'liked your post',
          recipientId: post.authorId,
          senderId: userId,
          postId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });
      SocketService.sendNotification(post.authorId, notification);
    }

    return like;
  }

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

  private static extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    if (!matches) return [];
    return [...new Set(matches.map((tag) => tag.toLowerCase()))];
  }

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

  static async getUserLikedPosts(userId: string, requestingUserId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: {
          userId,
          postId: { not: null },
        },
        skip,
        take: limit,
        include: {
          post: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.like.count({
        where: {
          userId,
          postId: { not: null },
        },
      }),
    ]);

    const posts = likes
      .filter((like) => like.post !== null)
      .map((like) => like.post!);

    if (requestingUserId) {
      const postsWithLikeStatus = await Promise.all(
        posts.map(async (post) => {
          const isLiked = await prisma.like.findUnique({
            where: {
              userId_postId: {
                userId: requestingUserId,
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
}
