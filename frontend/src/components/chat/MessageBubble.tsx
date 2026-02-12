import { formatDistanceToNow } from 'date-fns';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => (
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
