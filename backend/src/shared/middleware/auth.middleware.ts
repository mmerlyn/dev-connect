import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AuthUtils } from '../utils/auth.utils.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { prisma } from '../database/client.js';

export class AuthMiddleware {
  // Verify JWT token and attach user to request
  static async authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ResponseUtils.unauthorized(res, 'No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer '

      // Verify token
      const decoded = AuthUtils.verifyAccessToken(token);
      if (!decoded) {
        return ResponseUtils.unauthorized(res, 'Invalid or expired token');
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return ResponseUtils.unauthorized(res, 'User not found');
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return ResponseUtils.unauthorized(res, 'Authentication failed');
    }
  }

  // Optional authentication (doesn't fail if no token)
  static async optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      const decoded = AuthUtils.verifyAccessToken(token);
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        if (user) {
          req.user = user;
        }
      }
      next();
    } catch (error) {
      next();
    }
  }
}
