import { prisma } from '../../shared/database/client.js';

export class ChatService {
  // Get user conversations
  static async getConversations(userId: string) {
    // Get unique users the current user has exchanged messages with
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      distinct: ['recipientId'],
      select: { recipientId: true },
    });

    const receivedMessages = await prisma.message.findMany({
      where: { recipientId: userId },
      distinct: ['senderId'],
      select: { senderId: true },
    });

    const userIds = new Set([
      ...sentMessages.map((m) => m.recipientId),
      ...receivedMessages.map((m) => m.senderId),
    ]);

    // Get conversation details for each user
    const conversations = await Promise.all(
      Array.from(userIds).map(async (otherUserId) => {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, recipientId: otherUserId },
              { senderId: otherUserId, recipientId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: otherUserId,
            recipientId: userId,
            read: false,
          },
        });

        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            lastActive: true,
          },
        });

        return {
          user: otherUser,
          lastMessage,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt.getTime() || 0;
      const bTime = b.lastMessage?.createdAt.getTime() || 0;
      return bTime - aTime;
    });

    return conversations;
  }

  // Get messages between two users
  static async getMessages(userId: string, otherUserId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId },
          ],
        },
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
      prisma.message.count({
        where: {
          OR: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId },
          ],
        },
      }),
    ]);

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        recipientId: userId,
        read: false,
      },
      data: { read: true },
    });

    return { messages: messages.reverse(), total, page, limit };
  }

  // Send message
  static async sendMessage(senderId: string, recipientId: string, content: string) {
    if (senderId === recipientId) {
      throw new Error('Cannot send message to yourself');
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        recipientId,
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
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return message;
  }

  // Mark message as read
  static async markAsRead(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });

    return true;
  }

  // Delete message
  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Unauthorized to delete this message');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return true;
  }
}
