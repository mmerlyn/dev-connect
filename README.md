# DevConnect

A social platform for developers — share posts with syntax-highlighted code, follow people, and message them in real time. Built April 2026 – June 2026.

I built this to go past CRUD. The interesting part isn't posts and follows (those are here, and they work, but they're not the point) — it's the chat system underneath: Redis Streams for durable message delivery, consumer groups with offline replay, presence tracking, and rate limiting that's actually atomic under concurrent load. That's what this README focuses on.

**Stack:** TypeScript end to end — React 19 + Vite on the frontend, Node/Express on the backend, PostgreSQL via Prisma, Redis for everything real-time, Socket.IO for the WebSocket layer, Docker for local infra, deployed on Fly.io (backend) and S3 + CloudFront (frontend).

---

## Architecture

The chat system is designed to run behind multiple gateway instances, with Redis as the message bus between them — a single instance can't prove anything about cross-instance delivery, so the whole point is testing it with more than one.

```
                  ┌──▶ Node.js gateway 1 ──┐
Browser ── Nginx ─┼──▶ Node.js gateway 2 ──┼──▶ Redis ──▶ PostgreSQL
 (WebSocket)      └──▶ Node.js gateway 3 ──┘   (bus +      (message
                                                 cache)      history)
```

This 3-gateway setup runs locally via Docker Compose and is what the load tests below run against. Production on Fly.io currently runs a single instance (see Design Trade-offs) — the horizontal-scaling story is proven in the load-test harness, not live yet.

Redis is doing two different jobs here, deliberately:

- **Pub/sub** for things where losing a message doesn't matter and latency does: typing indicators, presence pings.
- **Streams + consumer groups** for actual chat messages: persistent, acknowledged with `XACK`, replayable with `XREADGROUP` if a recipient was offline. This is the part that has to be correct — a dropped pub/sub message is a UI glitch, a dropped chat message is a bug report.

### Sending a message, end to end

1. Sender hits `POST /api/messages`. Per-user and per-conversation token buckets (Lua script, atomic) check the rate limit.
2. The message is written to Redis immediately — a hot cache entry (sorted set) and a write-behind queue entry — and the request returns. Postgres hasn't been touched yet.
3. A background flusher drains the write-behind queue every 250ms and batch-inserts into Postgres. If Redis is down, step 2 falls back to a direct synchronous Postgres write instead, so nothing gets silently dropped.
4. The message is also `XADD`ed to the conversation's Redis stream, unconditionally — this is the durability path.
5. If the recipient is online (checked via a Redis presence key), the message is pushed to them directly over their socket and immediately acknowledged on the stream, so it won't be redelivered later.
6. If they're offline, the stream entry just sits there. On their next connect, they read their pending + new entries from the stream and catch up.

The reason for writing to Redis before Postgres (write-behind) instead of the other way around: an online recipient needs the message in under 100ms, and a synchronous Postgres round-trip on every send doesn't get you there reliably under load. Postgres still ends up with everything — just a couple hundred milliseconds later.

### Data model

8 Prisma models: `User`, `Post`, `Comment`, `Like` (polymorphic — one table for both post and comment likes via nullable FKs), `Follow` (self-referential many-to-many), `Message`, `Notification`, `Hashtag`. Cascade deletes throughout, so removing a user cleans up everything they touched.

---

## Features

**Auth & security**
- JWT access tokens (15min) + refresh tokens (7d), so a leaked access token has a short blast radius
- GitHub and Google OAuth via Passport, with account linking when the email matches an existing user
- TOTP 2FA (Speakeasy), works with any standard authenticator app
- Rate limiting on every route category, all backed by the same atomic Redis Lua token-bucket script — auth, password reset, posting, following, search, and chat each have their own budget

**Chat**
- Redis Streams + consumer groups for delivery, with offline catch-up on reconnect (see the flow above)
- Presence via 30-second TTL heartbeats — a user counts as online only as long as their client keeps refreshing the key
- Read receipts and typing indicators pushed over Socket.IO, fanned out across gateway instances by the Socket.IO Redis adapter
- Write-behind caching to Postgres, sorted-set hot cache for the last 50 messages per conversation
- WebSocket only, no long-polling fallback — with state living in Redis instead of in-process memory, there's no need for sticky sessions, so Nginx load-balances connections freely

**Posts & social**
- Code snippets with syntax highlighting (Prism), language auto-detection
- Nested/threaded comments, hashtag extraction and trending counts
- Follow system, personalized and trending feeds

**Images**
- Upload via Multer, processed with Sharp (resize, WebP conversion, strip metadata), stored in S3
- Falls back to local disk storage automatically if S3 isn't configured

---

## Design trade-offs

| Decision | Alternative | Why | Cost |
|---|---|---|---|
| Modular monolith (9 modules, one process, one Postgres DB) | Microservices | No inter-service network calls, no distributed transactions, one thing to deploy | Scales vertically only for now |
| Write-behind cache for chat messages | Write straight to Postgres | Sub-100ms delivery to online recipients without waiting on a DB round-trip | Up to ~250ms where a message exists only in Redis; a crash in that window before flush would lose it |
| Rate limiting via Redis Lua script | Per-instance in-memory counters | Atomic under concurrent requests to the same key, and the limit is shared correctly across all gateway instances | Redis becomes a dependency for rate limiting to work at all (it fails open if Redis is down, so it degrades to "no limiting" rather than blocking traffic) |
| Single Fly.io instance in production | Deploy the 3-gateway/Nginx cluster live | Cheaper and simpler to operate for a low-traffic portfolio app | The cross-instance routing this project is actually about isn't running in production — it's proven locally with Docker Compose + k6, not live |
| Polymorphic `Like` table | Separate `PostLike` / `CommentLike` tables | One set of like/unlike logic instead of two | Nullable FKs, relies on composite unique constraints to stay correct |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, TanStack Query |
| Backend | Node.js 20, Express, TypeScript, Zod |
| Database | PostgreSQL 15 via Prisma |
| Real-time | Socket.IO + Redis adapter, Redis Streams |
| Cache / bus | Redis 7 (Upstash in production, TLS) |
| Auth | Passport.js (JWT, GitHub/Google OAuth), Speakeasy (TOTP) |
| Images | Sharp, AWS S3 |
| Infra | Docker (multi-stage build), Nginx, Fly.io, AWS CloudFront |
| Testing | Jest, k6, ESLint, GitHub Actions |

