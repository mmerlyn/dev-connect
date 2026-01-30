import crypto from 'crypto';
import { prisma } from '../../shared/database/client.js';
import { AuthUtils } from '../../shared/utils/auth.utils.js';
import { RegisterDto, LoginDto } from './auth.validation.js';
import { EmailService } from '../../shared/services/email.service.js';

export class AuthService {
  // Handle OAuth callback - generate tokens for authenticated user
  static async handleOAuthCallback(user: any) {
    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Generate tokens
    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Link OAuth account to existing user
  static async linkOAuthAccount(userId: string, provider: 'github' | 'google', providerId: string) {
    const updateData = provider === 'github'
      ? { githubId: providerId }
      : { googleId: providerId };

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return AuthUtils.sanitizeUser(user);
  }

  // Unlink OAuth account from user
  static async unlinkOAuthAccount(userId: string, provider: 'github' | 'google') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has password or another OAuth provider linked
    const hasPassword = !!user.password;
    const hasGithub = !!user.githubId;
    const hasGoogle = !!user.googleId;

    if (provider === 'github' && !hasPassword && !hasGoogle) {
      throw new Error('Cannot unlink GitHub. You need at least one login method.');
    }

    if (provider === 'google' && !hasPassword && !hasGithub) {
      throw new Error('Cannot unlink Google. You need at least one login method.');
    }

    const updateData = provider === 'github'
      ? { githubId: null }
      : { googleId: null };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return AuthUtils.sanitizeUser(updatedUser);
  }
  // Register new user
  static async register(data: RegisterDto) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error('Email already exists');
      }
      if (existingUser.username === data.username) {
        throw new Error('Username already exists');
      }
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        displayName: data.displayName,
      },
    });

    // Generate tokens
    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Login user
  static async login(data: LoginDto) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // Compare passwords
    const isValidPassword = await AuthUtils.comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
      };
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Generate tokens
    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Complete login after 2FA verification
  static async complete2FALogin(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Generate tokens
    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  static async refreshToken(refreshToken: string) {
    const decoded = AuthUtils.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const newAccessToken = AuthUtils.generateAccessToken(user.id);
    const newRefreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Change password
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await AuthUtils.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  }

  // Get current user
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return AuthUtils.sanitizeUser(user);
  }

  // Send verification email
  static async sendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken: token,
        emailVerifyExpires: expires,
      },
    });

    // Send email
    await EmailService.sendVerificationEmail(user.email, token);

    return { message: 'Verification email sent' };
  }

  // Verify email with token
  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.displayName);

    return { message: 'Email verified successfully' };
  }

  // Request password reset
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return { message: 'If an account exists with this email, a password reset link has been sent' };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    // Send email
    await EmailService.sendPasswordResetEmail(user.email, token);

    return { message: 'If an account exists with this email, a password reset link has been sent' };
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }
}
