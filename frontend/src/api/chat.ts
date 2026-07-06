import apiClient from './client';
import type { Conversation, Message, ApiResponse, PaginatedResponse } from '../types';

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<ApiResponse<Conversation[]>>('/messages/conversations');
    return response.data.data || [];
  },

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

  sendMessage: async (recipientId: string, content: string): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>('/messages', {
      recipientId,
      content,
    });
    return response.data.data!;
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await apiClient.patch(`/messages/${messageId}/read`);
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },

  markConversationAsRead: async (userId: string): Promise<void> => {
    const messages = await chatApi.getMessages(userId, 1, 100);
    const unreadMessages = messages.data.filter((m) => !m.read);
    await Promise.all(unreadMessages.map((m) => chatApi.markAsRead(m.id)));
  },
};
