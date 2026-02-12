import Bull from 'bull';
import { config } from '../../config/index.js';
import { TrainingService } from './training.service.js';
import { isRedisConnected } from '../../shared/database/redis.js';
import { logger } from '../../shared/utils/logger.js';

let trainingQueue: Bull.Queue | null = null;

export function initializeRecommendationQueue(): boolean {
  if (!isRedisConnected() || !config.redis.host) {
    logger.info('Recommendation queue disabled - Redis not available');
    return false;
  }

  try {
    trainingQueue = new Bull('recommendation-training', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        ...(config.redis.tls ? { tls: {} } : {}),
      },
    });

    trainingQueue.process(async () => {
      logger.info('Starting scheduled recommendation model retraining...');
      const result = await TrainingService.runTrainingPipeline();
      logger.info({ result }, 'Retraining result');
      return result;
    });

    trainingQueue.add(
      {},
      {
        repeat: { cron: '0 */6 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );

    trainingQueue.on('completed', (job, result) => {
      logger.info({ jobId: job.id, result }, 'Training job completed');
    });

    trainingQueue.on('failed', (job, err) => {
      logger.error({ jobId: job.id, err }, 'Training job failed');
    });

    return true;
  } catch (error) {
    logger.warn({ err: (error as Error).message }, 'Failed to initialize recommendation queue');
    return false;
  }
}

export function getTrainingQueue(): Bull.Queue | null {
  return trainingQueue;
}
