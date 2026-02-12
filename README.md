# DevConnect

A full-stack social platform built for developers to share code, discuss ideas, and discover content tailored to their interests. Think of it as a developer-focused social network where posts can include syntax-highlighted code snippets, and the feed learns what you care about over time.

I wanted to go beyond CRUD. Most portfolio projects stop at "user can create, read, update, delete". I wanted to tackle the harder problems: real-time communication over WebSockets, ML-driven content recommendations, OAuth flows, multi-layer caching, and getting everything deployed to production infrastructure.

**Highlights**: TensorFlow.js recommendation engine · Socket.IO real-time chat · JWT refresh rotation + GitHub/Google OAuth + TOTP 2FA · 7-tier rate limiting · 9 modular feature modules · 19 unit tests + CI/CD pipeline · k6 load tested (1,000 VUs, p95 < 7ms)

![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=node.js&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white) ![TensorFlow](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white) ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## Architecture

```
                                    ┌─────────────────────┐
                                    │   AWS CloudFront     │
                                    │   (CDN + HTTPS)      │
                                    └──────────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │     S3 Bucket        │
                                    │  React SPA (Vite)    │
                                    └──────────┬──────────┘
                                               │ API calls
                                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Fly.io (sjc region)                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    Express.js Server                           │  │
│  │                                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐  │  │
│  │  │   Auth   │  │  Posts   │  │    Feed    │  │    Chat    │  │  │
│  │  │  Module  │  │  Module  │  │   Module   │  │   Module   │  │  │
│  │  └──────────┘  └──────────┘  └──────┬─────┘  └─────┬──────┘  │  │
│  │  ┌──────────┐  ┌──────────┐         │               │         │  │
│  │  │  Users   │  │  Search  │  ┌──────▼─────┐  ┌─────▼──────┐  │  │
│  │  │  Module  │  │  Module  │  │     ML     │  │ Socket.IO  │  │  │
│  │  └──────────┘  └──────────┘  │ Recommend. │  │  Server    │  │  │
│  │  ┌──────────┐  ┌──────────┐  └──────┬─────┘  └─────┬──────┘  │  │
│  │  │ Notifs   │  │ Uploads  │         │               │         │  │
│  │  │  Module  │  │  Module  │         │               │         │  │
│  │  └──────────┘  └──────────┘         │               │         │  │
│  └─────────────┬───────────────────────┼───────────────┼─────────┘  │
│                │                       │               │            │
└────────────────┼───────────────────────┼───────────────┼────────────┘
                 │                       │               │
        ┌────────▼────────┐    ┌────────▼──────┐  ┌─────▼─────────┐
        │  PostgreSQL 15   │    │  Redis 7      │  │  AWS S3       │
        │  (Prisma ORM)    │    │  (Upstash)    │  │  (Uploads)    │
        │                  │    │               │  │               │
        │  8 models        │    │  Feed cache   │  │  Image store  │
        │  7 indexes       │    │  Sessions     │  │  Sharp resize │
        │  Cascade deletes │    │  Socket rooms │  │  WebP convert │
        └─────────────────┘    │  Bull queues  │  └───────────────┘
                                └───────────────┘
```

The backend is a modular monolith. 9 feature modules that are self-contained (own controller, service, routes, validation) but share one Express process and one PostgreSQL database. Redis and S3 are optional; the app degrades gracefully without them.

### System Design Patterns

| Pattern                    | Implementation                                                                            | Why It Matters                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Modular monolith**       | 9 feature modules with own controller/service/routes/validation                           | New features are isolated folders. ML module doesn't touch auth code.              |
| **Multi-layer caching**    | Redis caches feeds (10min TTL), recommendations per user, Socket.IO rooms                 | Avoids re-running ML inference on every scroll. Feed loads stay sub-2ms.           |
| **Graceful degradation**   | Redis, S3, and email are all optional. App works without them.                            | Local dev needs only PostgreSQL. Production survives Redis outages.                |
| **Real-time pub/sub**      | Socket.IO with Redis adapter for cross-instance communication                             | Scales horizontally. Multiple Fly.io instances share socket rooms.                 |
| **Token rotation**         | Short-lived access (15min) + long-lived refresh (7d) tokens                               | Leaked access tokens expire fast. Refresh tokens enable DB-backed revocation.      |
| **ML pipeline**            | Bull queue triggers TensorFlow.js retraining every 6 hours via cron                       | Model improves over time without blocking request handling.                        |
| **Rate limiting (7-tier)** | Different thresholds per route category: auth (10/15min), posts (10/min), search (30/min) | Each endpoint's limit is tuned to its abuse profile. Auth limiter skips successes. |

