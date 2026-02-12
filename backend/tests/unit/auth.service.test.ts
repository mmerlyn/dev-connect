import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mock = (fn: unknown) => fn as jest.Mock<(...args: any[]) => any>;
const fn = () => jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule('../../src/shared/database/client.js', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/shared/database/redis.js', () => ({
  redisCache: { get: fn().mockResolvedValue(null), set: fn().mockResolvedValue(false), del: fn().mockResolvedValue(false) },
  connectRedis: fn().mockResolvedValue(false),
  disconnectRedis: fn().mockResolvedValue(undefined),
  isRedisConnected: fn().mockReturnValue(false),
  getRedisClient: fn().mockReturnValue(null),
}));

jest.unstable_mockModule('../../src/shared/socket/socket.service.js', () => ({
  SocketService: {
    initialize: jest.fn(),
    sendNotification: jest.fn(),
    sendMessage: jest.fn(),
    emitToUser: jest.fn(),
    notifyNewPost: jest.fn(),
    shutdown: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/shared/services/email.service.js', () => ({
  EmailService: {
    sendVerificationEmail: fn().mockResolvedValue(undefined),
    sendWelcomeEmail: fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: fn().mockResolvedValue(undefined),
  },
}));

const { prisma } = await import('../../src/shared/database/client.js');
const { AuthService } = await import('../../src/modules/auth/auth.service.js');
const { AuthUtils } = await import('../../src/shared/utils/auth.utils.js');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    it('creates user with hashed password and returns tokens', async () => {
      mock(prisma.user.findFirst).mockResolvedValue(null);
      mock(prisma.user.create).mockResolvedValue({
        id: 'user-1',
        email: registerData.email,
        username: registerData.username,
        password: 'hashed-password',
        displayName: registerData.displayName,
        twoFactorSecret: null,
      });

      const result = await AuthService.register(registerData);

      // Should hash password before storing
      const createCall = mock(prisma.user.create).mock.calls[0] as any[];
      expect(createCall[0].data.password).not.toBe(registerData.password);

      // Should return tokens and sanitized user
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('twoFactorSecret');
    });

    it('throws on duplicate email', async () => {
      mock(prisma.user.findFirst).mockResolvedValue({
        id: 'existing-user',
        email: registerData.email,
        username: 'other',
      });

      await expect(AuthService.register(registerData)).rejects.toThrow('Email already exists');
    });

    it('throws on duplicate username', async () => {
      mock(prisma.user.findFirst).mockResolvedValue({
        id: 'existing-user',
        email: 'other@example.com',
        username: registerData.username,
      });

      await expect(AuthService.register(registerData)).rejects.toThrow('Username already exists');
    });
  });

  describe('login', () => {
    const loginData = { email: 'test@example.com', password: 'password123' };

    it('returns tokens for valid credentials', async () => {
      const hashedPassword = await AuthUtils.hashPassword(loginData.password);

      mock(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: loginData.email,
        password: hashedPassword,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });
      mock(prisma.user.update).mockResolvedValue({});

      const result = await AuthService.login(loginData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      // Should update lastActive
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('returns requires2FA when 2FA is enabled', async () => {
      const hashedPassword = await AuthUtils.hashPassword(loginData.password);

      mock(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: loginData.email,
        password: hashedPassword,
        twoFactorEnabled: true,
      });

      const result = await AuthService.login(loginData);

      expect(result).toEqual({ requires2FA: true, userId: 'user-1' });
      // Should NOT update lastActive before 2FA verification
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws on invalid credentials', async () => {
      mock(prisma.user.findUnique).mockResolvedValue(null);

      await expect(AuthService.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });
});
