import apiClient from './client';
import type { ApiResponse, Post, PaginatedResponse } from '../types';

interface RecommendationStatus {
  modelTrained: boolean;
  lastTrainedAt: string | null;
  totalTrainingExamples: number;
  userInteractionCount: number;
  usingMLRecommendations: boolean;
}

export const feedApi = {
  // Get personalized feed
  getPersonalizedFeed: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/feed?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  // Get trending posts
  getTrendingPosts: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/feed/trending?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  // Get following feed
  getFollowingFeed: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/feed/following?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  // Get ML-powered recommended feed
  getRecommendedFeed: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<PaginatedResponse<Post>>(
      `/feed/recommended?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get recommendation system status
  getRecommendationStatus: async (): Promise<RecommendationStatus> => {
    const response = await apiClient.get<ApiResponse<RecommendationStatus>>(
      '/feed/recommended/status'
    );
    return response.data.data!;
  },
};
