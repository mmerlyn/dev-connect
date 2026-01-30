import Bull from 'bull';
import { config } from '../../config/index.js';
import { TrainingService } from './training.service.js';

let trainingQueue: Bull.Queue | null = null;

export function initializeRecommendationQueue() {
  trainingQueue = new Bull('recommendation-training', {
    redis: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
  });

  // Process training jobs
  trainingQueue.process(async () => {
    console.log('Starting scheduled recommendation model retraining...');
    const result = await TrainingService.runTrainingPipeline();
    console.log('Retraining result:', result);
    return result;
  });

  // Schedule retraining every 6 hours
  trainingQueue.add(
    {},
    {
      repeat: { cron: '0 */6 * * *' }, // Every 6 hours
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  trainingQueue.on('completed', (job, result) => {
    console.log(`Training job ${job.id} completed:`, result);
  });

  trainingQueue.on('failed', (job, err) => {
    console.error(`Training job ${job.id} failed:`, err);
  });
}

export function getTrainingQueue(): Bull.Queue | null {
  return trainingQueue;
}
