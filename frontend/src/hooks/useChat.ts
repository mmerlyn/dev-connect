import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    refetchInterval: 30000, // Refetch every 30 seconds for new messages
  });
};

export const useMessages = (userId: string, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['messages', userId, page, limit],
    queryFn: () => chatApi.getMessages(userId, page, limit),
    enabled: !!userId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipientId, content }: { recipientId: string; content: string }) =>
      chatApi.sendMessage(recipientId, content),
    onSuccess: (newMessage) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ queryKey: ['messages', newMessage.recipientId] });
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.markConversationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
