import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Public routes (with optional auth)
router.get('/', AuthMiddleware.optionalAuthenticate, UsersController.getAllUsers);
router.get('/:id', AuthMiddleware.optionalAuthenticate, UsersController.getUserProfile);
router.get('/:id/followers', UsersController.getFollowers);
router.get('/:id/following', UsersController.getFollowing);

// Protected routes
router.patch('/profile', AuthMiddleware.authenticate, UsersController.updateProfile);
router.post('/:id/follow', AuthMiddleware.authenticate, UsersController.followUser);
router.delete('/:id/follow', AuthMiddleware.authenticate, UsersController.unfollowUser);

export default router;
