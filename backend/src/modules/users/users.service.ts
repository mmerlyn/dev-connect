import { prisma } from '../../shared/database/client.js';
import { AuthUtils } from '../../shared/utils/auth.utils.js';
import { SocketService } from '../../shared/socket/socket.service.js';
import { UploadService } from '../../shared/services/upload.service.js';

export class UsersService {
  // Get all users with pagination
  static async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          skills: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  // Get user by ID or username
  static async getUserProfile(identifier: string, requestingUserId?: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { username: identifier }],
      },
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

    const sanitizedUser = AuthUtils.sanitizeUser(user);

    // Check if requesting user is following this user
    if (requestingUserId) {
      const isFollowing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: requestingUserId,
            followingId: user.id,
          },
        },
      });
      return { ...sanitizedUser, isFollowing: !!isFollowing };
    }

    return sanitizedUser;
  }

  // Update user profile
  static async updateProfile(userId: string, data: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        bio: data.bio,
        avatar: data.avatar,
        banner: data.banner,
        skills: data.skills,
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
        websiteUrl: data.websiteUrl,
        location: data.location,
      },
    });

    return AuthUtils.sanitizeUser(user);
  }

  // Follow user
  static async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new Error('User not found');
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new Error('Already following this user');
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        content: 'started following you',
        recipientId: followingId,
        senderId: followerId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    // Emit real-time notification
    SocketService.sendNotification(followingId, notification);

    return follow;
  }

  // Unfollow user
  static async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new Error('Not following this user');
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return true;
  }

  // Get user followers
  static async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      followers: followers.map((f) => f.follower),
      total,
      page,
      limit,
    };
  }

  // Get user following
  static async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      following: following.map((f) => f.following),
      total,
      page,
      limit,
    };
  }

  // Update user avatar
  static async updateAvatar(userId: string, file: Express.Multer.File) {
    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Delete old avatar if exists
    if (currentUser?.avatar) {
      await UploadService.deleteFile(currentUser.avatar);
    }

    // Upload new avatar
    const { url } = await UploadService.uploadAvatar(file);

    // Update user with new avatar URL
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });

    return { avatarUrl: url };
  }

  // Update user banner
  static async updateBanner(userId: string, file: Express.Multer.File) {
    // Get current user to check for existing banner
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { banner: true },
    });

    // Delete old banner if exists
    if (currentUser?.banner) {
      await UploadService.deleteFile(currentUser.banner);
    }

    // Upload new banner
    const { url } = await UploadService.uploadBanner(file);

    // Update user with new banner URL
    await prisma.user.update({
      where: { id: userId },
      data: { banner: url },
    });

    return { bannerUrl: url };
  }
}
