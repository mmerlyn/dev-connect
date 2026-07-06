import { getRedisClient, isRedisConnected } from '../database/redis.js';
import { logger } from '../utils/logger.js';

type StreamEntry = { id: string; message: Record<string, string> };
type StreamResult = { name: string; messages: StreamEntry[] };
type RedisConn = NonNullable<ReturnType<typeof getRedisClient>>;

function defaultClient() {
  if (!isRedisConnected()) return null;
  return getRedisClient();
}

export const StreamsClient = {
  async xAdd(streamKey: string, fields: Record<string, string>): Promise<string | null> {
    const c = defaultClient();
    if (!c) return null;
    return c.xAdd(streamKey, '*', fields);
  },

  // Idempotent: MKSTREAM creates the stream if this is the very first entry
  // ever, and BUSYGROUP (the expected steady-state case once a group already
  // exists) is swallowed rather than treated as an error.
  async ensureGroup(streamKey: string, group: string, conn?: RedisConn): Promise<void> {
    const c = conn ?? defaultClient();
    if (!c) return;
    try {
      await c.xGroupCreate(streamKey, group, '0', { MKSTREAM: true });
    } catch (error) {
      const message = (error as Error).message || '';
      if (!message.includes('BUSYGROUP')) {
        logger.error(error, 'xGroupCreate error');
      }
    }
  },

  // Re-delivers this consumer's own not-yet-acked entries. Doesn't block —
  // returns immediately whether or not anything is pending. This is what
  // makes crash recovery work: entries read via readNew but never acked
  // stay in the group's PEL and come back here on the next call, even after
  // a full process restart, because the PEL lives in Redis, not the process.
  async readPending(
    streamKey: string,
    group: string,
    consumer: string,
    count = 50,
    conn?: RedisConn
  ): Promise<StreamEntry[]> {
    const c = conn ?? defaultClient();
    if (!c) return [];
    const result = await c.xReadGroup(group, consumer, { key: streamKey, id: '0' }, { COUNT: count });
    return result?.[0]?.messages ?? [];
  },

  // Non-blocking: returns whatever's immediately available (or nothing) for
  // entries this group has never seen, across every stream key at once.
  // This is the one-shot catch-up read used on connect and on ack, as
  // opposed to readNewMulti's continuous BLOCKing wait -- see
  // chat.streams.consumer.ts for why the continuous-wait model was replaced.
  async readAvailableMulti(
    streamKeys: string[],
    group: string,
    consumer: string,
    count = 50,
    conn?: RedisConn
  ): Promise<StreamResult[]> {
    const c = conn ?? defaultClient();
    if (!c || streamKeys.length === 0) return [];
    const streams = streamKeys.map((key) => ({ key, id: '>' }));
    const result = await c.xReadGroup(group, consumer, streams, { COUNT: count });
    return result ?? [];
  },

  async ack(streamKey: string, group: string, ids: string[], conn?: RedisConn): Promise<void> {
    const c = conn ?? defaultClient();
    if (!c || ids.length === 0) return;
    await c.xAck(streamKey, group, ids);
  },

  // Claims entries that have sat unacked longer than minIdleMs from any
  // consumer in the group — covers a consumer that crashed after XREADGROUP
  // but is never coming back to XACK its own PEL.
  async reclaimStale(streamKey: string, group: string, consumer: string, minIdleMs: number) {
    const c = defaultClient();
    if (!c) return [];
    const result = await c.xAutoClaim(streamKey, group, consumer, minIdleMs, '0-0', { COUNT: 50 });
    return result.messages;
  },

  async pendingCount(streamKey: string, group: string): Promise<number> {
    const c = defaultClient();
    if (!c) return 0;
    const summary = await c.xPending(streamKey, group);
    return summary?.pending ?? 0;
  },
};
