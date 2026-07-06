import { StreamsClient } from '../../shared/redis/streams.js';
import { getRedisClient, isRedisConnected } from '../../shared/database/redis.js';
import { SocketService } from '../../shared/socket/socket.service.js';
import { logger } from '../../shared/utils/logger.js';

// Delivery to an *online* recipient never goes through this module at all —
// ChatService.sendMessage() emits directly and immediately acks its own
// entry (see chat.service.ts). This module exists purely for the replay
// guarantee: whatever a user missed while offline, or that got left
// pending by a crash between "read" and "ack", is caught up in one shot
// when they connect.
//
// An earlier version kept one standing loop per connected user, each
// holding its own Redis connection and cycling every ~2s forever whether
// or not anything needed delivering. Measured directly under load (~2,000
// concurrent sockets): message delivery latency sat at 900ms-2s regardless
// of three different fixes to that loop's Redis usage (dedicated
// connections, parallelized round trips, deduped bookkeeping) — the actual
// cost was N permanently-running loops adding to Socket.IO/Node's
// single-threaded event-loop overhead, not anything Redis was doing slowly
// (confirmed: a raw redis-cli blocking read woke in ~80ms; a non-k6 client
// reproduced the same latency, ruling out both Redis and the load-test
// tool). Removing the standing loop — replacing continuous polling with an
// event-driven direct emit plus a one-shot catch-up read — removes that
// per-connected-user background cost entirely; ongoing work now scales
// with actual message/connect rate instead of connected-user count.
export const CONSUMER_NAME = 'primary';

export const groupFor = (userId: string) => `cg:${userId}`;
const userStreamsKey = (userId: string) => `user-streams:${userId}`;

// Called on every sendMessage() so both participants' stream index includes
// this conversation — avoids a Postgres round trip just to know which
// streams a connecting user needs to read.
export async function registerConversationStream(userId: string, streamKey: string): Promise<void> {
  const client = getRedisClient();
  if (!isRedisConnected() || !client) return;
  await client.sAdd(userStreamsKey(userId), streamKey);
}

async function processEntries(
  userId: string,
  streamKey: string,
  group: string,
  entries: Array<{ id: string; message: Record<string, string> }>
): Promise<void> {
  if (entries.length === 0) return;

  const ackIds: string[] = [];
  for (const entry of entries) {
    ackIds.push(entry.id);

    // The shared conversation stream carries both directions; this
    // consumer only delivers entries addressed to it and acks the rest
    // immediately so they don't pile up in its own PEL.
    if (entry.message.recipientId !== userId) continue;

    try {
      const payload = JSON.parse(entry.message.payload);
      SocketService.sendMessage(userId, payload);
    } catch (err) {
      logger.error(err, 'Failed to parse chat stream payload');
    }
  }

  await StreamsClient.ack(streamKey, group, ackIds);
}

// One-shot: called when a user connects (any of their sockets, on any
// gateway). Ensures each of their conversation streams has a group, drains
// anything left in their PEL from a prior crash, then drains anything new
// they missed while disconnected. No loop, no held-open connection — this
// runs once and returns.
export async function catchUpForUser(userId: string): Promise<void> {
  if (!isRedisConnected()) return;
  const client = getRedisClient();
  if (!client) return;

  const group = groupFor(userId);
  const streamKeys = await client.sMembers(userStreamsKey(userId));
  if (streamKeys.length === 0) return;

  await Promise.all(streamKeys.map((key) => StreamsClient.ensureGroup(key, group)));

  await Promise.all(
    streamKeys.map(async (streamKey) => {
      const pending = await StreamsClient.readPending(streamKey, group, CONSUMER_NAME);
      await processEntries(userId, streamKey, group, pending);
    })
  );

  const results = await StreamsClient.readAvailableMulti(streamKeys, group, CONSUMER_NAME);
  await Promise.all(results.map(({ name, messages }) => processEntries(userId, name, group, messages)));
}
