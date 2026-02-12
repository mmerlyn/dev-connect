import { Link } from 'react-router-dom';

interface ChatUser {
  username: string;
  displayName: string;
  avatar?: string | null;
}

interface ChatHeaderProps {
  user: ChatUser | null;
  isLoading: boolean;
}

export const ChatHeader = ({ user, isLoading }: ChatHeaderProps) => {
  if (isLoading) {
    return (
      <div className="p-4 border-b border-gray-200">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
      <Link to={`/profile/${user.username}`}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            user.displayName.charAt(0).toUpperCase()
          )}
        </div>
      </Link>
      <div>
        <Link
          to={`/profile/${user.username}`}
          className="font-semibold text-gray-900 hover:underline"
        >
          {user.displayName}
        </Link>
        <p className="text-sm text-gray-500">@{user.username}</p>
      </div>
    </div>
  );
};
