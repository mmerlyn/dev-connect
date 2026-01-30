import { METRICS_CONFIG } from './socket.config.js';

interface MetricSnapshot {
  timestamp: number;
  connectedClients: number;
  eventsProcessed: number;
  totalLatencyMs: number;
  eventCount: number;
}

interface WebSocketMetrics {
  connectedClients: number;
  peakConnections: number;
  eventsPerSecond: number;
  averageLatencyMs: number;
  totalEventsProcessed: number;
  uptime: number;
}

class SocketMetricsCollector {
  private snapshots: MetricSnapshot[] = [];
  private currentConnections = 0;
  private peakConnections = 0;
  private totalEventsProcessed = 0;
  private rollingEventCount = 0;
  private rollingLatencySum = 0;
  private rollingLatencyCount = 0;
  private startTime = Date.now();
  private snapshotInterval: ReturnType<typeof setInterval> | null = null;

  start() {
    this.startTime = Date.now();
    this.snapshotInterval = setInterval(() => {
      this.takeSnapshot();
    }, METRICS_CONFIG.snapshotIntervalMs);
  }

  stop() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }

  recordConnection() {
    this.currentConnections++;
    if (this.currentConnections > this.peakConnections) {
      this.peakConnections = this.currentConnections;
    }
  }

  recordDisconnection() {
    this.currentConnections = Math.max(0, this.currentConnections - 1);
  }

  recordEvent(latencyMs: number) {
    this.totalEventsProcessed++;
    this.rollingEventCount++;
    this.rollingLatencySum += latencyMs;
    this.rollingLatencyCount++;
  }

  private takeSnapshot() {
    const snapshot: MetricSnapshot = {
      timestamp: Date.now(),
      connectedClients: this.currentConnections,
      eventsProcessed: this.rollingEventCount,
      totalLatencyMs: this.rollingLatencySum,
      eventCount: this.rollingLatencyCount,
    };

    this.snapshots.push(snapshot);

    // Reset rolling counters
    this.rollingEventCount = 0;
    this.rollingLatencySum = 0;
    this.rollingLatencyCount = 0;

    // Trim old snapshots
    if (this.snapshots.length > METRICS_CONFIG.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-METRICS_CONFIG.maxSnapshots);
    }
  }

  getMetrics(): WebSocketMetrics {
    const now = Date.now();
    const windowStart = now - METRICS_CONFIG.windowSizeMs;

    // Calculate events/sec from recent snapshots
    const recentSnapshots = this.snapshots.filter(
      (s) => s.timestamp >= windowStart
    );

    let totalEvents = 0;
    let totalLatency = 0;
    let totalLatencyCount = 0;

    for (const snap of recentSnapshots) {
      totalEvents += snap.eventsProcessed;
      totalLatency += snap.totalLatencyMs;
      totalLatencyCount += snap.eventCount;
    }

    const windowSeconds = Math.min(
      (now - this.startTime) / 1000,
      METRICS_CONFIG.windowSizeMs / 1000
    );

    return {
      connectedClients: this.currentConnections,
      peakConnections: this.peakConnections,
      eventsPerSecond:
        windowSeconds > 0
          ? Math.round((totalEvents / windowSeconds) * 100) / 100
          : 0,
      averageLatencyMs:
        totalLatencyCount > 0
          ? Math.round((totalLatency / totalLatencyCount) * 100) / 100
          : 0,
      totalEventsProcessed: this.totalEventsProcessed,
      uptime: Math.floor((now - this.startTime) / 1000),
    };
  }
}

// Singleton
export const socketMetrics = new SocketMetricsCollector();
