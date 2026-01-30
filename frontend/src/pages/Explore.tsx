import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components';
import { useTrendingPosts } from '../hooks/useFeed';
import { useUniversalSearch } from '../hooks/useSearch';
import type { User } from '../types';
import type { Hashtag } from '../api/search';

type Tab = 'trending' | 'users' | 'posts' | 'hashtags';

const UserCard = ({ user }: { user: User }) => (
  <Link
    to={`/profile/${user.username}`}
    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
  >
    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
      {user.avatar ? (
        <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
      ) : (
        user.displayName.charAt(0).toUpperCase()
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 truncate">{user.displayName}</p>
      <p className="text-sm text-gray-500 truncate">@{user.username}</p>
      {user.bio && <p className="text-sm text-gray-600 truncate mt-1">{user.bio}</p>}
    </div>
    <div className="text-sm text-gray-500">
      {user._count?.followers ?? 0} followers
    </div>
  </Link>
);

const HashtagCard = ({ hashtag }: { hashtag: Hashtag }) => (
  <Link
    to={`/hashtag/${hashtag.name}`}
    className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-2">
      <span className="text-2xl text-blue-500">#</span>
      <span className="font-semibold text-gray-900">{hashtag.name}</span>
    </div>
    <span className="text-sm text-gray-500">{hashtag.count} posts</span>
  </Link>
);

export const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('trending');

  const { data: trendingData, isLoading: trendingLoading } = useTrendingPosts();
  const { data: searchResults, isLoading: searchLoading } = useUniversalSearch(searchQuery);

  const isSearching = searchQuery.length >= 2;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'trending', label: 'Trending' },
    { key: 'users', label: 'Users' },
    { key: 'posts', label: 'Posts' },
    { key: 'hashtags', label: 'Hashtags' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, posts, or hashtags..."
            className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isSearching ? (
        // Search Results
        <div>
          {searchLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-gray-500 mt-2">Searching...</p>
            </div>
          ) : (
            <>
              {activeTab === 'trending' && searchResults && (
                <div className="space-y-4">
                  {searchResults.posts.length === 0 &&
                    searchResults.users.length === 0 &&
                    searchResults.hashtags.length === 0 && (
                      <div className="bg-white rounded-lg shadow p-6 text-center">
                        <p className="text-gray-500">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  {searchResults.users.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Users</h3>
                      <div className="space-y-2">
                        {searchResults.users.slice(0, 3).map((user) => (
                          <UserCard key={user.id} user={user} />
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.hashtags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Hashtags</h3>
                      <div className="space-y-2">
                        {searchResults.hashtags.slice(0, 3).map((hashtag) => (
                          <HashtagCard key={hashtag.id} hashtag={hashtag} />
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.posts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Posts</h3>
                      <div className="space-y-4">
                        {searchResults.posts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'users' && searchResults && (
                <div className="space-y-2">
                  {searchResults.users.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                      <p className="text-gray-500">No users found</p>
                    </div>
                  ) : (
                    searchResults.users.map((user) => <UserCard key={user.id} user={user} />)
                  )}
                </div>
              )}
              {activeTab === 'posts' && searchResults && (
                <div className="space-y-4">
                  {searchResults.posts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                      <p className="text-gray-500">No posts found</p>
                    </div>
                  ) : (
                    searchResults.posts.map((post) => <PostCard key={post.id} post={post} />)
                  )}
                </div>
              )}
              {activeTab === 'hashtags' && searchResults && (
                <div className="space-y-2">
                  {searchResults.hashtags.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                      <p className="text-gray-500">No hashtags found</p>
                    </div>
                  ) : (
                    searchResults.hashtags.map((hashtag) => (
                      <HashtagCard key={hashtag.id} hashtag={hashtag} />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Default: Trending Posts
        <div>
          {activeTab === 'trending' && (
            <div className="space-y-4">
              {trendingLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  <p className="text-gray-500 mt-2">Loading trending posts...</p>
                </div>
              ) : trendingData?.data.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">No trending posts yet</p>
                </div>
              ) : (
                trendingData?.data.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}
          {activeTab !== 'trending' && (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-gray-500">Start typing to search {activeTab}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
