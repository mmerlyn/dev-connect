// Recommendation engine type definitions and constants

// Vector dimensions
export const HASHTAG_VOCAB_SIZE = 128;
export const SKILL_VOCAB_SIZE = 64;
export const ENGAGEMENT_FEATURES = 4; // likes_given, comments_made, avg_session, post_frequency

// User vector: hashtag interests (128) + skill profile (64) + engagement features (4) = 196
export const USER_VECTOR_DIM = HASHTAG_VOCAB_SIZE + SKILL_VOCAB_SIZE + ENGAGEMENT_FEATURES;

// Post vector: hashtag presence (128) + author skills (64) + engagement+recency meta (5) = 197
export const POST_META_FEATURES = 5; // like_count_norm, comment_count_norm, view_count_norm, recency_score, author_follower_norm
export const POST_VECTOR_DIM = HASHTAG_VOCAB_SIZE + SKILL_VOCAB_SIZE + POST_META_FEATURES;

// Combined input for neural network: user (196) + post (197) = 393
export const MODEL_INPUT_DIM = USER_VECTOR_DIM + POST_VECTOR_DIM;

// Training configuration
export const TRAINING_CONFIG = {
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001,
  negativeRatio: 3, // 1 positive : 3 negative samples
  minInteractionsForML: 5, // Minimum interactions before using ML
  validationSplit: 0.2,
} as const;

// Recommendation configuration
export const RECOMMENDATION_CONFIG = {
  maxPostsPerAuthor: 2, // Diversity enforcement
  explorationRate: 0.1, // 10% exploration injection
  candidatePoolSize: 200, // Max candidates to score
  resultLimit: 20,
  cacheTTL: 600, // 10 minutes
} as const;

// Model file paths
export const MODEL_PATHS = {
  modelDir: 'models/recommendation',
  modelJson: 'models/recommendation/model.json',
  weightsDir: 'models/recommendation',
} as const;

// Vocabulary cache TTL
export const VOCAB_CACHE_TTL = 86400; // 24 hours

// Feature types
export interface UserFeatureVector {
  userId: string;
  vector: number[];
}

export interface PostFeatureVector {
  postId: string;
  vector: number[];
}

export interface TrainingExample {
  userVector: number[];
  postVector: number[];
  label: number; // 1 = liked, 0 = not liked
}

export interface RecommendationResult {
  postId: string;
  score: number;
  source: 'ml' | 'heuristic' | 'exploration';
}

export interface RecommendationStatus {
  modelTrained: boolean;
  lastTrainedAt: string | null;
  totalTrainingExamples: number;
  userInteractionCount: number;
  usingMLRecommendations: boolean;
}
