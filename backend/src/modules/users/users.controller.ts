import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { UsersService } from './users.service.js';
import { PostsService } from '../posts/posts.service.js';

export class UsersController {
  // GET /api/users
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await UsersService.getAllUsers(page, limit, search);
      return ResponseUtils.paginated(res, result.users, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/users/:id
  static async getUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.getUserProfile(req.params.id, req.user?.id);
      return ResponseUtils.success(res, user);
    } catch (error) {
      return next(error);
    }
  }

  // PATCH /api/users/profile
  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const user = await UsersService.updateProfile(req.user.id, req.body);
      return ResponseUtils.success(res, user, 'Profile updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/users/:id/follow
  static async followUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await UsersService.followUser(req.user.id, req.params.id);
      return ResponseUtils.success(res, null, 'User followed successfully');
    } catch (error) {
      return next(error);
    }
  }

  // DELETE /api/users/:id/follow
  static async unfollowUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await UsersService.unfollowUser(req.user.id, req.params.id);
      return ResponseUtils.success(res, null, 'User unfollowed successfully');
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/users/:id/followers
  static async getFollowers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await UsersService.getFollowers(req.params.id, page, limit);
      return ResponseUtils.paginated(res, result.followers, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/users/:id/following
  static async getFollowing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await UsersService.getFollowing(req.params.id, page, limit);
      return ResponseUtils.paginated(res, result.following, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/users/avatar
  static async updateAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      if (!req.file) {
        return ResponseUtils.badRequest(res, 'No file uploaded');
      }

      const result = await UsersService.updateAvatar(req.user.id, req.file);
      return ResponseUtils.success(res, result, 'Avatar updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/users/banner
  static async updateBanner(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      if (!req.file) {
        return ResponseUtils.badRequest(res, 'No file uploaded');
      }

      const result = await UsersService.updateBanner(req.user.id, req.file);
      return ResponseUtils.success(res, result, 'Banner updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/users/:id/likes
  static async getUserLikedPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await PostsService.getUserLikedPosts(req.params.id, req.user?.id, page, limit);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }
}
