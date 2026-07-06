import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';
import { tokenBucketLimiter } from '../../shared/redis/tokenBucket.middleware.js';

const router = Router();

// Per-user budget: 30 messages/min across all conversations.
const perUserMessageLimiter = tokenBucketLimiter({
  capacity: 30,
  refillPerSecond: 30 / 60,
  keyFn: (req) => (req.user ? `ratelimit:msg:${req.user.id}` : null),
  message: 'Too many messages sent, please slow down.',
});

// Per-conversation budget: 10 messages/min to any single recipient, so a
// user's overall budget can't be dumped on one person in a burst.
const perConversationMessageLimiter = tokenBucketLimiter({
  capacity: 10,
  refillPerSecond: 10 / 60,
  keyFn: (req) =>
    req.user && req.body?.recipientId
      ? `ratelimit:conv:${req.user.id}:${req.body.recipientId}`
      : null,
  message: 'Too many messages to this conversation, please slow down.',
});

router.get('/conversations', AuthMiddleware.authenticate, ChatController.getConversations);
router.get('/:userId', AuthMiddleware.authenticate, ChatController.getMessages);
router.post(
  '/',
  AuthMiddleware.authenticate,
  perUserMessageLimiter,
  perConversationMessageLimiter,
  ChatController.sendMessage
);
router.patch('/:id/read', AuthMiddleware.authenticate, ChatController.markAsRead);
router.delete('/:id', AuthMiddleware.authenticate, ChatController.deleteMessage);

export default router;
