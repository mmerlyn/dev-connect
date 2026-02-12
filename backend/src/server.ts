import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { config } from './config/index.js';
import { connectRedis, disconnectRedis } from './shared/database/redis.js';
import { prisma } from './shared/database/client.js';
import { SOCKET_CONFIG } from './shared/socket/socket.config.js';
import { setupRedisAdapter, RedisPresence } from './shared/socket/redis-adapter.js';
import { initializeRecommendationQueue } from './modules/recommendation/recommendation.queue.js';
import { SocketService } from './shared/socket/socket.service.js';
import { logger } from './shared/utils/logger.js';

const httpServer = createServer(app);

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

SocketService.initialize(io);

export { io };

const startServer = async () => {
  try {
    const redisConnected = await connectRedis();

    if (redisConnected) {
      try {
        await setupRedisAdapter(io);
        await RedisPresence.initialize();
        logger.info('Socket.IO Redis adapter enabled');
      } catch (err) {
        logger.warn({ err }, 'Redis adapter setup failed (non-fatal)');
      }
    } else {
      logger.info('Socket.IO running without Redis adapter (single-instance mode)');
    }

    await prisma.$connect();
    logger.info('Database connected');

    if (redisConnected && initializeRecommendationQueue()) {
      logger.info('Recommendation training queue initialized');
    }

    httpServer.listen(config.port, () => {
      logger.info({ port: config.port, env: config.env, frontendUrl: config.frontendUrl }, 'Server running');
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await SocketService.shutdown();
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
