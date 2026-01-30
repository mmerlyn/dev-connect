import { Router } from 'express';
import passport from '../../config/passport.js';
import { AuthController } from './auth.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';
import { AuthService } from './auth.service.js';
import { config } from '../../config/index.js';
import { authLimiter } from '../../shared/middleware/rateLimit.middleware.js';

const router = Router();

// Public routes (with stricter rate limiting for auth)
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { session: false }));

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${config.frontendUrl}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const user = req.user as any;
      const result = await AuthService.handleOAuthCallback(user);

      // Redirect to frontend with tokens
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      res.redirect(`${config.frontendUrl}/oauth/callback?${params.toString()}`);
    } catch (error) {
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  }
);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${config.frontendUrl}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const user = req.user as any;
      const result = await AuthService.handleOAuthCallback(user);

      // Redirect to frontend with tokens
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      res.redirect(`${config.frontendUrl}/oauth/callback?${params.toString()}`);
    } catch (error) {
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  }
);

// Protected routes
router.get('/me', AuthMiddleware.authenticate, AuthController.getCurrentUser);
router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);
router.post('/change-password', AuthMiddleware.authenticate, AuthController.changePassword);

// Link/Unlink OAuth accounts (for authenticated users)
router.post('/link/:provider', AuthMiddleware.authenticate, AuthController.linkOAuthAccount);
router.delete('/unlink/:provider', AuthMiddleware.authenticate, AuthController.unlinkOAuthAccount);

// 2FA routes
router.post('/2fa/generate', AuthMiddleware.authenticate, AuthController.generate2FASecret);
router.post('/2fa/enable', AuthMiddleware.authenticate, AuthController.enable2FA);
router.post('/2fa/disable', AuthMiddleware.authenticate, AuthController.disable2FA);
router.post('/2fa/verify', authLimiter, AuthController.verify2FA); // Public - used during login (rate limited)
router.get('/2fa/status', AuthMiddleware.authenticate, AuthController.get2FAStatus);

// Email verification routes
router.post('/send-verification-email', AuthMiddleware.authenticate, AuthController.sendVerificationEmail);
router.post('/verify-email', authLimiter, AuthController.verifyEmail); // Public - used from email link

// Password reset routes
router.post('/forgot-password', authLimiter, AuthController.forgotPassword); // Public
router.post('/reset-password', authLimiter, AuthController.resetPassword); // Public

export default router;
