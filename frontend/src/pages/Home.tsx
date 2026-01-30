import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRecommendedFeed, useTrendingPosts, useFollowingFeed } from '../hooks/useFeed';
import { PostForm, PostCard } from '../components';

type FeedTab = 'foryou' | 'following' | 'trending';

export const Home = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');

  const recommended = useRecommendedFeed();
  const following = useFollowingFeed();
  const trending = useTrendingPosts();

  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'foryou', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'trending', label: 'Trending' },
  ];

  const feedMap = {
    foryou: recommended,
    following: following,
    trending: trending,
  };

  const activeFeed = feedMap[activeTab];
  const { data, isLoading, error } = activeFeed;

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

      {/* Feed Tab Switcher */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

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
            <p className="text-gray-500">
              {activeTab === 'following'
                ? 'Follow some developers to see their posts here!'
                : activeTab === 'foryou'
                ? 'Interact with posts to get personalized recommendations!'
                : 'No trending posts yet. Be the first to share something!'}
            </p>
          </div>
        )}

        {data && data.data.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};
