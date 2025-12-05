import { prisma } from '../../shared/database/client.js';

export class CommentsService {
  // Get post comments (only top-level, with replies count)
  static async getPostComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          parentId: null, // Only top-level comments
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
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
    ]);

    return { comments, total, page, limit };
  }

  // Get comment replies
  static async getCommentReplies(commentId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
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
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    return { replies, total, page, limit };
  }

  // Add comment to post
  static async addComment(postId: string, userId: string, content: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
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
            replies: true,
          },
        },
      },
    });

    // Create notification if not own post
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_POST',
          content: 'commented on your post',
          recipientId: post.authorId,
          senderId: userId,
          postId,
          commentId: comment.id,
        },
      });
    }

    return comment;
  }

  // Reply to comment
  static async replyToComment(commentId: string, userId: string, content: string) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!parentComment) {
      throw new Error('Comment not found');
    }

    const reply = await prisma.comment.create({
      data: {
        content,
        postId: parentComment.postId,
        authorId: userId,
        parentId: commentId,
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
          },
        },
      },
    });

    // Create notification for comment author
    if (parentComment.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'REPLY_COMMENT',
          content: 'replied to your comment',
          recipientId: parentComment.authorId,
          senderId: userId,
          postId: parentComment.postId,
          commentId: reply.id,
        },
      });
    }

    return reply;
  }

  // Update comment
  static async updateComment(commentId: string, userId: string, content: string) {
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.authorId !== userId) {
      throw new Error('Unauthorized to update this comment');
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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
            replies: true,
          },
        },
      },
    });

    return comment;
  }

  // Delete comment
  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return true;
  }

  // Like comment
  static async likeComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      throw new Error('Comment already liked');
    }

    const like = await prisma.like.create({
      data: {
        userId,
        commentId,
      },
    });

    // Create notification if not own comment
    if (comment.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'LIKE_COMMENT',
          content: 'liked your comment',
          recipientId: comment.authorId,
          senderId: userId,
          commentId,
        },
      });
    }

    return like;
  }

  // Unlike comment
  static async unlikeComment(commentId: string, userId: string) {
    const like = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (!like) {
      throw new Error('Comment not liked');
    }

    await prisma.like.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    return true;
  }
}
