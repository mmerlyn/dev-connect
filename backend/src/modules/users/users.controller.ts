import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { UsersService } from './users.service.js';

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
      next(error);
    }
  }

  // GET /api/users/:id
  static async getUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.getUserProfile(req.params.id, req.user?.id);
      return ResponseUtils.success(res, user);
    } catch (error) {
      next(error);
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
      next(error);
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
      next(error);
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
      next(error);
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
      next(error);
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
      next(error);
    }
  }
}
