import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.validation.js';

export class AuthController {
  // POST /api/auth/register
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      return ResponseUtils.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      return ResponseUtils.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh
  static async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = refreshTokenSchema.parse(req.body);
      const result = await AuthService.refreshToken(data.refreshToken);
      return ResponseUtils.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  static async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const user = await AuthService.getCurrentUser(req.user.id);
      return ResponseUtils.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/logout
  static async logout(req: AuthRequest, res: Response) {
    // In a stateless JWT system, logout is handled client-side
    // Here we can add token to blacklist in Redis if needed
    return ResponseUtils.success(res, null, 'Logged out successfully');
  }

  // POST /api/auth/change-password
  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const data = changePasswordSchema.parse(req.body);
      await AuthService.changePassword(req.user.id, data.currentPassword, data.newPassword);
      return ResponseUtils.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}
