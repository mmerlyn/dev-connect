import type { ReactNode } from 'react';
import { cn } from './lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  variant?: 'underline' | 'pills';
  fullWidth?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  fullWidth = false,
}: TabsProps) {
  const isUnderline = variant === 'underline';

  return (
    <div
      role="tablist"
      className={cn(
        'flex',
        isUnderline && 'border-b border-gray-200',
        !isUnderline && 'gap-1 rounded-lg bg-gray-100 p-1',
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors focus:outline-none',
              fullWidth && 'flex-1',

              // ---- Underline variant ----
              isUnderline && [
                'px-4 py-2.5 -mb-px border-b-2',
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ],

              // ---- Pills variant ----
              !isUnderline && [
                'px-4 py-2 rounded-lg',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ],
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
                  isActive
                    ? isUnderline
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
