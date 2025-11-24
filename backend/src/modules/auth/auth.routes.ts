import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes
router.get('/me', AuthMiddleware.authenticate, AuthController.getCurrentUser);
router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);
router.post('/change-password', AuthMiddleware.authenticate, AuthController.changePassword);

export default router;
