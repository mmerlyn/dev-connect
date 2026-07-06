import apiClient from './client';
import type { ApiResponse, Post, PaginatedResponse } from '../types';

export const feedApi = {
  getPersonalizedFeed: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/feed?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  getTrendingPosts: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/feed/trending?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  getFollowingFeed: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/feed/following?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

};
