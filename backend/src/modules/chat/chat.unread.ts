import { getRedisClient, isRedisConnected } from '../../shared/database/redis.js';

const unreadKey = (userId: string) => `unread:${userId}`;

// Redis-native unread counters, keyed by (recipient, sender) pair. Replaces
// a per-partner Postgres COUNT query on every getConversations() call with
// an O(1) hash read. Returns -1 (not 0) when Redis is unavailable so callers
// can tell "no unread messages" apart from "couldn't ask" and fall back to
// the Postgres count instead of silently reporting zero.
export const ChatUnread = {
  async increment(recipientId: string, senderId: string): Promise<void> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return;
    await client.hIncrBy(unreadKey(recipientId), senderId, 1);
  },

  async decrement(recipientId: string, senderId: string): Promise<void> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return;
    const remaining = await client.hIncrBy(unreadKey(recipientId), senderId, -1);
    if (remaining <= 0) {
      await client.hDel(unreadKey(recipientId), senderId);
    }
  },

  async reset(recipientId: string, senderId: string): Promise<void> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return;
    await client.hDel(unreadKey(recipientId), senderId);
  },

  async get(recipientId: string, senderId: string): Promise<number> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return -1;
    const value = await client.hGet(unreadKey(recipientId), senderId);
    return value ? parseInt(value, 10) : 0;
  },
};
