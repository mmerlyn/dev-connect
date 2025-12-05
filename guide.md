# 👥 DevConnect - Social Platform for Developers

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

**A modern social networking platform built for developers, by developers**

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation)

</div>

---

## 📋 Overview

DevConnect is a feature-rich social media platform designed specifically for developers to connect, share knowledge, showcase projects, and collaborate. Built with a **modular monolith architecture** using TypeScript, it demonstrates real-time communication, scalable design patterns, and production-ready best practices.

### Key Highlights

- 💬 **Real-Time Chat** with Socket.io for instant messaging
- 🔔 **Live Notifications** for interactions and updates
- 📝 **Code-Friendly Posts** with syntax highlighting and markdown support
- 🔗 **Developer Networking** with follow/unfollow system
- 🎯 **Smart Feed Algorithm** based on relevance and engagement
- 🔐 **OAuth Integration** with GitHub, Google, LinkedIn
- 🎨 **Modern UI/UX** with responsive design
- ⚡ **High Performance** with Redis caching and optimized queries

---

## ✨ Features

### Core Social Features

- ✅ User profiles with skills, tech stack, and bio
- ✅ Create posts with text, code snippets, and images
- ✅ Markdown support for rich text formatting
- ✅ Syntax highlighting for 100+ programming languages
- ✅ Like, comment, and share posts
- ✅ Nested comments/replies (threaded discussions)
- ✅ Follow/unfollow developers
- ✅ Personalized news feed
- ✅ Trending posts and developers
- ✅ Hashtag system for topics

### Real-Time Features

- ✅ Direct messaging (1-on-1 chat)
- ✅ Group chat rooms
- ✅ Online/offline status indicators
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Real-time notifications
- ✅ Live post reactions

### Advanced Features

- ✅ Advanced search (users, posts, hashtags)
- ✅ GitHub integration (import projects, show contributions)
- ✅ Portfolio showcase section
- ✅ Job postings board (coming soon)
- ✅ Code collaboration rooms (coming soon)
- ✅ Tech event calendar (coming soon)

### Authentication & Security

- ✅ Email/password authentication with JWT
- ✅ OAuth 2.0 (GitHub, Google, LinkedIn)
- ✅ Two-factor authentication (2FA)
- ✅ Rate limiting and API throttling
- ✅ CSRF protection
- ✅ XSS prevention

---

## 🏛️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (SPA)                      │
│          React + TypeScript + Vite                   │
│                  (Port 5173)                         │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP/WebSocket
                    ▼
