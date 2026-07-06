import crypto from 'crypto';
import { prisma } from '../../shared/database/client.js';
import { AuthUtils } from '../../shared/utils/auth.utils.js';
import { RegisterDto, LoginDto } from './auth.validation.js';
import { EmailService } from '../../shared/services/email.service.js';

export class AuthService {
  static async handleOAuthCallback(user: any) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

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

  static async unlinkOAuthAccount(userId: string, provider: 'github' | 'google') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

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

  static async register(data: RegisterDto) {
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

    const hashedPassword = await AuthUtils.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        displayName: data.displayName,
      },
    });

    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await AuthUtils.comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async complete2FALogin(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    const accessToken = AuthUtils.generateAccessToken(user.id);
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    return {
      user: AuthUtils.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

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

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new Error('User not found');
    }

    const isValidPassword = await AuthUtils.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  }

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

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken: token,
        emailVerifyExpires: expires,
      },
    });

    await EmailService.sendVerificationEmail(user.email, token);

    return { message: 'Verification email sent' };
  }

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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    await EmailService.sendWelcomeEmail(user.email, user.displayName);

    return { message: 'Email verified successfully' };
  }

  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return { message: 'If an account exists with this email, a password reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    await EmailService.sendPasswordResetEmail(user.email, token);

    return { message: 'If an account exists with this email, a password reset link has been sent' };
  }

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

    const hashedPassword = await AuthUtils.hashPassword(newPassword);

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
