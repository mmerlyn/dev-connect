# DevConnect Backend

Backend API for DevConnect - A social platform for developers.

## Features

- ✅ JWT Authentication with refresh tokens
- ✅ User profiles with follow/unfollow
- ✅ Posts with likes and nested comments
- ✅ Personalized feed algorithm
- ✅ Real-time chat with Socket.io
- ✅ Real-time notifications
- ✅ Advanced search (users, posts, hashtags)
- ✅ Redis caching
- ✅ PostgreSQL database with Prisma ORM
- ✅ TypeScript + Express
- ✅ Modular monolith architecture

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d
```

### 3. Setup Database

```bash
# Run migrations
npx prisma migrate dev

# Seed database with sample data
npm run prisma:seed
```

### 4. Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/profile` - Update own profile
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post
- `GET /api/posts/:id/likes` - Get post likes
- `GET /api/posts/:id/comments` - Get comments
- `POST /api/posts/:id/comments` - Add comment

### Comments
- `PATCH /api/posts/comments/:id` - Update comment
- `DELETE /api/posts/comments/:id` - Delete comment
- `POST /api/posts/comments/:id/reply` - Reply to comment
- `POST /api/posts/comments/:id/like` - Like comment
- `GET /api/posts/comments/:id/replies` - Get replies

### Feed
- `GET /api/feed` - Get personalized feed
- `GET /api/feed/trending` - Get trending posts
- `GET /api/feed/following` - Get posts from following

### Chat/Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark as read
- `DELETE /api/messages/:id` - Delete message

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Search
- `GET /api/search?q=query` - Universal search
- `GET /api/search/users?q=query` - Search users
- `GET /api/search/posts?q=query` - Search posts
- `GET /api/search/hashtags?q=query` - Search hashtags
- `GET /api/search/hashtag/:tag` - Get posts by hashtag

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/              # Authentication
│   │   ├── users/             # User management
│   │   ├── posts/             # Posts & comments
│   │   ├── feed/              # News feed
│   │   ├── chat/              # Direct messaging
│   │   ├── notifications/     # Notifications
│   │   └── search/            # Search functionality
│   ├── shared/
│   │   ├── database/          # Prisma client & Redis
│   │   ├── middleware/        # Auth, error handling
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript types
│   ├── config/                # Configuration
│   └── server.ts              # Entry point
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
└── package.json
```

## Scripts

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm start              # Start production server
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio
npm run prisma:seed     # Seed database
npm test               # Run tests
```

## Tech Stack

- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis
- **Real-time:** Socket.io
- **Authentication:** JWT + Passport.js
- **Validation:** Zod
- **Security:** Helmet, CORS, Rate Limiting
