import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';
import { uploadAvatar, uploadBanner } from '../../shared/middleware/upload.middleware.js';
import { followLimiter } from '../../shared/middleware/rateLimit.middleware.js';

const router = Router();

// Public routes (with optional auth)
router.get('/', AuthMiddleware.optionalAuthenticate, UsersController.getAllUsers);

// Protected routes (must come before /:id to avoid conflicts)
router.patch('/profile', AuthMiddleware.authenticate, UsersController.updateProfile);
router.post('/avatar', AuthMiddleware.authenticate, uploadAvatar.single('avatar'), UsersController.updateAvatar);
router.post('/banner', AuthMiddleware.authenticate, uploadBanner.single('banner'), UsersController.updateBanner);

// Public routes with dynamic params
router.get('/:id', AuthMiddleware.optionalAuthenticate, UsersController.getUserProfile);
router.get('/:id/followers', UsersController.getFollowers);
router.get('/:id/following', UsersController.getFollowing);
router.get('/:id/likes', AuthMiddleware.optionalAuthenticate, UsersController.getUserLikedPosts);

// Protected routes with dynamic params
router.post('/:id/follow', AuthMiddleware.authenticate, followLimiter, UsersController.followUser);
router.delete('/:id/follow', AuthMiddleware.authenticate, followLimiter, UsersController.unfollowUser);

export default router;
