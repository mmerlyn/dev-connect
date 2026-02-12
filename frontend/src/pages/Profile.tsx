import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUser, useUserPosts, useUserLikedPosts, useFollowUser, useUnfollowUser } from '../hooks/useUsers';
import { PostCard } from '../components';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileTabs } from '../components/profile/ProfileTabs';

export const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { data: profileUser, isLoading, error } = useUser(username!);
  const { data: postsData, isLoading: postsLoading } = useUserPosts(profileUser?.id || '', 1, 20);
  const { data: likedPostsData, isLoading: likedPostsLoading } = useUserLikedPosts(profileUser?.id || '', 1, 20);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);

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
      <ProfileHeader
        user={profileUser}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isFollowPending={followUser.isPending || unfollowUser.isPending}
        onEditProfile={() => setShowEditModal(true)}
        onFollowToggle={handleFollowToggle}
        onMessage={() => navigate(`/messages?user=${profileUser.id}`)}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

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

        {activeTab === 'likes' && likedPostsLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading liked posts...</p>
          </div>
        )}

        {activeTab === 'likes' && !likedPostsLoading && likedPostsData && likedPostsData.data.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">
              {isOwnProfile ? "You haven't liked any posts yet." : 'No liked posts yet.'}
            </p>
          </div>
        )}

        {activeTab === 'likes' &&
          !likedPostsLoading &&
          likedPostsData &&
          likedPostsData.data.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      {profileUser && (
        <EditProfileModal
          user={profileUser}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};
