import { prisma } from '../../shared/database/client.js';
import { VocabularyService } from './vocabulary.service.js';
import { FeatureService } from './feature.service.js';
import { ModelService } from './model.service.js';
import { TRAINING_CONFIG, type TrainingExample } from './recommendation.types.js';
import { logger } from '../../shared/utils/logger.js';

export class TrainingService {
  // Generate training examples: positive (liked) and negative samples (1:3 ratio)
  static async generateTrainingData(): Promise<TrainingExample[]> {
    const examples: TrainingExample[] = [];

    // Get users with sufficient interactions
    const usersWithLikes = await prisma.user.findMany({
      where: {
        likes: {
          some: { postId: { not: null } },
        },
      },
      select: { id: true },
    });

    for (const user of usersWithLikes) {
      // Positive examples: posts the user liked
      const likedPosts = await prisma.like.findMany({
        where: { userId: user.id, postId: { not: null } },
        select: { postId: true },
        take: 50, // Limit per user
      });

      if (likedPosts.length < 2) continue;

      const userVector = await FeatureService.buildUserVector(user.id);

      // Build positive examples
      for (const like of likedPosts) {
        if (!like.postId) continue;
        const postVector = await FeatureService.buildPostVector(like.postId);
        examples.push({
          userVector: userVector.vector,
          postVector: postVector.vector,
          label: 1,
        });
      }

      // Generate negative examples (posts the user hasn't interacted with)
      const likedPostIds = likedPosts
        .map((l) => l.postId)
        .filter((id): id is string => id !== null);

      const negativeCount = likedPosts.length * TRAINING_CONFIG.negativeRatio;

      const negativePosts = await prisma.post.findMany({
        where: {
          id: { notIn: likedPostIds },
          authorId: { not: user.id }, // Exclude own posts
        },
        select: { id: true },
        take: negativeCount,
        orderBy: { createdAt: 'desc' },
      });

      for (const post of negativePosts) {
        const postVector = await FeatureService.buildPostVector(post.id);
        examples.push({
          userVector: userVector.vector,
          postVector: postVector.vector,
          label: 0,
        });
      }
    }

    return examples;
  }

  // Full training pipeline: rebuild vocab -> generate data -> train model
  static async runTrainingPipeline(): Promise<{
    success: boolean;
    exampleCount: number;
    metrics?: { loss: number; accuracy: number };
  }> {
    logger.info('Starting recommendation training pipeline...');

    try {
      // Step 1: Rebuild vocabularies
      logger.info('Step 1/3: Rebuilding vocabularies...');
      await VocabularyService.rebuildAll();

      // Step 2: Generate training data
      logger.info('Step 2/3: Generating training data...');
      const examples = await TrainingService.generateTrainingData();

      if (examples.length < 10) {
        logger.info({ exampleCount: examples.length }, 'Insufficient training data. Need at least 10.');
        return { success: false, exampleCount: examples.length };
      }

      logger.info({ exampleCount: examples.length }, 'Generated training examples');

      // Step 3: Train model
      logger.info('Step 3/3: Training model...');
      const history = await ModelService.train(examples);

      const finalLoss = history.history.loss?.slice(-1)[0] as number;
      const finalAccuracy = history.history.acc?.slice(-1)[0] as number;

      logger.info({ loss: finalLoss?.toFixed(4), accuracy: finalAccuracy?.toFixed(4) }, 'Training complete');

      return {
        success: true,
        exampleCount: examples.length,
        metrics: {
          loss: finalLoss || 0,
          accuracy: finalAccuracy || 0,
        },
      };
    } catch (error) {
      logger.error(error, 'Training pipeline failed');
      return { success: false, exampleCount: 0 };
    }
  }
}
