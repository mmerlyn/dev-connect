import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUser, useUserPosts, useFollowUser, useUnfollowUser } from '../hooks/useUsers';
import { PostCard } from '../components';

export const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { data: profileUser, isLoading, error } = useUser(username!);
  const { data: postsData, isLoading: postsLoading } = useUserPosts(
    profileUser?.id || '',
    1,
    20
  );
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');

  const isOwnProfile = currentUser?.id === profileUser?.id;
  const isFollowing = profileUser?.isFollowing || false;

  const handleFollowToggle = async () => {
    if (!profileUser) return;

    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(profileUser.id);
      } else {
        await followUser.mutateAsync(profileUser.id);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">User not found or failed to load profile.</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {profileUser.avatar ? (
              <img
                src={profileUser.avatar}
                alt={profileUser.displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              profileUser.displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{profileUser.displayName}</h1>
            </div>
            <p className="text-gray-600 mb-3">@{profileUser.username}</p>

            {/* Bio */}
            {profileUser.bio && <p className="text-gray-800 mb-3">{profileUser.bio}</p>}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              {profileUser.location && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{profileUser.location}</span>
                </div>
              )}
              {profileUser.websiteUrl && (
                <a
                  href={profileUser.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span>{profileUser.websiteUrl.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {profileUser.githubUrl && (
                <a
                  href={profileUser.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:underline"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </a>
              )}
            </div>

            {/* Skills */}
            {profileUser.skills && profileUser.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profileUser.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex space-x-6 text-sm">
              <div>
                <span className="font-bold text-gray-900">{profileUser._count?.posts ?? 0}</span>
                <span className="text-gray-600 ml-1">Posts</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">{profileUser._count?.followers ?? 0}</span>
                <span className="text-gray-600 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">{profileUser._count?.following ?? 0}</span>
                <span className="text-gray-600 ml-1">Following</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 w-full md:w-auto">
            {isOwnProfile ? (
              <Link
                to="/settings"
                className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followUser.isPending || unfollowUser.isPending}
                className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {followUser.isPending || unfollowUser.isPending
                  ? 'Loading...'
                  : isFollowing
                  ? 'Following'
                  : 'Follow'}
              </button>
            )}
            {!isOwnProfile && (
              <button
                onClick={() => navigate(`/messages?user=${profileUser.id}`)}
                className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Message
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'likes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Likes
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {postsLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading posts...</p>
          </div>
        )}

        {activeTab === 'posts' && postsData && postsData.data.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">
              {isOwnProfile ? "You haven't posted anything yet." : 'No posts yet.'}
            </p>
          </div>
        )}

        {activeTab === 'posts' &&
          postsData &&
          postsData.data.map((post) => <PostCard key={post.id} post={post} />)}

        {activeTab === 'likes' && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Liked posts coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};
