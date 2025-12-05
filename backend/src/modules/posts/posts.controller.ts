import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { PostsService } from './posts.service.js';
import { CommentsService } from './comments.service.js';

export class PostsController {
  // GET /api/posts
  static async getAllPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await PostsService.getAllPosts(page, limit, req.user?.id);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/posts/:id
  static async getPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const post = await PostsService.getPost(req.params.id, req.user?.id);
      return ResponseUtils.success(res, post);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/posts
  static async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const post = await PostsService.createPost(req.user.id, req.body);
      return ResponseUtils.created(res, post, 'Post created successfully');
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/posts/:id
  static async updatePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const post = await PostsService.updatePost(req.params.id, req.user.id, req.body);
      return ResponseUtils.success(res, post, 'Post updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/posts/:id
  static async deletePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await PostsService.deletePost(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/posts/:id/like
  static async likePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await PostsService.likePost(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Post liked successfully');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/posts/:id/like
  static async unlikePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await PostsService.unlikePost(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Post unliked successfully');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/posts/:id/likes
  static async getPostLikes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await PostsService.getPostLikes(req.params.id, page, limit);
      return ResponseUtils.paginated(res, result.likes, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/posts/:id/comments
  static async getPostComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await CommentsService.getPostComments(req.params.id, page, limit);
      return ResponseUtils.paginated(res, result.comments, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/posts/:id/comments
  static async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const comment = await CommentsService.addComment(req.params.id, req.user.id, req.body.content);
      return ResponseUtils.created(res, comment, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/comments/:id
  static async updateComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const comment = await CommentsService.updateComment(req.params.id, req.user.id, req.body.content);
      return ResponseUtils.success(res, comment, 'Comment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/comments/:id
  static async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await CommentsService.deleteComment(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/comments/:id/reply
  static async replyToComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const reply = await CommentsService.replyToComment(req.params.id, req.user.id, req.body.content);
      return ResponseUtils.created(res, reply, 'Reply added successfully');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/comments/:id/like
  static async likeComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await CommentsService.likeComment(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Comment liked successfully');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/comments/:id/like (Note: This route isn't in the schema, adding for completeness)
  static async unlikeComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await CommentsService.unlikeComment(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Comment unliked successfully');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/comments/:id/replies
  static async getCommentReplies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await CommentsService.getCommentReplies(req.params.id, page, limit);
      return ResponseUtils.paginated(res, result.replies, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }
}
