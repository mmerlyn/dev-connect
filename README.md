# DevConnect

A full-stack social networking platform for developers to connect, share code, and build professional relationships.

## Features

- **Authentication** - JWT-based auth with refresh tokens
- **User Profiles** - Bio, skills, social links, follow/unfollow
- **Posts** - Share text, code snippets with syntax highlighting, hashtags
- **Comments** - Nested replies with likes
- **Direct Messaging** - Real-time chat between users
- **Notifications** - Likes, comments, follows, mentions
- **Feed** - Personalized, trending, and following-only feeds
- **Search** - Find users, posts, and hashtags

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS |
| **State** | Zustand, TanStack React Query |
| **Backend** | Express.js, TypeScript, Socket.IO |
| **Database** | PostgreSQL, Prisma ORM |
| **Cache** | Redis |
| **Auth** | JWT, Passport.js |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Start Infrastructure

```bash
# From project root
cd backend
docker-compose up -d   # Starts PostgreSQL & Redis
```

### 3. Setup Database

```bash
cd backend
cp .env.example .env   # Configure environment variables
npx prisma migrate dev # Run migrations
npm run prisma:seed    # Seed sample data
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend && npm run dev
```

## Project Structure

```
dev-connect/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── users/        # User management
│   │   │   ├── posts/        # Posts & comments
│   │   │   ├── feed/         # News feed
│   │   │   ├── chat/         # Direct messaging
│   │   │   ├── notifications/# Notifications
│   │   │   └── search/       # Search
│   │   ├── shared/           # Shared utilities
│   │   └── server.ts         # Entry point
│   └── prisma/               # Database schema
│
├── frontend/
│   └── src/
│       ├── api/              # API clients
│       ├── components/       # React components
│       │   ├── common/       # Reusable UI
│       │   ├── layout/       # Layout components
│       │   ├── posts/        # Post components
│       │   └── chat/         # Chat components
│       ├── hooks/            # Custom hooks
│       ├── pages/            # Page components
│       ├── store/            # Zustand store
│       ├── constants/        # Routes & API endpoints
│       ├── utils/            # Utility functions
│       └── types/            # TypeScript types
│
└── docker-compose.yml        # PostgreSQL & Redis
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/users/:id` | Get profile |
| PATCH | `/api/users/profile` | Update profile |
| POST | `/api/users/:id/follow` | Follow user |
| DELETE | `/api/users/:id/follow` | Unfollow user |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List posts |
| POST | `/api/posts` | Create post |
| POST | `/api/posts/:id/like` | Like post |
| POST | `/api/posts/:id/comments` | Add comment |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/:userId` | Get messages |
| POST | `/api/messages` | Send message |

### Feed & Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feed` | Personalized feed |
| GET | `/api/feed/trending` | Trending posts |
| GET | `/api/search?q=` | Search all |

## Scripts

### Backend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run prisma:studio # Open Prisma Studio
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/devconnect
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=4000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
```

## License

MIT