---

## Testing & performance

**Unit tests:** 23 tests across auth, posts, feed, and the rate-limit middleware.

```bash
cd backend && npm test
```

**Load testing (k6):**

General API (auth, posts, feed — REST only, single instance):

| Metric | Value |
|---|---|
| Concurrent users | 1,000 |
| Total requests | 2,142,599 |
| Success rate | 99.88% |
| p95 latency | 7ms |

Real-time chat (WebSocket, 3-gateway cluster via Docker Compose):

| Metric | Value |
|---|---|
| Peak WebSocket connections | 2,015 |
| Successful connections | 1,996 |
| Message delivery p95 | 33ms |
| Message delivery avg | 17ms |

**Failover test** — killing one of the three gateways mid-run: the remaining two kept serving, 1,740 messages delivered with zero send failures. Delivery latency held at p95 29ms overall, but spiked to a worst case of 8.2 seconds for connections that were mid-reconnect to the killed instance at the moment it went down. That number is the one I'd want to improve next — it's the gap between "the system survives a gateway dying" and "no client notices."

```bash
cd backend && npm run test:load:ws         # concurrency test
cd backend && npm run test:load:failover   # gateway kill test
cd backend && npm run test:load:quick      # 30s smoke test
```

---

## What's next

- Get the failover reconnect latency down — right now a killed gateway causes a multi-second tail for clients that were mid-connection to it.
- Actually deploy the 3-gateway/Nginx setup to production instead of a single Fly.io instance, so the horizontal-scaling design is live, not just load-tested locally.
- Push the WebSocket concurrency test past 2,000 toward 5,000+ connections.
- End-to-end tests (Playwright) — there are unit tests for logic and load tests for throughput, but nothing that walks a full user flow (register → post → message someone).
- Full-text search — posts/users search is currently Prisma `contains` queries, no fuzzy matching or ranking.

---

## Project structure

```
backend/src/
├── server.ts                    # entry point, Socket.IO + HTTP server setup
├── modules/
│   ├── auth/                    # registration, login, OAuth, 2FA, password reset
│   ├── users/                   # profiles, follow/unfollow
│   ├── posts/                   # CRUD, code snippets, hashtags, likes
│   ├── feed/                    # personalized, trending, following
│   ├── chat/                    # messaging, hot cache, unread counts, stream consumer
│   ├── notifications/
│   ├── search/
│   ├── uploads/                 # image pipeline
│   └── metrics/
└── shared/
    ├── redis/                   # streams client, write-behind flusher, Lua token bucket
    ├── socket/                  # Socket.IO auth, presence, Redis adapter
    ├── middleware/               # auth, rate limiting, uploads
    └── database/                 # Prisma client, Redis client

frontend/src/
├── pages/                        # 14 route-level pages
├── components/                   # ui/, posts/, chat/, profile/, common/
├── api/, hooks/, store/          # Axios clients, React Query hooks, Zustand store

nginx/nginx.conf                  # load balancer config for the 3-gateway local cluster
docker-compose.yml                # postgres, redis, gateway1-3, nginx
```

---

## API overview

Everything's mounted under `/api`. Protected routes need a `Bearer` token.

| Module | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, refresh, OAuth, 2FA, password reset |
| Users | `/api/users` | profiles, avatars, follow/unfollow |
| Posts | `/api/posts` | CRUD, likes, comments |
| Feed | `/api/feed` | personalized, trending, following |
| Messages | `/api/messages` | conversations, send, mark read, delete |
| Search | `/api/search` | users, posts, hashtags |
| Notifications | `/api/notifications` | list, unread count, mark read |
| Uploads | `/api/uploads` | images (avatar, banner, post) |

62 routes total across 9 modules.

---

## Running it locally

**Requirements:** Node 20+, Docker.

```bash
git clone https://github.com/mmerlyn/dev-connect.git
cd dev-connect

cd backend && npm install && cd ../frontend && npm install && cd ..
cp backend/.env.example backend/.env   # fill in secrets, see below
```

**Option A — just the app**, single backend instance:

```bash
docker compose up postgres redis -d
cd backend && npx prisma migrate dev && npx prisma generate
npm run dev              # backend on :4000
cd ../frontend && npm run dev   # frontend on :5173
```

**Option B — the full 3-gateway cluster**, same setup the load tests run against:

```bash
docker compose up -d     # postgres, redis, gateway1-3, nginx — all of it
```

This puts the API behind Nginx on `:8080`, load-balanced across three backend containers.

### Environment variables

```env
# Required
DATABASE_URL=postgresql://devconnect:yourpassword@localhost:5432/devconnect
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:5173

# Redis — chat, caching, and rate limiting all degrade gracefully without it,
# but it's required for anything to feel "real-time"
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional — OAuth login buttons won't show without these
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Optional — falls back to local disk storage without these
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# Optional — verification emails won't send without this
SENDGRID_API_KEY=...
```

---

## License

[MIT](LICENSE)

Merlyn Mercylona · [GitHub](https://github.com/mmerlyn) · [LinkedIn](https://www.linkedin.com/in/merlynmercylona/)
