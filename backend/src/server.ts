import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { ErrorMiddleware } from './shared/middleware/error.middleware.js';
import { connectRedis } from './shared/database/redis.js';
import { prisma } from './shared/database/client.js';

// Import module routers (will create these)
import authRouter from './modules/auth/auth.routes.js';
import usersRouter from './modules/users/users.routes.js';
import postsRouter from './modules/posts/posts.routes.js';
import feedRouter from './modules/feed/feed.routes.js';
import chatRouter from './modules/chat/chat.routes.js';
import notificationsRouter from './modules/notifications/notifications.routes.js';
import searchRouter from './modules/search/search.routes.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/messages', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/search', searchRouter);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Authentication
  socket.on('authenticate', async (data: { token: string }) => {
    try {
      // Verify token and associate socket with user
      // Will implement this in chat module
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
export { io };

// Error handlers (must be last)
app.use(ErrorMiddleware.notFound);
app.use(ErrorMiddleware.handle);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📡 Environment: ${config.env}`);
      console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
