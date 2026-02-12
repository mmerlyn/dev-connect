interface ProfileTabsProps {
  activeTab: 'posts' | 'likes';
  onTabChange: (tab: 'posts' | 'likes') => void;
}

export const ProfileTabs = ({ activeTab, onTabChange }: ProfileTabsProps) => (
  <div className="bg-white rounded-lg shadow mb-6">
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => onTabChange('posts')}
        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
          activeTab === 'posts'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Posts
      </button>
      <button
        onClick={() => onTabChange('likes')}
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
);