┌─────────────────────────────────────────────────────┐
│              Backend (Modular Monolith)              │
│           Express + TypeScript + Socket.io           │
│                  (Port 4000)                         │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Auth   │  │  Posts   │  │   Chat   │          │
│  │  Module  │  │  Module  │  │  Module  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Users   │  │  Feed    │  │Notifications        │
│  │  Module  │  │  Module  │  │  Module  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │  │   S3     │
│   (DB)   │  │ (Cache)  │  │ (Images) │
└──────────┘  └──────────┘  └──────────┘
```

### Why Modular Monolith?

DevConnect uses a **modular monolith** architecture instead of microservices because:

1. **Highly Interconnected Features** - Social features (feed, posts, users, notifications) need frequent communication
2. **Simplified Development** - Single codebase, easier debugging, faster iteration
3. **Better Performance** - No network latency between modules
4. **Easier Deployment** - Single deployment unit, simpler CI/CD
5. **Future Flexibility** - Modules can be extracted into microservices later if needed

### Module Structure

```
src/
├── modules/
│   ├── auth/              # Authentication & authorization
│   ├── users/             # User profiles & management
│   ├── posts/             # Post creation, likes, comments
│   ├── feed/              # News feed algorithm
│   ├── chat/              # Real-time messaging
│   ├── notifications/     # Real-time notifications
│   └── search/            # Search functionality
├── shared/
│   ├── database/          # Prisma client & migrations
│   ├── middleware/        # Auth, logging, error handling
│   ├── utils/             # Helper functions
│   └── types/             # Shared TypeScript types
├── config/                # Configuration management
└── server.ts              # Application entry point
```

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** React 18 + TypeScript 5.x
- **Build Tool:** Vite (faster than CRA/Next.js for SPA)
- **Styling:** TailwindCSS + Material-UI (or Ant Design)
- **State Management:**
  - Zustand (global state)
  - React Query / TanStack Query (server state)
- **Forms:** React Hook Form + Zod validation
- **Real-Time:** Socket.io Client
- **Code Editor:** Monaco Editor (VS Code editor in browser)
- **Markdown:** react-markdown + remark-gfm
- **Syntax Highlighting:** Prism.js or highlight.js
- **HTTP Client:** Axios with interceptors
- **Routing:** React Router v6

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js (or Fastify for performance)
- **Language:** TypeScript 5.x
- **Real-Time:** Socket.io (WebSocket server)
- **Authentication:** Passport.js (Local, JWT, OAuth strategies)
- **Validation:** Zod
- **Job Queue:** Bull / BullMQ (background jobs)
- **File Upload:** Multer + Sharp (image processing)

### Database & Caching

- **Primary Database:** PostgreSQL 15
  - Users, posts, comments, messages
  - Full-text search with `tsvector`
- **ORM:** Prisma 5.x
  - Type-safe queries
  - Auto-generated migrations
- **Cache:** Redis 7.x
  - Session storage
  - Feed caching
  - Rate limiting
  - Pub/Sub for real-time features
  - Bull queue storage

### File Storage

- **Development:** Local file system
- **Production:** AWS S3 / CloudFlare R2
  - User avatars
  - Post images
  - Profile banners

### DevOps & Infrastructure

- **Containerization:** Docker + Docker Compose
- **Cloud Platform:** Railway / Render (simpler) or AWS Elastic Beanstalk
- **CDN:** CloudFlare (for static assets)
- **CI/CD:** GitHub Actions
- **Error Tracking:** Sentry
- **Analytics:** LogRocket / Mixpanel
- **Email Service:** SendGrid / AWS SES

### Testing

- **Unit Tests:** Jest + ts-jest
- **Integration Tests:** Supertest
- **E2E Tests:** Playwright (optional)
- **Load Testing:** Artillery / k6

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- PostgreSQL 15
- Redis 7
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/dev-connect.git
   cd dev-connect
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   **Backend (.env)**

   ```bash
   # Server
   NODE_ENV=development
   PORT=4000
   FRONTEND_URL=http://localhost:5173

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/devconnect

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # OAuth - GitHub
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback

   # OAuth - Google
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # File Upload
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_S3_BUCKET=devconnect-uploads
   AWS_REGION=us-east-1

   # Email
   SENDGRID_API_KEY=your-sendgrid-key
   FROM_EMAIL=noreply@devconnect.com

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   **Frontend (.env)**

   ```bash
   VITE_API_URL=http://localhost:4000
   VITE_SOCKET_URL=http://localhost:4000
   VITE_GITHUB_CLIENT_ID=your-github-client-id
   ```

4. **Start infrastructure services**

   ```bash
   # Using Docker Compose
   docker-compose up -d postgres redis
   ```

