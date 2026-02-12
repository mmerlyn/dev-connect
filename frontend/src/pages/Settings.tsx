import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  SettingsSidebar,
  AccountInfoSection,
  PasswordChangeSection,
  TwoFactorSection,
  NotificationPreferences,
} from '../components/settings';
import type { SettingsSection } from '../components/settings';

export const Settings = () => {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="flex gap-6">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={logout}
        />

        <div className="flex-1">
          {activeSection === 'account' && <AccountInfoSection user={user} />}
          {activeSection === 'password' && <PasswordChangeSection />}
          {activeSection === 'security' && <TwoFactorSection />}
          {activeSection === 'notifications' && <NotificationPreferences />}
        </div>
      </div>
    </div>
  );
};
