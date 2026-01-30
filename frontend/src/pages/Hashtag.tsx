import { useParams, Link } from 'react-router-dom';
import { PostCard } from '../components';
import { usePostsByHashtag } from '../hooks/useSearch';

export const Hashtag = () => {
  const { tag } = useParams<{ tag: string }>();
  const { data, isLoading, isError } = usePostsByHashtag(tag || '');

  if (!tag) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Invalid hashtag</p>
          <Link to="/explore" className="text-blue-600 hover:underline mt-2 inline-block">
            Go to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-3xl text-white">#</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">#{tag}</h1>
            <p className="text-gray-500">
              {data?.pagination.total ?? 0} {data?.pagination.total === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Loading posts...</p>
          </div>
        ) : isError ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-red-500">Failed to load posts</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
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
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
            <p className="text-gray-500">No posts with this hashtag yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to post with #{tag}</p>
          </div>
        ) : (
          data?.data.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
};