5. **Run database migrations**

   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed  # Optional: seed with sample data
   ```

6. **Start the development servers**

   **Terminal 1 - Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Docs: http://localhost:4000/api-docs

---

## 📚 API Documentation

### Authentication

**Public Endpoints:**

```
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Login with email/password
POST   /api/auth/refresh            # Refresh access token
GET    /api/auth/github             # OAuth - GitHub login
GET    /api/auth/google             # OAuth - Google login
```

**Protected Endpoints** (require JWT token):

```
GET    /api/auth/me                 # Get current user
POST   /api/auth/logout             # Logout user
POST   /api/auth/change-password    # Change password
```

### User Management

```
GET    /api/users                   # Get all users (with pagination)
GET    /api/users/:id               # Get user profile
PATCH  /api/users/profile           # Update own profile
POST   /api/users/:id/follow        # Follow user
DELETE /api/users/:id/follow        # Unfollow user
GET    /api/users/:id/followers     # Get user's followers
GET    /api/users/:id/following     # Get users being followed
GET    /api/users/search            # Search users
```

### Posts

```
GET    /api/posts                   # Get all posts (paginated feed)
GET    /api/posts/:id               # Get single post
POST   /api/posts                   # Create new post
PATCH  /api/posts/:id               # Update post (author only)
DELETE /api/posts/:id               # Delete post (author only)
POST   /api/posts/:id/like          # Like post
DELETE /api/posts/:id/like          # Unlike post
GET    /api/posts/:id/likes         # Get post likes
```

### Comments

```
GET    /api/posts/:id/comments      # Get post comments
POST   /api/posts/:id/comments      # Add comment
PATCH  /api/comments/:id            # Update comment
DELETE /api/comments/:id            # Delete comment
POST   /api/comments/:id/reply      # Reply to comment
POST   /api/comments/:id/like       # Like comment
```

### Feed

```
GET    /api/feed                    # Get personalized feed
GET    /api/feed/trending           # Get trending posts
GET    /api/feed/following          # Get posts from followed users
```

### Chat/Messaging

```
GET    /api/messages/conversations  # Get user's conversations
GET    /api/messages/:userId        # Get messages with specific user
POST   /api/messages                # Send message
PATCH  /api/messages/:id/read       # Mark message as read
DELETE /api/messages/:id            # Delete message
```

### Notifications

```
GET    /api/notifications           # Get user notifications
PATCH  /api/notifications/:id/read  # Mark as read
PATCH  /api/notifications/read-all  # Mark all as read
DELETE /api/notifications/:id       # Delete notification
```

### Search

```
GET    /api/search                  # Universal search
GET    /api/search/users            # Search users
GET    /api/search/posts            # Search posts
GET    /api/search/hashtags         # Search hashtags
```

---

## 🔌 WebSocket Events

### Client → Server

```javascript
// Connection
socket.emit("authenticate", { token: "jwt-token" });

// Chat
socket.emit("chat:send", { recipientId, message });
socket.emit("chat:typing", { recipientId, isTyping: true });

// Presence
socket.emit("status:online");
socket.emit("status:offline");

// Notifications
socket.emit("notification:read", { notificationId });
```

### Server → Client

```javascript
// Chat
socket.on("chat:message", (message) => {
  /* New message */
});
socket.on("chat:typing", ({ userId, isTyping }) => {
  /* Show typing */
});
socket.on("chat:read", ({ messageId }) => {
  /* Message read */
});

// Notifications
socket.on("notification:new", (notification) => {
  /* New notification */
});

// Presence
socket.on("user:online", ({ userId }) => {
  /* User came online */
});
socket.on("user:offline", ({ userId }) => {
  /* User went offline */
});

// Posts
socket.on("post:liked", ({ postId, userId }) => {
  /* Post liked */
});
socket.on("post:commented", ({ postId, comment }) => {
  /* New comment */
});
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests

# Frontend tests
cd frontend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

---

## 🐳 Docker Deployment

### Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Build

```bash
# Build images
docker build -t devconnect-backend ./backend
docker build -t devconnect-frontend ./frontend

# Run containers
docker run -d -p 4000:4000 devconnect-backend
docker run -d -p 80:80 devconnect-frontend
```

---

## ☁️ Cloud Deployment

### Deploy to Railway

1. **Install Railway CLI**

   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

### Deploy to Render

1. Create `render.yaml` in project root
2. Connect GitHub repository to Render
3. Auto-deploy on push to main branch

### Deploy to AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js devconnect

