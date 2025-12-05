import { prisma } from '../../shared/database/client.js';
import { AuthUtils } from '../../shared/utils/auth.utils.js';
import { RegisterDto, LoginDto } from './auth.validation.js';

export class AuthService {
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
}
