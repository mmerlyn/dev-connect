import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationAsRead,
} from '../hooks/useChat';
import { useUserById } from '../hooks/useUsers';
import { ConversationItem, MessageBubble, ChatHeader, MessageInput } from '../components/chat';

export const Messages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('user');
  const { user: currentUser } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: messagesData, isLoading: messagesLoading } = useMessages(selectedUserId || '');
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationAsRead();

  const isNewConversation = selectedUserId && !conversations?.find((c) => c.user.id === selectedUserId);
  const { data: newChatUser, isLoading: newChatUserLoading } = useUserById(
    isNewConversation ? selectedUserId : ''
  );

  const selectedConversation = conversations?.find((c) => c.user.id === selectedUserId);
  const chatUser = selectedConversation?.user || (newChatUser ? {
    id: newChatUser.id,
    username: newChatUser.username,
    displayName: newChatUser.displayName,
    avatar: newChatUser.avatar,
    lastActive: newChatUser.createdAt,
  } : null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  useEffect(() => {
    if (selectedUserId && selectedConversation && (selectedConversation.unreadCount ?? 0) > 0) {
      markAsRead.mutate(selectedUserId);
    }
  }, [selectedUserId, selectedConversation, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUserId) return;

    try {
      await sendMessage.mutateAsync({
        recipientId: selectedUserId,
        content: messageInput.trim(),
      });
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const showChatArea = selectedUserId && (chatUser || newChatUserLoading);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading conversations...</p>
                </div>
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.user.id}
                    conversation={conversation}
                    isSelected={conversation.user.id === selectedUserId}
                    currentUserId={currentUser?.id || ''}
                    onClick={() => setSearchParams({ user: conversation.user.id })}
                  />
                ))
              ) : (
                <div className="p-6 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start a conversation from someone's profile</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {showChatArea ? (
              <>
                <ChatHeader user={chatUser} isLoading={newChatUserLoading} />

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2 text-sm">Loading messages...</p>
                    </div>
                  ) : messagesData && messagesData.data.length > 0 ? (
                    <>
                      {[...messagesData.data].reverse().map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwn={message.senderId === currentUser?.id}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-1">Send a message to start the conversation</p>
                    </div>
                  )}
                </div>

                <MessageInput
                  value={messageInput}
                  onChange={setMessageInput}
                  onSubmit={handleSendMessage}
                  isSending={sendMessage.isPending}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Your Messages</h3>
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