### How a Request Flows Through the System

Taking "user opens their recommended feed" as an example, since it touches the most layers:

```
1. Client GET /api/v1/feed/recommended
2. Express rate limiter checks request count for this route category
3. Auth middleware validates JWT, attaches user to request
4. Feed controller delegates to Recommendation Service
5. Recommendation Service checks Redis cache for this user's page
6. Cache miss → checks if user has 10+ interactions (ML vs. heuristic path)
7. ML path: TensorFlow model scores candidate posts (393-dim input vector)
8. Diversity filter limits 2 posts per author, injects 10% exploration posts
9. Results cached in Redis (10min TTL), returned to client
```

This is where the heuristic/ML split pays off. New users get instant recommendations from the scorer (step 6 short-circuits to engagement + skill overlap math), while established users get personalized neural network predictions without the cold-start problem.

### Data Model

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │    Post      │       │   Comment    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (uuid)    │──┐    │ id (uuid)    │──┐    │ id (uuid)    │
│ email        │  │    │ content      │  │    │ content      │
│ username     │  │    │ codeSnippet  │  │    │ postId ──────│───▶ Post
│ password?    │  │    │ language     │  │    │ authorId ────│───▶ User
│ displayName  │  │    │ images[]     │  │    │ parentId? ───│───▶ Comment (self)
│ skills[]     │  │    │ hashtags[]   │  │    │ likes[]      │
│ githubId?    │  │    │ views        │  │    └──────────────┘
│ googleId?    │  │    │ authorId ────│───▶ User
│ 2fa fields   │  │    │ likes[]      │       ┌──────────────┐
│ email verify │  │    │ comments[]   │       │    Like      │
└──────────────┘  │    └──────────────┘       ├──────────────┤
       │          │                           │ userId ──────│───▶ User
       │          │    ┌──────────────┐       │ postId? ─────│───▶ Post
       │          │    │   Follow     │       │ commentId? ──│───▶ Comment
       │          │    ├──────────────┤       └──────────────┘
       │          └───▶│ followerId   │       (polymorphic)
       │               │ followingId  │
       │               └──────────────┘       ┌──────────────┐
       │               (self-referential)     │ Notification │
       │                                      ├──────────────┤
       │          ┌──────────────┐            │ type (enum)  │
       │          │   Message    │            │ recipientId ─│───▶ User
       │          ├──────────────┤            │ senderId? ───│───▶ User
       └─────────▶│ senderId     │            │ postId?      │
                  │ recipientId  │            │ commentId?   │
                  │ content      │            └──────────────┘
                  │ read         │
                  └──────────────┘            ┌──────────────┐
                                              │   Hashtag    │
                                              ├──────────────┤
                                              │ name (unique)│
                                              │ count        │
                                              └──────────────┘
