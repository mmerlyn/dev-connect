import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { FeedService } from './feed.service.js';
import { RecommendationService } from '../recommendation/recommendation.service.js';

export class FeedController {
  // GET /api/feed
  static async getPersonalizedFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await FeedService.getPersonalizedFeed(req.user.id, page, limit);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/feed/trending
  static async getTrendingPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await FeedService.getTrendingPosts(page, limit, req.user?.id);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/feed/following
  static async getFollowingFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await FeedService.getFollowingFeed(req.user.id, page, limit);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/feed/recommended - ML-powered recommended feed
  static async getRecommendedFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await RecommendationService.getRecommendedFeed(req.user.id, page, limit);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/feed/recommended/status - Recommendation system status for current user
  static async getRecommendationStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      const status = await RecommendationService.getStatus(req.user.id);
      return ResponseUtils.success(res, status);
    } catch (error) {
      return next(error);
    }
  }
}
