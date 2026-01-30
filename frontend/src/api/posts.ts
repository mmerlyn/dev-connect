import apiClient from './client';
import type { Post, Comment, ApiResponse, PaginatedResponse } from '../types';

export const postsApi = {
  // Get all posts (feed)
  getPosts: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/posts?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  // Get single post
  getPost: async (postId: string): Promise<Post> => {
    const response = await apiClient.get<ApiResponse<Post>>(`/posts/${postId}`);
    return response.data.data!;
  },

  // Create post
  createPost: async (data: {
    content: string;
    codeSnippet?: string;
    language?: string;
    images?: string[];
  }): Promise<Post> => {
    const response = await apiClient.post<ApiResponse<Post>>('/posts', data);
    return response.data.data!;
  },

  // Update post
  updatePost: async (postId: string, data: { content: string }): Promise<Post> => {
    const response = await apiClient.patch<ApiResponse<Post>>(`/posts/${postId}`, data);
    return response.data.data!;
  },

  // Delete post
  deletePost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`);
  },

  // Like post
  likePost: async (postId: string): Promise<void> => {
    await apiClient.post(`/posts/${postId}/like`);
  },

  // Unlike post
  unlikePost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/like`);
  },

  // Get post comments
  getComments: async (postId: string, page = 1, limit = 20): Promise<{ comments: Comment[]; total: number }> => {
    const response = await apiClient.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Add comment
  addComment: async (postId: string, content: string): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${postId}/comments`, { content });
    return response.data.data;
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/posts/comments/${commentId}`);
  },

  // Reply to comment
  replyToComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await apiClient.post(`/posts/comments/${commentId}/reply`, { content });
    return response.data.data;
  },

  // Get comment replies
  getCommentReplies: async (commentId: string, page = 1, limit = 20): Promise<{ replies: Comment[]; total: number }> => {
    const response = await apiClient.get(`/posts/comments/${commentId}/replies?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Like comment
  likeComment: async (commentId: string): Promise<void> => {
    await apiClient.post(`/posts/comments/${commentId}/like`);
  },

  // Unlike comment
  unlikeComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/posts/comments/${commentId}/like`);
  },
};