```

8 models, 7 database indexes on foreign keys and frequently queried columns. Cascade deletes on all relations so removing a user cleanly removes their posts, comments, likes, messages, and notifications. Polymorphic likes (one table for both post and comment likes) avoid duplicating like/unlike logic.

**Deployment:** Backend runs on Fly.io via multi-stage Dockerfile with automatic Prisma migrations on deploy. Frontend deploys to S3 + CloudFront with content-hashed assets (1yr cache) and no-cache `index.html`.

---

## Features

### Authentication & Security

- **JWT with refresh token rotation:** 15-min access tokens, 7-day refresh tokens. The short-lived access token limits the damage window if a token leaks, while the refresh token keeps the UX smooth.
- **GitHub & Google OAuth:** Passport.js strategies with automatic account linking when email matches an existing account. Handles username collisions from OAuth providers.
- **TOTP Two-Factor Auth:** QR code generation with Speakeasy. Users scan with any authenticator app (Google Authenticator, Authy, etc).
- **7-tier rate limiting:** Each route category has limits tuned to its abuse profile: general API (100/15min), auth (10/15min), password reset (5/hr), post creation (10/min), messaging (30/min), follow actions (20/min), search (30/min). Auth limiter skips successful requests so legitimate users aren't penalized.
- **Helmet.js + CORS:** Security headers and origin whitelisting in production.

### Content & Social

- **Posts with code snippets:** Markdown content with optional syntax-highlighted code blocks. Language detection for proper highlighting via Prism.
- **Nested comment threads:** Self-referential Comment model with `parentId` for threaded replies. Recursive fetching with depth control.
- **Polymorphic likes:** Single Like model handles both post and comment likes using optional foreign keys with composite unique constraints (`userId_postId`, `userId_commentId`).
- **Hashtag tracking:** Extracted on post creation, stored both inline (on the post) and in a dedicated Hashtag table with counts for trending calculation.
- **Follow system:** Self-referential many-to-many on User via a Follow junction table. Powers the "following" feed variant.

### ML Recommendation Engine

This was the most interesting part to build. The recommendation system has two modes:

**For new users (< 10 interactions):** A heuristic scorer that weights engagement (likes x0.3, comments x0.5), skill overlap between the user and post author (x2 per matching skill), and recency (decaying bonus over 7 days). Good enough to surface relevant content immediately.

**For established users (10+ interactions):** A TensorFlow.js neural network that takes a 393-dimensional input vector (196-dim user vector + 197-dim post vector) through a `128 → 64 → 32 → 1` dense network with dropout regularization. The training pipeline:

1. Builds vocabulary maps for skills (64-dim) and hashtags (128-dim) across all users/posts
2. Generates feature vectors — user vectors encode TF-IDF weighted hashtag interests + skill profile + engagement metrics, post vectors encode hashtag presence + author skills + normalized engagement/recency signals. All vectors are L2-normalized before inference
3. Trains a binary classifier (liked vs. not liked) with 1:3 negative sampling
4. Runs on a Bull job queue every 6 hours via cron

On top of the base recommendations, the system applies:

- **Diversity filtering:** Max 2 posts per author to prevent any single prolific poster from dominating the feed
- **Exploration injection:** 10% of feed slots go to random recent posts the model wouldn't have surfaced, preventing filter bubbles
- **10-minute Redis caching:** Recommendations are cached per user per page to avoid re-running inference on every scroll

### Real-Time (Socket.IO)

- **Live chat:** Direct messaging with read receipts, delivered over WebSocket with long-polling fallback.
- **Push notifications:** Likes, comments, follows, and mentions trigger instant notifications without polling.
- **Presence tracking:** Redis-backed online/offline status. Handles multiple tabs per user (up to 5 concurrent connections) with proper cleanup on disconnect.
- **Redis adapter:** Socket.IO rooms are backed by Redis so the WebSocket layer scales horizontally across multiple Fly.io instances.
- **Connection hygiene:** JWT auth on socket handshake, per-user connection limits, 50 events/sec rate limit, compression for messages over 1KB.

### Image Pipeline

- Upload via Multer to memory buffer
- Sharp processes the image: resize, convert to WebP, strip metadata
- Stored in S3 (production) or local filesystem (development)
- Graceful fallback — if S3 isn't configured, falls back to disk storage automatically

---

## Design Trade-offs

Every architecture decision has a cost. These are the ones I thought about the most:

| Decision                       | Alternative Considered                 | Why I Went This Way                                                                                                                             | The Trade-off                                                                                                  |
| ------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Modular monolith               | Microservices                          | All 9 modules share one process — no inter-service latency, no distributed transactions, simpler deployment.                                    | Scales vertically only. Would need to extract services if any single module becomes a bottleneck.              |
| TensorFlow.js in-process       | Python ML microservice                 | Same runtime eliminates IPC, separate deployment, and a second language. TF.js Node uses native C++ bindings, so inference speed is comparable. | Larger Docker image (~800MB). Training runs on the same instance that serves requests.                         |
| Redis optional                 | Redis required                         | App degrades gracefully — feed caching becomes a no-op, Socket.IO falls back to in-memory adapter, Bull queues skip ML training.                | No caching or horizontal WebSocket scaling in local dev. Acceptable since dev is single-instance anyway.       |
| Separate access/refresh tokens | Single long-lived token                | Short-lived access tokens (15min) limit the damage window of a leak. Refresh tokens (7d) keep UX smooth.                                        | More complex auth flow. Refresh token only hits one endpoint, making it easier to monitor for abuse.           |
| Polymorphic likes              | Separate PostLike + CommentLike tables | One Like table with optional `postId`/`commentId` FKs. Avoids duplicating like/unlike logic across two tables.                                  | Nullable foreign keys. Composite unique constraints (`userId_postId`, `userId_commentId`) enforce correctness. |
| In-memory rate limiting        | Redis-backed rate limiting             | Zero infrastructure dependency. Each route category has limits tuned to its abuse profile.                                                      | Resets on server restart. A Redis outage doesn't break rate limiting (since Redis is optional).                |

---

## Tech Stack

| Layer         | Technology                                        | Why                                                          |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| **Frontend**  | React 19, TypeScript, Vite, Tailwind CSS 4        | Fast HMR, utility-first styling, type safety                 |
| **State**     | Zustand, TanStack React Query, Socket.IO Client   | Lightweight store, server state caching, real-time transport |
| **Backend**   | Node.js 20, Express, TypeScript, Zod              | Mature ecosystem, schema validation at boundaries            |
| **ORM**       | Prisma                                            | Type-safe queries, migrations, schema-as-code                |
| **Auth**      | Passport.js, JWT (access + refresh), Speakeasy    | OAuth strategies, stateless auth, TOTP 2FA                   |
| **Database**  | PostgreSQL 15                                     | ACID compliance, JSON columns for flexible fields            |
| **Cache**     | Redis 7 (Upstash with TLS)                        | Feed caching, Socket.IO adapter, Bull job queue              |
| **ML**        | TensorFlow.js (Node)                              | In-process neural network, no Python dependency              |
| **Real-Time** | Socket.IO + Redis adapter                         | WebSocket with long-polling fallback, horizontal scaling     |
| **Images**    | Sharp, AWS S3                                     | WebP conversion, metadata stripping, CDN storage             |
| **Infra**     | Docker (multi-stage), Fly.io, AWS CloudFront      | Containerized deploy, edge CDN for static assets             |
| **Testing**   | Jest (ts-jest ESM), k6, ESLint, GitHub Actions CI | Unit tests, load tests, linting, automated pipeline          |

---

## Testing & Performance

### Unit Tests

19 tests across 4 service modules using Jest with ts-jest ESM preset:

- **Auth:** registration with hashing, duplicate detection, login flows, 2FA gating
- **Posts:** hashtag extraction, deduplication, like notifications, self-like suppression
- **Feed:** personalized feed assembly, cache hits, following feed, trending sort
- **Recommendations:** heuristic fallback, ML path routing, status reporting

```bash
cd backend && npm test             # run all tests
cd backend && npm run test:cov     # with coverage report
```

### Load Testing (k6)

k6 load tests simulate up to 1,000 concurrent virtual users with ramping stages:

```
Stage 1: 0 → 250 VUs over 30s
Stage 2: 250 → 500 VUs over 30s
Stage 3: 500 → 1,000 VUs over 30s
Stage 4: Hold 1,000 VUs for 60s
Stage 5: 1,000 → 0 VUs over 30s
```

**Results (1,000 concurrent users):**

| Metric          | Value     |
| --------------- | --------- |
| Total requests  | 2,142,599 |
| Success rate    | 99.88%    |
| Avg latency     | 1.83ms    |
| p50 latency     | 1.00ms    |
| p95 latency     | 7.00ms    |
| Peak concurrent | 1,000 VUs |

```bash
cd backend && npm run test:load        # full suite
cd backend && npm run test:load:quick   # 30-sec smoke test (100 VUs)
```

### CI/CD Pipeline

GitHub Actions runs on every push and PR to `main`:

- **Backend:** `npm ci` → `prisma generate` → `tsc --noEmit` → `eslint` → `jest`
- **Frontend:** `npm ci` → `eslint` → `vite build`

---

## How I'd Scale This Further

Things I'd tackle to take this from "works well" to "production-grade at scale":

**Testing**

- **End-to-end tests (Playwright)** to cover full user flows — registration through posting through receiving recommendations. Currently have unit tests for business logic and load tests for throughput, but nothing validating the complete user journey.

**Performance**

- **Offload ML training** to a dedicated worker or Lambda function triggered by the Bull queue. Right now the TensorFlow training job runs on the same instance that serves requests. With more users, this would compete for CPU during the 6-hour retraining cycle.
- **Full-text search (Elasticsearch or tsvector)** to replace basic Prisma `contains` queries. Would enable fuzzy matching, typo tolerance, and relevance scoring for posts and users.

**Reliability**

- **Offline message delivery queue** so chat messages reach users who were offline when the message was sent. Currently messages are persisted to PostgreSQL, but there's no push notification outside the app.
- **Redis-backed rate limiting** for persistence across server restarts. In-memory rate limiting resets on deploy, which briefly opens a window for abuse.

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts                    # Entry point, middleware setup, route mounting
│   ├── config/                      # Environment config, constants
│   ├── modules/
│   │   ├── auth/                    # Registration, login, OAuth, 2FA, password reset
│   │   ├── users/                   # Profiles, discovery, follow/unfollow
│   │   ├── posts/                   # CRUD, code snippets, hashtags, likes
│   │   ├── feed/                    # Personalized, trending, following, recommended
│   │   ├── chat/                    # Direct messaging
│   │   ├── notifications/           # Activity notifications
│   │   ├── search/                  # Users, posts, hashtags
│   │   ├── uploads/                 # Image processing pipeline
│   │   ├── metrics/                 # System health monitoring
│   │   └── recommendation/          # ML engine (training, features, model, vocab)
│   ├── shared/
│   │   ├── middleware/              # Auth, errors, rate limiting, file uploads
│   │   ├── database/               # Prisma client, Redis wrapper
│   │   ├── services/               # Email, file storage
│   │   ├── socket/                  # Socket.IO setup, auth, presence, metrics
│   │   └── utils/                   # JWT helpers, password hashing, response format
│   └── types/                       # Shared TypeScript interfaces
├── prisma/                          # Schema, migrations, seed
├── tests/load/                      # k6 performance tests
├── Dockerfile                       # Multi-stage production build
└── fly.toml                         # Fly.io deployment config

frontend/
├── src/
│   ├── pages/                       # 13 route-level page components
│   ├── components/
│   │   ├── ui/                      # Design system (Button, Card, Input, etc.)
│   │   ├── posts/                   # Post creation, display, interactions
│   │   ├── chat/                    # Chat interface
│   │   ├── profile/                 # User profile components
│   │   └── common/                  # Layout, navigation
│   ├── api/                         # Axios client + per-feature API modules
│   ├── store/                       # Zustand auth store with persistence
│   ├── hooks/                       # React Query hooks (feed, posts, chat, etc.)
│   └── types/                       # TypeScript interfaces
└── .storybook/                      # Component documentation
```

