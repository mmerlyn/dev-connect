import { useState } from 'react';
import { Tabs } from './Tabs';
import type { TabItem } from './Tabs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseTabs: TabItem[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'replies', label: 'Replies' },
  { key: 'likes', label: 'Likes' },
];

const tabsWithCounts: TabItem[] = [
  { key: 'posts', label: 'Posts', count: 42 },
  { key: 'replies', label: 'Replies', count: 8 },
  { key: 'likes', label: 'Likes', count: 120 },
];

// Simple inline SVG icons for demonstration
function HomeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

const tabsWithIcons: TabItem[] = [
  { key: 'home', label: 'Home', icon: <HomeIcon /> },
  { key: 'profile', label: 'Profile', icon: <UserIcon /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

// ---------------------------------------------------------------------------
// Stateful wrapper so each story can track active tab
// ---------------------------------------------------------------------------

function TabsDemo(props: Omit<React.ComponentProps<typeof Tabs>, 'activeTab' | 'onChange'> & { defaultTab?: string }) {
  const { defaultTab, ...rest } = props;
  const [active, setActive] = useState(defaultTab ?? rest.tabs[0].key);
  return <Tabs {...rest} activeTab={active} onChange={setActive} />;
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export default {
  title: 'UI/Tabs',
  component: Tabs,
};

/** Underline variant (default). */
export function UnderlineVariant() {
  return <TabsDemo tabs={baseTabs} />;
}

/** Pills variant with rounded filled active state. */
export function PillsVariant() {
  return <TabsDemo tabs={baseTabs} variant="pills" />;
}

/** Tabs with count badges next to each label. */
export function WithCounts() {
  return <TabsDemo tabs={tabsWithCounts} />;
}

/** Tabs with leading icons. */
export function WithIcons() {
  return <TabsDemo tabs={tabsWithIcons} />;
}

/** Full‑width tabs stretch evenly to fill the container. */
export function FullWidth() {
  return <TabsDemo tabs={baseTabs} fullWidth />;
}
