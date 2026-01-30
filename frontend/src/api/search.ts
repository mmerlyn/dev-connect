import apiClient from './client';
import type { ApiResponse, User, Post, PaginatedResponse } from '../types';

export interface Hashtag {
  id: string;
  name: string;
  count: number;
}

export interface UniversalSearchResult {
  users: User[];
  posts: Post[];
  hashtags: Hashtag[];
}

export const searchApi = {
  // Universal search
  universalSearch: async (query: string): Promise<UniversalSearchResult> => {
    const response = await apiClient.get<ApiResponse<UniversalSearchResult>>(
      `/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data!;
  },

  // Search users
  searchUsers: async (query: string, page = 1, limit = 20): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      `/search/users?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  // Search posts
  searchPosts: async (query: string, page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/search/posts?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  // Search hashtags
  searchHashtags: async (query: string, page = 1, limit = 20): Promise<PaginatedResponse<Hashtag>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Hashtag>>>(
      `/search/hashtags?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  // Get posts by hashtag
  getPostsByHashtag: async (tag: string, page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/search/hashtag/${encodeURIComponent(tag)}?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },
};
