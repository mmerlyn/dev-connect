import { Router } from 'express';
import { FeedController } from './feed.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/', AuthMiddleware.authenticate, FeedController.getPersonalizedFeed);
router.get('/trending', AuthMiddleware.optionalAuthenticate, FeedController.getTrendingPosts);
router.get('/following', AuthMiddleware.authenticate, FeedController.getFollowingFeed);

export default router;
