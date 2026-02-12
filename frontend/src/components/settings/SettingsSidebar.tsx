export type SettingsSection = 'account' | 'password' | 'security' | 'notifications';

const MENU_ITEMS: { key: SettingsSection; label: string; icon: string }[] = [
  { key: 'account', label: 'Account', icon: '\u{1F464}' },
  { key: 'password', label: 'Password', icon: '\u{1F512}' },
  { key: 'security', label: 'Security', icon: '\u{1F6E1}\uFE0F' },
  { key: 'notifications', label: 'Notifications', icon: '\u{1F514}' },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onLogout: () => void;
}

export const SettingsSidebar = ({ activeSection, onSectionChange, onLogout }: SettingsSidebarProps) => (
  <div className="w-64 flex-shrink-0">
    <div className="bg-white rounded-lg shadow">
      {MENU_ITEMS.map((item) => (
        <button
          key={item.key}
          onClick={() => onSectionChange(item.key)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            activeSection === item.key
              ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </div>

    <div className="bg-white rounded-lg shadow mt-4 p-4">
      <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
      <button
        onClick={onLogout}
        className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
      >
        Sign Out
      </button>
    </div>
  </div>
);
