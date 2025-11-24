import { useAuthStore } from '../store/authStore';

export const Home = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.displayName}!
        </h1>
        <p className="text-gray-600 mt-1">See what's happening in the developer community</p>
      </div>

      {/* Create Post Card */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <textarea
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="mt-3 flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts will go here */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No posts yet. Be the first to share something!</p>
        </div>
      </div>
    </div>
  );
};
