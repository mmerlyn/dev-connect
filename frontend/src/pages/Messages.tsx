import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationAsRead,
} from '../hooks/useChat';
import { useUserById } from '../hooks/useUsers';
import type { Conversation, Message } from '../types';

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

  // Fetch user details if not in conversations list (new chat)
  const isNewConversation = selectedUserId && !conversations?.find((c) => c.user.id === selectedUserId);
  const { data: newChatUser, isLoading: newChatUserLoading } = useUserById(
    isNewConversation ? selectedUserId : ''
  );

  // Get selected conversation details (from existing conversations or new user)
  const selectedConversation = conversations?.find((c) => c.user.id === selectedUserId);
  const chatUser = selectedConversation?.user || (newChatUser ? {
    id: newChatUser.id,
    username: newChatUser.username,
    displayName: newChatUser.displayName,
    avatar: newChatUser.avatar,
    lastActive: newChatUser.createdAt,
  } : null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedUserId && selectedConversation && (selectedConversation.unreadCount ?? 0) > 0) {
      markAsRead.mutate(selectedUserId);
    }
  }, [selectedUserId, selectedConversation, markAsRead]);

  const handleSelectConversation = (userId: string) => {
    setSearchParams({ user: userId });
  };

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
                    onClick={() => handleSelectConversation(conversation.user.id)}
                  />
                ))
              ) : (
                <div className="p-6 text-center">
                  <svg
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Start a conversation from someone's profile
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {showChatArea ? (
              <>
                {/* Chat Header */}
                {newChatUserLoading ? (
                  <div className="p-4 border-b border-gray-200">
                    <div className="animate-pulse flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ) : chatUser ? (
                  <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                    <Link to={`/profile/${chatUser.username}`}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {chatUser.avatar ? (
                          <img
                            src={chatUser.avatar}
                            alt={chatUser.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          chatUser.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Link>
                    <div>
                      <Link
                        to={`/profile/${chatUser.username}`}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        {chatUser.displayName}
                      </Link>
                      <p className="text-sm text-gray-500">@{chatUser.username}</p>
                    </div>
                  </div>
                ) : null}

                {/* Messages */}
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
                      <p className="text-gray-400 text-sm mt-1">
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sendMessage.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendMessage.isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
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

// Conversation list item component
const ConversationItem = ({
  conversation,
  isSelected,
  currentUserId,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}) => {
  const isOwnMessage = conversation.lastMessage?.senderId === currentUserId;
  const unreadCount = conversation.unreadCount ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors text-left ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
          {conversation.user.avatar ? (
            <img
              src={conversation.user.avatar}
              alt={conversation.user.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            conversation.user.displayName.charAt(0).toUpperCase()
          )}
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
            {conversation.user.displayName}
          </h3>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">@{conversation.user.username}</p>
        {conversation.lastMessage && (
          <p className={`text-sm truncate mt-1 ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {isOwnMessage && <span className="text-gray-400">You: </span>}
            {conversation.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
};

// Message bubble component
const MessageBubble = ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <p className="break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};
