import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/index.js';
import { ResponseUtils } from '../../shared/utils/response.utils.js';
import { AuthService } from './auth.service.js';
import { TwoFactorService } from './twoFactor.service.js';
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

  // POST /api/auth/link/:provider
  static async linkOAuthAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const { provider } = req.params;
      const { providerId } = req.body;

      if (provider !== 'github' && provider !== 'google') {
        return ResponseUtils.badRequest(res, 'Invalid provider');
      }

      if (!providerId) {
        return ResponseUtils.badRequest(res, 'Provider ID is required');
      }

      const user = await AuthService.linkOAuthAccount(req.user.id, provider, providerId);
      return ResponseUtils.success(res, user, `${provider} account linked successfully`);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/auth/unlink/:provider
  static async unlinkOAuthAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const { provider } = req.params;

      if (provider !== 'github' && provider !== 'google') {
        return ResponseUtils.badRequest(res, 'Invalid provider');
      }

      const user = await AuthService.unlinkOAuthAccount(req.user.id, provider);
      return ResponseUtils.success(res, user, `${provider} account unlinked successfully`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/2fa/generate
  static async generate2FASecret(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const result = await TwoFactorService.generateSecret(req.user.id);
      return ResponseUtils.success(res, result, 'Scan the QR code with your authenticator app');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/2fa/enable
  static async enable2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const { token } = req.body;
      if (!token) {
        return ResponseUtils.badRequest(res, 'Verification code is required');
      }
      const result = await TwoFactorService.enable(req.user.id, token);
      return ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/2fa/disable
  static async disable2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const { token } = req.body;
      if (!token) {
        return ResponseUtils.badRequest(res, 'Verification code is required');
      }
      const result = await TwoFactorService.disable(req.user.id, token);
      return ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/2fa/verify
  static async verify2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, token } = req.body;
      if (!userId || !token) {
        return ResponseUtils.badRequest(res, 'User ID and verification code are required');
      }
      const isValid = await TwoFactorService.verify(userId, token);
      if (!isValid) {
        return ResponseUtils.badRequest(res, 'Invalid verification code');
      }
      // Generate tokens after successful 2FA verification
      const result = await AuthService.complete2FALogin(userId);
      return ResponseUtils.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/2fa/status
  static async get2FAStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const enabled = await TwoFactorService.is2FAEnabled(req.user.id);
      return ResponseUtils.success(res, { enabled });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/send-verification-email
  static async sendVerificationEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtils.unauthorized(res);
      }
      const result = await AuthService.sendVerificationEmail(req.user.id);
      return ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify-email
  static async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        return ResponseUtils.badRequest(res, 'Verification token is required');
      }
      const result = await AuthService.verifyEmail(token);
      return ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/forgot-password
  static async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return ResponseUtils.badRequest(res, 'Email is required');
      }
      const result = await AuthService.requestPasswordReset(email);
      return ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/reset-password
  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return ResponseUtils.badRequest(res, 'Token and password are required');
      }
      if (password.length < 8) {
        return ResponseUtils.badRequest(res, 'Password must be at least 8 characters');
      }
      const result = await AuthService.resetPassword(token, password);
      return ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
