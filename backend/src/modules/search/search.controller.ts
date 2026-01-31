import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { SearchService } from './search.service.js';

export class SearchController {
  // GET /api/search?q=query
  static async universalSearch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return ResponseUtils.error(res, 'Search query is required', 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const results = await SearchService.universalSearch(query, page, limit);
      return ResponseUtils.success(res, results);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/search/users?q=query
  static async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return ResponseUtils.error(res, 'Search query is required', 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SearchService.searchUsers(query, page, limit);
      return ResponseUtils.paginated(res, result.users, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/search/posts?q=query
  static async searchPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return ResponseUtils.error(res, 'Search query is required', 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SearchService.searchPosts(query, page, limit);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/search/hashtags?q=query
  static async searchHashtags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return ResponseUtils.error(res, 'Search query is required', 400);
      }

      const hashtags = await SearchService.searchHashtags(query);
      return ResponseUtils.success(res, hashtags);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/search/hashtag/:tag
  static async getPostsByHashtag(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SearchService.getPostsByHashtag(req.params.tag, page, limit);
      return ResponseUtils.paginated(res, result.posts, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }
}
