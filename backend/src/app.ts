import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { ErrorMiddleware } from './shared/middleware/error.middleware.js';
import passport from './config/passport.js';
import { generalLimiter } from './shared/middleware/rateLimit.middleware.js';

import authRouter from './modules/auth/auth.routes.js';
import usersRouter from './modules/users/users.routes.js';
import postsRouter from './modules/posts/posts.routes.js';
import feedRouter from './modules/feed/feed.routes.js';
import chatRouter from './modules/chat/chat.routes.js';
import notificationsRouter from './modules/notifications/notifications.routes.js';
import searchRouter from './modules/search/search.routes.js';
import uploadsRouter from './modules/uploads/uploads.routes.js';
import metricsRouter from './modules/metrics/metrics.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', generalLimiter);

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/messages', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/search', searchRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/metrics', metricsRouter);

app.use(ErrorMiddleware.notFound);
app.use(ErrorMiddleware.handle);

export { app };
