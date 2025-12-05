import apiClient from './client';
import type { Conversation, Message, ApiResponse, PaginatedResponse } from '../types';

export const chatApi = {
  // Get all conversations for the current user
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<ApiResponse<Conversation[]>>('/messages/conversations');
    return response.data.data || [];
  },

  // Get messages with a specific user
  getMessages: async (
    userId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Message>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Message>>>(
      `/messages/${userId}`,
      { params: { page, limit } }
    );
    return response.data.data || { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
  },

  // Send a message to a user
  sendMessage: async (recipientId: string, content: string): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>('/messages', {
      recipientId,
      content,
    });
    return response.data.data!;
  },

  // Mark a message as read
  markAsRead: async (messageId: string): Promise<void> => {
    await apiClient.patch(`/messages/${messageId}/read`);
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },

  // Mark all messages from a user as read
  markConversationAsRead: async (userId: string): Promise<void> => {
    const messages = await chatApi.getMessages(userId, 1, 100);
    const unreadMessages = messages.data.filter((m) => !m.read);
    await Promise.all(unreadMessages.map((m) => chatApi.markAsRead(m.id)));
  },
};
