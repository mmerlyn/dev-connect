import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/conversations', AuthMiddleware.authenticate, ChatController.getConversations);
router.get('/:userId', AuthMiddleware.authenticate, ChatController.getMessages);
router.post('/', AuthMiddleware.authenticate, ChatController.sendMessage);
router.patch('/:id/read', AuthMiddleware.authenticate, ChatController.markAsRead);
router.delete('/:id', AuthMiddleware.authenticate, ChatController.deleteMessage);

export default router;
