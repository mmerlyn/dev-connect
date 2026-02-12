interface AccountInfoSectionProps {
  user: {
    email?: string;
    username?: string;
    displayName?: string;
    createdAt?: string;
  } | null;
}

export const AccountInfoSection = ({ user }: AccountInfoSectionProps) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
        <p className="text-gray-900">{user?.email}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
        <p className="text-gray-900">@{user?.username}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">Display Name</label>
        <p className="text-gray-900">{user?.displayName}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
        <p className="text-gray-900">
          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </p>
      </div>
    </div>

    <div className="mt-6 pt-6 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        To update your profile information, visit your{' '}
        <a href={`/profile/${user?.username}`} className="text-blue-600 hover:underline">
          profile page
        </a>{' '}
        and click "Edit Profile".
      </p>
    </div>
  </div>
);
