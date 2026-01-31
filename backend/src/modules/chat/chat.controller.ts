import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { ChatService } from './chat.service.js';

export class ChatController {
  // GET /api/messages/conversations
  static async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const conversations = await ChatService.getConversations(req.user.id);
      return ResponseUtils.success(res, conversations);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/messages/:userId
  static async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await ChatService.getMessages(req.user.id, req.params.userId, page, limit);
      return ResponseUtils.paginated(res, result.messages, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/messages
  static async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const message = await ChatService.sendMessage(req.user.id, req.body.recipientId, req.body.content);
      return ResponseUtils.created(res, message, 'Message sent successfully');
    } catch (error) {
      return next(error);
    }
  }

  // PATCH /api/messages/:id/read
  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await ChatService.markAsRead(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Message marked as read');
    } catch (error) {
      return next(error);
    }
  }

  // DELETE /api/messages/:id
  static async deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      await ChatService.deleteMessage(req.params.id, req.user.id);
      return ResponseUtils.success(res, null, 'Message deleted successfully');
    } catch (error) {
      return next(error);
    }
  }
}
