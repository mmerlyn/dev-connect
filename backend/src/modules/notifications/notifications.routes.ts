import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/', AuthMiddleware.authenticate, NotificationsController.getUserNotifications);
router.get('/unread-count', AuthMiddleware.authenticate, NotificationsController.getUnreadCount);
router.patch('/:id/read', AuthMiddleware.authenticate, NotificationsController.markAsRead);
router.patch('/read-all', AuthMiddleware.authenticate, NotificationsController.markAllAsRead);
router.delete('/:id', AuthMiddleware.authenticate, NotificationsController.deleteNotification);

export default router;
