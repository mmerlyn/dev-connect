import { randomUUID } from 'crypto';
import { prisma } from '../../shared/database/client.js';
import { StreamsClient } from '../../shared/redis/streams.js';
import { MessageWriteBehind } from '../../shared/redis/writeBehind.js';
import { registerConversationStream, groupFor } from './chat.streams.consumer.js';
import { ChatUnread } from './chat.unread.js';
import { ChatHotCache } from './chat.hotcache.js';
import { RedisPresence } from '../../shared/socket/redis-adapter.js';
import { SocketService } from '../../shared/socket/socket.service.js';
import { logger } from '../../shared/utils/logger.js';

// Deterministic per-pair key, independent of who sent to whom, so both
// participants' consumer groups and the shared hot cache agree on the same
// conversation identity regardless of direction.
function conversationKey(userIdA: string, userIdB: string): string {
  const [a, b] = [userIdA, userIdB].sort();
  return `${a}:${b}`;
}

export class ChatService {
  // Redis-native counter first (O(1) hash read); only falls back to a
  // Postgres COUNT if Redis is unavailable, instead of always paying for
  // both on every conversation, every time.
  private static async getUnreadCount(userId: string, otherUserId: string): Promise<number> {
    const cached = await ChatUnread.get(userId, otherUserId);
    if (cached !== -1) return cached;

    return prisma.message.count({
      where: { senderId: otherUserId, recipientId: userId, read: false },
    });
  }

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
          unreadCount: await ChatService.getUnreadCount(userId, otherUserId),
        };
      })
    );

    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt.getTime() || 0;
      const bTime = b.lastMessage?.createdAt.getTime() || 0;
      return bTime - aTime;
    });

    return conversations;
  }

  static async getMessages(userId: string, otherUserId: string, page: number = 1, limit: number = 50) {
    if (page === 1) {
      const cached = await ChatHotCache.getRecent(conversationKey(userId, otherUserId), limit);
      if (cached) {
        // Best-effort: serving from cache must keep working even if
        // Postgres itself is down, so a failure here shouldn't fail the request.
        try {
          await prisma.message.updateMany({
            where: { senderId: otherUserId, recipientId: userId, read: false },
            data: { read: true },
          });
        } catch {
          // Postgres unavailable; read-state catches up next time it's back.
        }
        await ChatUnread.reset(userId, otherUserId);

        let total = cached.length;
        try {
          total = await prisma.message.count({
            where: {
              OR: [
                { senderId: userId, recipientId: otherUserId },
                { senderId: otherUserId, recipientId: userId },
              ],
            },
          });
        } catch {
          // Fall back to the cached count as an approximation.
        }

        return { messages: cached.reverse(), total, page, limit };
      }
    }

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

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        recipientId: userId,
        read: false,
      },
      data: { read: true },
    });
    await ChatUnread.reset(userId, otherUserId);

    return { messages: messages.reverse(), total, page, limit };
  }

  static async sendMessage(senderId: string, recipientId: string, content: string) {
    if (senderId === recipientId) {
      throw new Error('Cannot send message to yourself');
    }

    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, username: true, displayName: true, avatar: true },
      }),
      prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, username: true, displayName: true, avatar: true },
      }),
    ]);

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const now = new Date();
    const message = {
      id: randomUUID(),
      content,
      read: false,
      senderId,
      recipientId,
      createdAt: now,
      updatedAt: now,
      sender: sender!,
      recipient,
    };

    // Write-behind: the row is written to Redis (hot cache + write-behind
    // queue) synchronously and the call returns before Postgres is touched;
    // shared/redis/writeBehind.ts flushes queued rows to Postgres in the
    // background on its own interval. If Redis is unavailable, enqueue()
    // returns false and we fall straight back to a synchronous Postgres
    // write so a message is never silently lost.
    const convKey = conversationKey(senderId, recipientId);
    const queued = await MessageWriteBehind.enqueue({
      id: message.id,
      content,
      senderId,
      recipientId,
      read: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    if (!queued) {
      await prisma.message.create({
        data: { id: message.id, content, senderId, recipientId, createdAt: now, updatedAt: now },
      });
    }
    await ChatHotCache.add(convKey, message);

    // The stream entry is durability + the offline/crash replay path (see
    // chat.streams.consumer.ts's catchUpForUser) — it is NOT how online
    // recipients get their message. An online recipient is delivered to
    // directly, immediately, below: Socket.IO's Redis adapter already
    // fans a room emit out to every instance, so there is no need to route
    // a live delivery through Streams at all. XADD still happens
    // unconditionally so a recipient who goes offline a moment later (or
    // was never online) still has it queued.
    const streamKey = `chat:stream:${convKey}`;
    await registerConversationStream(senderId, streamKey);
    await registerConversationStream(recipientId, streamKey);
    const entryId = await StreamsClient.xAdd(streamKey, {
      messageId: message.id,
      senderId,
      recipientId,
      payload: JSON.stringify(message),
    });

    const recipientOnline = await RedisPresence.isOnline(recipientId);
    if (recipientOnline && entryId) {
      const group = groupFor(recipientId);
      try {
        await StreamsClient.ensureGroup(streamKey, group);
        SocketService.sendMessage(recipientId, message);
        // Immediately ack our own entry against the recipient's group so
        // their next catch-up read doesn't redeliver something they
        // already got live. If this ack is lost (crash right here), the
        // entry stays pending and catchUpForUser redelivers it on their
        // next connect -- a rare duplicate, never a lost message.
        await StreamsClient.ack(streamKey, group, [entryId]);
      } catch (err) {
        logger.error(err, 'Direct online delivery failed; message remains queued for catch-up');
      }
    }

    await ChatUnread.increment(recipientId, senderId);

    return message;
  }

  static async markAsRead(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    let senderId: string;

    if (message) {
      if (message.recipientId !== userId) {
        throw new Error('Unauthorized');
      }
      await prisma.message.update({
        where: { id: messageId },
        data: { read: true },
      });
      senderId = message.senderId;
    } else {
      // Not flushed to Postgres yet — the write-behind queue is the only
      // place a very recently sent message exists, so check there before
      // concluding it doesn't exist.
      const pending = await MessageWriteBehind.getPending(messageId);
      if (!pending) {
        throw new Error('Message not found');
      }
      if (pending.recipientId !== userId) {
        throw new Error('Unauthorized');
      }
      await MessageWriteBehind.markRead(messageId);
      senderId = pending.senderId;
    }

    await ChatUnread.decrement(userId, senderId);

    // Read receipt: notify the sender live, wherever their socket is
    // connected. emitToUser fans out through Socket.IO's Redis adapter, so
    // this reaches the sender even if they're on a different gateway
    // instance than the reader — same cross-gateway pub/sub path typing
    // indicators use.
    SocketService.emitToUser(senderId, 'message-read', {
      messageId,
      readBy: userId,
    });

    return true;
  }

  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (message) {
      if (message.senderId !== userId) {
        throw new Error('Unauthorized to delete this message');
      }

      await prisma.message.delete({
        where: { id: messageId },
      });

      return true;
    }

    // Not flushed to Postgres yet — remove it from the write-behind queue
    // so it's never written at all, instead of deleting it right after.
    const pending = await MessageWriteBehind.getPending(messageId);
    if (!pending) {
      throw new Error('Message not found');
    }
    if (pending.senderId !== userId) {
      throw new Error('Unauthorized to delete this message');
    }

    await MessageWriteBehind.remove(messageId);
    return true;
  }
}