# Create environment and deploy
eb create devconnect-prod
eb deploy
```

---

## 📊 Database Schema

### Key Entities

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  password      String?   // Null for OAuth users
  displayName   String
  bio           String?
  avatar        String?
  skills        String[]  // ["TypeScript", "React"]
  githubUrl     String?
  linkedinUrl   String?
  websiteUrl    String?
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  followers     Follow[]  @relation("Following")
  following     Follow[]  @relation("Followers")
  createdAt     DateTime  @default(now())
}

model Post {
  id            String    @id @default(uuid())
  content       String
  codeSnippet   String?
  language      String?   // For syntax highlighting
  images        String[]
  authorId      String
  author        User      @relation(fields: [authorId])
  likes         Like[]
  comments      Comment[]
  hashtags      String[]
  views         Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Comment {
  id            String    @id @default(uuid())
  content       String
  postId        String
  post          Post      @relation(fields: [postId])
  authorId      String
  author        User      @relation(fields: [authorId])
  parentId      String?   // For nested comments
  parent        Comment?  @relation("Replies")
  replies       Comment[] @relation("Replies")
  likes         Like[]
  createdAt     DateTime  @default(now())
}

model Message {
  id            String    @id @default(uuid())
  content       String
  senderId      String
  recipientId   String
  read          Boolean   @default(false)
  createdAt     DateTime  @default(now())
}
```

---

## 🎯 Performance Optimizations

### Caching Strategy

```typescript
// Feed caching (5 minutes)
const feedKey = `feed:user:${userId}`;
const cachedFeed = await redis.get(feedKey);
if (cachedFeed) return JSON.parse(cachedFeed);

const feed = await generateFeed(userId);
await redis.setex(feedKey, 300, JSON.stringify(feed));
```

### Database Indexing

```sql
-- Frequently queried fields
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_users_username ON users(username);

-- Full-text search
CREATE INDEX idx_posts_content ON posts USING gin(to_tsvector('english', content));
```

### Query Optimization

- Use pagination for all list endpoints (limit: 20)
- Implement cursor-based pagination for infinite scroll
- Use `select` to fetch only required fields
- Batch database queries with `Promise.all()`

---

## 🗺️ Roadmap

### Phase 1: Backend API ✅ (100% Complete)

- [x] User authentication (email + JWT + OAuth ready)
- [x] User profiles with follow system
- [x] Posts CRUD with code snippets
- [x] Like and comment functionality
- [x] Nested comments/replies
- [x] Personalized feed algorithm
- [x] Real-time chat backend
- [x] Real-time notifications backend
- [x] Search functionality (users, posts, hashtags)

### Phase 2: Frontend Core 🚧 (50% Complete)

- [x] React + TypeScript + Vite setup
- [x] Authentication UI (Login/SignUp pages)
- [x] React Router with protected routes
- [x] React Query data fetching
- [x] Layout with Navbar
- [x] Post creation with code editor
- [x] Post feed display
- [x] Like/unlike posts
- [x] Profile pages with user info
- [x] Follow/unfollow functionality
- [x] User API service and hooks
- [ ] Comment section UI
- [ ] Settings page for profile editing
- [ ] User search
- [ ] Real-time features (chat, notifications)

### Phase 3: Real-Time Features 📅 (Not Started)

- [ ] Socket.io client integration
- [ ] Real-time chat UI
- [ ] Live notifications dropdown
- [ ] Online/offline status indicators
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Live post reactions

### Phase 4: Enhanced Features 📅 (Planned)

- [ ] Image uploads for posts
- [ ] Advanced search with filters
- [ ] GitHub project integration
- [ ] Portfolio showcase
- [ ] Markdown rendering
- [ ] Code syntax highlighting
- [ ] Infinite scroll
- [ ] Dark mode
- [ ] Mobile responsive design
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Merlyn Mercylona**

