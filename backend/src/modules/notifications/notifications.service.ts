import { prisma } from '../../shared/database/client.js';

export class NotificationsService {
  // Get user notifications
  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: userId },
        skip,
        take: limit,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: { recipientId: userId },
      }),
      prisma.notification.count({
        where: {
          recipientId: userId,
          read: false,
        },
      }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return true;
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        read: false,
      },
      data: { read: true },
    });

    return true;
  }

  // Delete notification
  static async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return true;
  }

  // Get unread count
  static async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });

    return { count };
  }
}
