const NOTIFICATION_OPTIONS = [
  { label: 'Post Likes', description: 'When someone likes your post', hasBorder: true },
  { label: 'Comments', description: 'When someone comments on your post', hasBorder: true },
  { label: 'New Followers', description: 'When someone follows you', hasBorder: true },
  { label: 'Direct Messages', description: 'When you receive a new message', hasBorder: false },
] as const;

export const NotificationPreferences = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>

    <div className="space-y-4">
      {NOTIFICATION_OPTIONS.map((option) => (
        <div
          key={option.label}
          className={`flex items-center justify-between py-3 ${option.hasBorder ? 'border-b border-gray-100' : ''}`}
        >
          <div>
            <p className="font-medium text-gray-900">{option.label}</p>
            <p className="text-sm text-gray-500">{option.description}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      ))}
    </div>

    <p className="mt-4 text-sm text-gray-500">
      Note: Notification preferences are stored locally and will be synced with the server in a future update.
    </p>
  </div>
);