- GitHub: [@merlynmercy](https://github.com/merlynmercy)
- LinkedIn: [Merlyn Mercylona](https://linkedin.com/in/merlynmercy)
- Portfolio: [merlynmercy.dev](https://merlynmercy.dev)

---

## 🙏 Acknowledgments

- Express.js for the lightweight framework
- Socket.io for real-time capabilities
- Prisma for the amazing ORM
- The developer community for inspiration

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

**Built with 💻 by developers, for developers**

Made with ❤️ by Merlyn Mercylona

</div>

# DevConnect - Quick Setup Guide

## ✅ What's Been Built

**Backend (100% Complete)**:

- Full REST API with 50+ endpoints
- JWT authentication with refresh tokens
- Real-time chat and notifications (Socket.io)
- PostgreSQL database with Prisma ORM
- Redis caching
- All 7 modules: Auth, Users, Posts, Feed, Chat, Notifications, Search

**Frontend (50% Complete)**:

- React 19 + TypeScript + Vite
- TailwindCSS styling
- React Router with protected routes
- React Query for data fetching
- API client with automatic token refresh
- Zustand auth store
- Complete type definitions
- Login & SignUp pages with validation
- Layout component with Navbar
- Home feed page
- Post creation form with code editor
- Post card component with like/delete
- Profile page with user stats and bio
- Follow/unfollow functionality
- User API service and custom hooks
- Loading and error states

## 🚀 Getting Started

### Prerequisites

Install these first:

- Node.js 18+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop/))

### Step 1: Start Docker

1. Open **Docker Desktop** application
2. Wait for it to start (Docker icon should be green)

### Step 2: Start Database

```bash
cd /Users/merlynmercy/Desktop/projects/dev-connect

# Start PostgreSQL and Redis
docker-compose up -d

# Verify they're running
docker-compose ps
```

### Step 3: Setup Backend Database

```bash
cd backend

# Run database migrations (creates tables)
npx prisma migrate dev

# Seed with sample data (optional but recommended)
npm run prisma:seed
```

**Sample users created**:

- Email: `john@example.com` | Password: `password123`
- Email: `jane@example.com` | Password: `password123`
- Email: `mike@example.com` | Password: `password123`

### Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

✅ Backend running at: **http://localhost:4000**

Test it: http://localhost:4000/health

### Step 5: Start Frontend (Optional)

```bash
# In a NEW terminal
cd frontend
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

(Note: Frontend is minimal right now, just a Vite starter)

## 🧪 Testing the Backend

### Option 1: Use Prisma Studio (Easiest)

```bash
cd backend
npx prisma studio
```

Opens a GUI at http://localhost:5555 where you can:

- View all data
- Create/edit/delete records
- Browse relationships

### Option 2: Use cURL or Postman

**Register a new user**:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "displayName": "New User"
  }'
```

**Login**:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Copy the `accessToken` from the response, then:

**Get posts**:

```bash
curl http://localhost:4000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get personalized feed**:

```bash
curl http://localhost:4000/api/feed \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Create a post**:

```bash
curl -X POST http://localhost:4000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from the API! #test",
    "codeSnippet": "console.log(\"Hello World\");",
    "language": "javascript"
  }'
```

## 📁 Project Structure

```
dev-connect/
├── backend/              ✅ 100% Complete
│   ├── src/
│   │   ├── modules/      # Auth, Users, Posts, Feed, Chat, Notifications, Search
│   │   ├── shared/       # Database, middleware, utils
│   │   ├── config/       # Environment config
│   │   └── server.ts     # Entry point
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Sample data
│   └── package.json
│
├── frontend/             🚧 50% Complete
│   ├── src/
│   │   ├── api/          # API client (posts, users) ✅
│   │   ├── store/        # Zustand stores ✅
│   │   ├── types/        # TypeScript types ✅
│   │   ├── hooks/        # React Query hooks ✅
│   │   ├── components/   # PostCard, PostForm, Layout, Navbar ✅
│   │   └── pages/        # Login, SignUp, Home, Profile ✅
│   └── package.json
│
├── docker-compose.yml    # PostgreSQL + Redis
├── README.md             # Full project documentation
├── PROJECT_STATUS.md     # Detailed status
└── SETUP.md              # This file
```

## 📚 API Endpoints

See full list in `backend/README.md` or `README.md`

Quick reference:

- **Auth**: `/api/auth/*` - register, login, refresh, me
- **Users**: `/api/users/*` - profiles, follow, followers
- **Posts**: `/api/posts/*` - CRUD, likes, comments
- **Feed**: `/api/feed/*` - personalized, trending, following
- **Chat**: `/api/messages/*` - conversations, messages
- **Notifications**: `/api/notifications/*` - get, read, delete
- **Search**: `/api/search/*` - users, posts, hashtags

## 🎯 Next Steps

1. **Test the backend** using Prisma Studio or cURL
2. **Complete the frontend** (see `PROJECT_STATUS.md` for tasks)
3. **Deploy** when ready (Railway, Render, or AWS)

## 🔧 Useful Commands

### Backend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Run migrations
npm run prisma:seed      # Seed database
```

### Frontend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Docker

```bash
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose ps        # Check status
docker-compose logs      # View logs
```

## ❓ Troubleshooting

**Backend won't start**:

- Make sure Docker is running
- Check if ports 4000, 5432, 6379 are available
- Run `docker-compose ps` to verify services are up

**Database connection error**:

- Wait 10 seconds after `docker-compose up` for DB to initialize
- Check `.env` file has correct `DATABASE_URL`

**Prisma errors**:

```bash
cd backend
npx prisma generate      # Regenerate Prisma client
npx prisma migrate reset # Reset and reseed database
```

## 🎓 For Your Portfolio

**When presenting to recruiters**:

1. **Show the architecture**: Point to README.md diagram
2. **Demo live features**: Run backend and test with Prisma Studio
3. **Explain technical choices**:
   - Why modular monolith over microservices
   - How JWT refresh tokens work
   - Redis caching strategy
   - Socket.io for real-time features
4. **Discuss scalability**: Feed algorithm, database indexing, caching
5. **Show code quality**: TypeScript, Zod validation, error handling

**Key talking points**:

- "Full-stack social platform with 7 backend modules"
- "Real-time chat and notifications using Socket.io"
- "JWT authentication with refresh token rotation"
- "Redis caching for feed performance"
- "PostgreSQL with Prisma ORM for type-safe database access"
- "Modular monolith architecture for maintainability"

## 📖 Documentation

- **README.md**: Full project overview
- **PROJECT_STATUS.md**: Detailed completion status
- **backend/README.md**: Backend API documentation
- **Prisma Schema**: `backend/prisma/schema.prisma`

---

**Built by**: Merlyn Mercylona
**Status**: Backend production-ready (100%), Frontend 50% complete
**Tech Stack**: TypeScript, Node.js, Express, React, PostgreSQL, Redis, Socket.io, Prisma

## Architecture Decisions

**Why Modular Monolith over Microservices?**

- Social features require frequent cross-domain queries (feed needs users + posts + follows)
- No network latency for inter-module communication
- Simpler deployment and debugging
- Easier transaction management across features
- Can extract modules to microservices later if needed
- Lower operational complexity for a portfolio project

**Why PostgreSQL?**

- Complex relational data (users, posts, comments, follows, likes)
- ACID transactions needed for consistency
- Built-in full-text search capabilities
- Excellent support for JSON columns (skills, hashtags arrays)
- Strong indexing for performance

**Why Redis?**

- Feed caching to reduce database load
- Session storage for JWT refresh tokens (future)
- Pub/Sub for real-time features
- Extremely fast read performance for frequently accessed data

## Performance Optimizations

- **Feed caching:** 5-minute Redis cache per user feed
- **Database indexing:** All foreign keys, usernames, emails, created_at
- **Pagination:** Limit 20 results per query
- **N+1 prevention:** Prisma `include` for eager loading
- **Connection pooling:** Prisma manages PostgreSQL connections
