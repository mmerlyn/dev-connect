import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

export class AuthUtils {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT access token
  static generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  // Generate JWT refresh token
  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Remove sensitive fields from user object
  static sanitizeUser(user: any) {
    const { password, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}
