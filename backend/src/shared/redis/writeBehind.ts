import { prisma } from '../database/client.js';
import { getRedisClient, isRedisConnected } from '../database/redis.js';
import { logger } from '../utils/logger.js';

const QUEUE_KEY = 'chat:writebehind:queue';
const PENDING_KEY = 'chat:writebehind:pending';
const FLUSH_INTERVAL_MS = 250;
const FLUSH_BATCH_SIZE = 200;

export interface PendingMessageRow {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

let flushTimer: ReturnType<typeof setInterval> | null = null;
let flushing = false;

// True write-behind for chat messages: the caller writes the row here (Redis
// only) and returns to the client immediately; this module is solely
// responsible for eventually getting the row into Postgres. Until that
// flush happens, this hash is the only place the row exists, so
// markAsRead/delete have to consult it too (see markRead/remove below) —
// otherwise a message read or deleted in the few hundred ms before its
// flush would look like it doesn't exist yet.
export const MessageWriteBehind = {
  // Returns false if Redis is unavailable, so the caller can fall back to
  // writing straight to Postgres instead of silently losing the message.
  async enqueue(row: PendingMessageRow): Promise<boolean> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return false;

    await client.hSet(PENDING_KEY, row.id, JSON.stringify(row));
    await client.rPush(QUEUE_KEY, row.id);
    return true;
  },

  async getPending(id: string): Promise<PendingMessageRow | null> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return null;

    const raw = await client.hGet(PENDING_KEY, id);
    return raw ? (JSON.parse(raw) as PendingMessageRow) : null;
  },

  // Flips the pending row's read flag in place so a message read while it's
  // still queued gets created in Postgres with read: true directly, instead
  // of needing a second write after the flush. Returns false if the row
  // isn't pending (already flushed, or never existed).
  async markRead(id: string): Promise<boolean> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return false;

    const raw = await client.hGet(PENDING_KEY, id);
    if (!raw) return false;

    const row = JSON.parse(raw) as PendingMessageRow;
    row.read = true;
    await client.hSet(PENDING_KEY, id, JSON.stringify(row));
    return true;
  },

  // Removes a still-queued row so it's never written to Postgres at all
  // (used when a message is deleted before its flush runs). Returns false
  // if the row isn't pending.
  async remove(id: string): Promise<boolean> {
    const client = getRedisClient();
    if (!isRedisConnected() || !client) return false;

    const deleted = await client.hDel(PENDING_KEY, id);
    await client.lRem(QUEUE_KEY, 1, id);
    return deleted > 0;
  },
};

async function flushOnce(): Promise<void> {
  const client = getRedisClient();
  if (!isRedisConnected() || !client) return;

  const ids: string[] = [];
  for (let i = 0; i < FLUSH_BATCH_SIZE; i++) {
    const id = await client.lPop(QUEUE_KEY);
    if (!id) break;
    ids.push(id);
  }
  if (ids.length === 0) return;

  const rawRows = await client.hmGet(PENDING_KEY, ids);
  const rows: PendingMessageRow[] = [];
  const foundIds: string[] = [];
  rawRows.forEach((raw, i) => {
    // A null entry means the row was removed (message deleted) before this
    // flush ran — nothing to write, and nothing to clean up.
    if (raw) {
      rows.push(JSON.parse(raw) as PendingMessageRow);
      foundIds.push(ids[i]);
    }
  });
  if (rows.length === 0) return;

  try {
    await prisma.message.createMany({
      data: rows.map((row) => ({
        id: row.id,
        content: row.content,
        senderId: row.senderId,
        recipientId: row.recipientId,
        read: row.read,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      skipDuplicates: true,
    });
    await client.hDel(PENDING_KEY, foundIds);
  } catch (error) {
    logger.error(error, 'Write-behind flush to Postgres failed; re-queuing batch for retry');
    // Pending hash entries were left untouched, so re-queuing the ids is
    // enough to retry the same rows next tick.
    await client.rPush(QUEUE_KEY, ids);
  }
}

export function startWriteBehindFlusher(): void {
  if (flushTimer) return;

  flushTimer = setInterval(() => {
    if (flushing) return;
    flushing = true;
    flushOnce()
      .catch((err) => logger.error(err, 'Write-behind flush tick error'))
      .finally(() => {
        flushing = false;
      });
  }, FLUSH_INTERVAL_MS);
}

// Best-effort final drain on graceful shutdown, bounded so a stuck Postgres
// connection can't hang the shutdown indefinitely.
export async function stopWriteBehindFlusher(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  const client = getRedisClient();
  if (!client || !isRedisConnected()) return;

  for (let i = 0; i < 20; i++) {
    const remaining = await client.lLen(QUEUE_KEY);
    if (!remaining) break;
    await flushOnce();
  }
}