---

## API Overview

All endpoints are prefixed with `/api/v1`. Protected routes require a `Bearer` token in the `Authorization` header.

| Module            | Endpoints                                                                                                      | Description                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Auth**          | `POST /auth/register`, `login`, `refresh`, `logout`, `2fa/*`, `forgot-password`, `reset-password`, OAuth flows | JWT auth with refresh rotation, GitHub/Google OAuth, TOTP 2FA |
| **Users**         | `GET /users`, `GET /users/:id`, `PATCH /users/profile`, `POST /users/avatar`, follow/unfollow                  | Profiles, avatars, banners, follow system                     |
| **Posts**         | `GET/POST /posts`, `PATCH/DELETE /posts/:id`, likes, comments, replies                                         | CRUD, code snippets, hashtags, threaded comments              |
| **Feed**          | `GET /feed`, `/trending`, `/following`, `/recommended`, `/recommended/status`                                  | Personalized, trending, following, ML-powered feeds           |
| **Chat**          | `GET /chat/conversations`, `GET /chat/:userId`, `POST /chat`, read receipts                                    | Direct messaging with Socket.IO real-time delivery            |
| **Search**        | `GET /search`, `/users`, `/posts`, `/hashtags`, `/hashtag/:tag`                                                | Universal and filtered search across content                  |
| **Notifications** | `GET /notifications`, unread count, mark read, mark all read                                                   | Activity notifications for likes, comments, follows           |
| **Uploads**       | `POST /uploads/images`, `POST /uploads/image`                                                                  | Image upload with Sharp processing + S3 storage               |

