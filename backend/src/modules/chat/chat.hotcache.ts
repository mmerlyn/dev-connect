import { getRedisClient, isRedisConnected } from '../../shared/database/redis.js';

const HOT_CACHE_LIMIT = 50;

const hotKey = (conversationKey: string) => `chat:hot:${conversationKey}`;
const hotDataKey = (conversationKey: string) => `chat:hotdata:${conversationKey}`;

// Last-N-messages cache per conversation. The sorted set (score = sent
// timestamp) gives cheap "most recent K" reads and cheap trimming by rank;
// the hash holds the actual message JSON keyed by message id. Both are best
// effort — any miss just falls back to Postgres, same as this app's other
// Redis-backed caches.
export const ChatHotCache = {
  async add(conversationKey: string, message: { id: string; createdAt: Date | string }): Promise<void> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return;

    const score = new Date(message.createdAt).getTime();
    await client.zAdd(hotKey(conversationKey), { score, value: message.id });
    await client.hSet(hotDataKey(conversationKey), message.id, JSON.stringify(message));

    const size = await client.zCard(hotKey(conversationKey));
    if (size > HOT_CACHE_LIMIT) {
      // Lowest-scored (oldest) entries sit at the bottom ranks.
      const stale = await client.zRange(hotKey(conversationKey), 0, size - HOT_CACHE_LIMIT - 1);
      if (stale.length > 0) {
        await client.zRem(hotKey(conversationKey), stale);
        await client.hDel(hotDataKey(conversationKey), stale);
      }
    }
  },

  // Returns the most recent `limit` messages (newest first), or null on any
  // kind of miss — Redis down, not enough cached history yet, or a message
  // id present in the sorted set whose hash entry was independently evicted
  // — so the caller always has an unambiguous "go to Postgres" signal.
  async getRecent(conversationKey: string, limit: number): Promise<unknown[] | null> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return null;

    const ids = await client.zRange(hotKey(conversationKey), 0, limit - 1, { REV: true });
    if (ids.length < limit) return null;

    const raw = await client.hmGet(hotDataKey(conversationKey), ids);
    if (raw.some((value) => value === null)) return null;

    return raw.map((value) => JSON.parse(value as string));
  },
};
