import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}

export const ConversationItem = ({
  conversation,
  isSelected,
  currentUserId,
  onClick,
}: ConversationItemProps) => {
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
