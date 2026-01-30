import { apiClient } from './client';
import type { ApiResponse, User, PaginatedResponse, Post } from '../types';

export const usersApi = {
  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data!;
  },

  getUserByUsername: async (username: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${username}`);
    return response.data.data!;
  },

  getUserPosts: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/users/${userId}/posts?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  getUserLikedPosts: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/users/${userId}/likes?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  followUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/follow`);
  },

  unfollowUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/follow`);
  },

  updateProfile: async (data: {
    displayName?: string;
    bio?: string;
    location?: string;
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    skills?: string[];
  }): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>('/users/profile', data);
    return response.data.data!;
  },

  updateAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
      '/users/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  updateBanner: async (file: File): Promise<{ bannerUrl: string }> => {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await apiClient.post<ApiResponse<{ bannerUrl: string }>>(
      '/users/banner',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },
};
