import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { NotificationsService } from './notifications.service.js';

export class NotificationsController {
  // GET /api/notifications
  static async getUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationsService.getUserNotifications(req.user.id, page, limit);

      return res.json({
        success: true,
        data: result.notifications,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/notifications/:id/read
  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await NotificationsService.markAsRead(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/notifications/read-all
  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await NotificationsService.markAllAsRead(req.user.id);
      return ResponseUtils.success(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/notifications/:id
  static async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await NotificationsService.deleteNotification(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/notifications/unread-count
  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const result = await NotificationsService.getUnreadCount(req.user.id);
      return ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
