import { Router, Request, Response } from 'express';
import { socketMetrics } from '../../shared/socket/socket.metrics.js';

const router = Router();

// GET /api/metrics/websocket - Expose real-time WebSocket stats
router.get('/websocket', (_req: Request, res: Response) => {
  const metrics = socketMetrics.getMetrics();
  res.json({
    success: true,
    data: {
      connections: {
        current: metrics.connectedClients,
        peak: metrics.peakConnections,
      },
      performance: {
        eventsPerSecond: metrics.eventsPerSecond,
        averageLatencyMs: metrics.averageLatencyMs,
        totalEventsProcessed: metrics.totalEventsProcessed,
      },
      server: {
        uptimeSeconds: metrics.uptime,
      },
    },
  });
});

export default router;
