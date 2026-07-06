import apiClient from './client';
import type { Post, Comment, ApiResponse, PaginatedResponse } from '../types';

export const postsApi = {
  getPosts: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/posts?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  getPost: async (postId: string): Promise<Post> => {
    const response = await apiClient.get<ApiResponse<Post>>(`/posts/${postId}`);
    return response.data.data!;
  },

  createPost: async (data: {
    content: string;
    codeSnippet?: string;
    language?: string;
    images?: string[];
  }): Promise<Post> => {
    const response = await apiClient.post<ApiResponse<Post>>('/posts', data);
    return response.data.data!;
  },

  updatePost: async (postId: string, data: { content: string }): Promise<Post> => {
    const response = await apiClient.patch<ApiResponse<Post>>(`/posts/${postId}`, data);
    return response.data.data!;
  },

  deletePost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`);
  },

  likePost: async (postId: string): Promise<void> => {
    await apiClient.post(`/posts/${postId}/like`);
  },

  unlikePost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/like`);
  },

  getComments: async (postId: string, page = 1, limit = 20): Promise<{ comments: Comment[]; total: number }> => {
    const response = await apiClient.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${postId}/comments`, { content });
    return response.data.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/posts/comments/${commentId}`);
  },

  replyToComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await apiClient.post(`/posts/comments/${commentId}/reply`, { content });
    return response.data.data;
  },

  getCommentReplies: async (commentId: string, page = 1, limit = 20): Promise<{ replies: Comment[]; total: number }> => {
    const response = await apiClient.get(`/posts/comments/${commentId}/replies?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  likeComment: async (commentId: string): Promise<void> => {
    await apiClient.post(`/posts/comments/${commentId}/like`);
  },

  unlikeComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/posts/comments/${commentId}/like`);
  },
};
