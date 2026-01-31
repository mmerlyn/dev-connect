import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AuthUtils } from '../utils/auth.utils.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { prisma } from '../database/client.js';

export class AuthMiddleware {
  static async authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return ResponseUtils.unauthorized(res, 'No token provided');
      }

      const token = authHeader.substring(7);
      const decoded = AuthUtils.verifyAccessToken(token);
      if (!decoded) {
        return ResponseUtils.unauthorized(res, 'Invalid or expired token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return ResponseUtils.unauthorized(res, 'User not found');
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Authentication error:', error);
      return ResponseUtils.unauthorized(res, 'Authentication failed');
    }
  }

  static async optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
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
      return next();
    } catch {
      return next();
    }
  }
}
