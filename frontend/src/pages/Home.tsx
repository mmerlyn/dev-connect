import { useAuthStore } from '../store/authStore';
import { usePosts } from '../hooks/usePosts';
import { PostForm, PostCard } from '../components';

export const Home = () => {
  const { user } = useAuthStore();
  const { data, isLoading, error } = usePosts();

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.displayName}!
        </h1>
        <p className="text-gray-600 mt-1">See what's happening in the developer community</p>
      </div>

      {/* Create Post Form */}
      <PostForm />

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading posts...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700">Failed to load posts. Please try again later.</p>
          </div>
        )}

        {data && data.data.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        )}

        {data && data.data.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};
