import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { ErrorMiddleware } from './shared/middleware/error.middleware.js';
import { connectRedis } from './shared/database/redis.js';
import { prisma } from './shared/database/client.js';
import passport from './config/passport.js';
import { generalLimiter } from './shared/middleware/rateLimit.middleware.js';
import { SOCKET_CONFIG } from './shared/socket/socket.config.js';
import { setupRedisAdapter, RedisPresence } from './shared/socket/redis-adapter.js';
import { initializeRecommendationQueue } from './modules/recommendation/recommendation.queue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Module routers
import authRouter from './modules/auth/auth.routes.js';
import usersRouter from './modules/users/users.routes.js';
import postsRouter from './modules/posts/posts.routes.js';
import feedRouter from './modules/feed/feed.routes.js';
import chatRouter from './modules/chat/chat.routes.js';
import notificationsRouter from './modules/notifications/notifications.routes.js';
import searchRouter from './modules/search/search.routes.js';
import uploadsRouter from './modules/uploads/uploads.routes.js';
import metricsRouter from './modules/metrics/metrics.routes.js';
import { SocketService } from './shared/socket/socket.service.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with production config
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
  },
  pingInterval: SOCKET_CONFIG.pingInterval,
  pingTimeout: SOCKET_CONFIG.pingTimeout,
  transports: [...SOCKET_CONFIG.transports],
  allowUpgrades: SOCKET_CONFIG.allowUpgrades,
  upgradeTimeout: SOCKET_CONFIG.upgradeTimeout,
  maxHttpBufferSize: SOCKET_CONFIG.maxHttpBufferSize,
  connectTimeout: SOCKET_CONFIG.connectTimeout,
  perMessageDeflate: SOCKET_CONFIG.perMessageDeflate,
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
app.use(passport.initialize());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/messages', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/search', searchRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/metrics', metricsRouter);

// Initialize Socket.IO service
SocketService.initialize(io);

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

    // Setup Redis adapter for Socket.io horizontal scaling
    try {
      await setupRedisAdapter(io);
      await RedisPresence.initialize();
    } catch (err) {
      console.warn('Redis adapter setup failed (non-fatal):', err);
    }

    // Test database connection
    await prisma.$connect();
    console.log('Database connected');

    // Initialize recommendation training queue
    try {
      initializeRecommendationQueue();
      console.log('Recommendation training queue initialized');
    } catch (err) {
      console.warn('Recommendation queue setup failed (non-fatal):', err);
    }

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.env}`);
      console.log(`Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await SocketService.shutdown();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