**74 total endpoints** across 9 modules. Rate limiting varies by route category.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+ (optional — app works without it)
- Docker & Docker Compose (for local infra)

### Quick Start

```bash
# Clone the repo
git clone https://github.com/mmerlyn/dev-connect.git
cd dev-connect

# Install dependencies for both frontend and backend
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start local infrastructure (PostgreSQL + Redis)
docker compose up -d

# Set up environment
cp backend/.env.example backend/.env
# Fill in your secrets (see Environment Variables below)

# Run database migrations
cd backend
npx prisma migrate dev
npx prisma generate
npm run prisma:seed        # (Optional) Seed sample data

# Start the app
cd backend && npm run dev   # Terminal 1 — Backend (port 4000)
cd frontend && npm run dev  # Terminal 2 — Frontend (port 5173)

# (Optional) Run Storybook — component library at localhost:6006
cd frontend && npm run storybook
```

### Environment Variables

<details>
<summary>Click to expand full list</summary>

```env
# Required
DATABASE_URL=postgresql://devconnect:yourpassword@localhost:5432/devconnect
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:5173

# OAuth - login buttons won't appear without these
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Redis - caching and real-time scaling disabled without this
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 - falls back to local file storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# Email - verification emails won't send
SENDGRID_API_KEY=...
```

</details>

---

## License

[MIT](LICENSE)

---

Built by **Merlyn Mercy Lona** · [LinkedIn](https://www.linkedin.com/in/merlynmercylona/) · [GitHub](https://github.com/mmerlyn)
