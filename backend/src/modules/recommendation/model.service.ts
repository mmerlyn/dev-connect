import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  MODEL_INPUT_DIM,
  MODEL_PATHS,
  TRAINING_CONFIG,
  type TrainingExample,
} from './recommendation.types.js';
import { logger } from '../../shared/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export class ModelService {
  private static model: tf.LayersModel | null = null;
  private static lastTrainedAt: Date | null = null;
  private static totalTrainingExamples = 0;

  // Build the 3-layer neural network: 393 -> 128 -> 64 -> 32 -> 1 (sigmoid)
  static buildModel(): tf.LayersModel {
    const model = tf.sequential();

    model.add(
      tf.layers.dense({
        inputShape: [MODEL_INPUT_DIM],
        units: 128,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      })
    );

    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(
      tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      })
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      })
    );

    model.add(
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      })
    );

    model.compile({
      optimizer: tf.train.adam(TRAINING_CONFIG.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  // Train the model with training examples
  static async train(examples: TrainingExample[]): Promise<tf.History> {
    if (examples.length === 0) {
      throw new Error('No training examples provided');
    }

    // Build or rebuild model
    ModelService.model = ModelService.buildModel();

    // Prepare tensors
    const inputs = examples.map((e) => [...e.userVector, ...e.postVector]);
    const labels = examples.map((e) => e.label);

    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    try {
      const history = await ModelService.model.fit(xs, ys, {
        epochs: TRAINING_CONFIG.epochs,
        batchSize: TRAINING_CONFIG.batchSize,
        validationSplit: TRAINING_CONFIG.validationSplit,
        shuffle: true,
        verbose: 0,
      });

      ModelService.lastTrainedAt = new Date();
      ModelService.totalTrainingExamples = examples.length;

      // Save model to disk
      await ModelService.saveModel();

      return history;
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  // Batch predict scores for user-post pairs
  static async predict(
    userVector: number[],
    postVectors: number[][]
  ): Promise<number[]> {
    if (!ModelService.model) {
      await ModelService.loadModel();
    }

    if (!ModelService.model) {
      throw new Error('Model not available');
    }

    // Combine user vector with each post vector
    const inputs = postVectors.map((pv) => [...userVector, ...pv]);
    const xs = tf.tensor2d(inputs);

    try {
      const predictions = ModelService.model.predict(xs) as tf.Tensor;
      const scores = await predictions.data();
      predictions.dispose();
      return Array.from(scores);
    } finally {
      xs.dispose();
    }
  }

  // Save model to disk
  static async saveModel(): Promise<void> {
    if (!ModelService.model) return;

    const modelDir = path.join(PROJECT_ROOT, MODEL_PATHS.modelDir);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    await ModelService.model.save(`file://${modelDir}`);
    logger.info('Recommendation model saved to disk');
  }

  // Load model from disk
  static async loadModel(): Promise<boolean> {
    const modelPath = path.join(PROJECT_ROOT, MODEL_PATHS.modelJson);

    if (!fs.existsSync(modelPath)) {
      return false;
    }

    try {
      ModelService.model = await tf.loadLayersModel(`file://${modelPath}`);
      logger.info('Recommendation model loaded from disk');
      return true;
    } catch (err) {
      logger.error(err, 'Failed to load recommendation model');
      return false;
    }
  }

  static isModelTrained(): boolean {
    return ModelService.model !== null;
  }

  static getLastTrainedAt(): Date | null {
    return ModelService.lastTrainedAt;
  }

  static getTotalTrainingExamples(): number {
    return ModelService.totalTrainingExamples;
  }
}
