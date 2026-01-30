import { Dropdown } from './Dropdown';
import type { DropdownItem } from './Dropdown';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const noop = () => {
  /* no‑op for stories */
};

const basicItems: DropdownItem[] = [
  { label: 'Profile', onClick: noop },
  { label: 'Settings', onClick: noop },
  { label: 'Sign out', onClick: noop },
];

// Tiny inline SVG icons for demonstration purposes
function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Trigger component used in every story
// ---------------------------------------------------------------------------

function TriggerButton({ label = 'Options' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
      {label}
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export default {
  title: 'UI/Dropdown',
  component: Dropdown,
};

/** Basic dropdown with simple text items. */
export function Default() {
  return <Dropdown trigger={<TriggerButton />} items={basicItems} />;
}

/** Items with leading icons. */
export function WithIcons() {
  const items: DropdownItem[] = [
    { label: 'Edit', onClick: noop, icon: <EditIcon /> },
    { label: 'Duplicate', onClick: noop, icon: <CopyIcon /> },
    { label: 'Delete', onClick: noop, icon: <TrashIcon /> },
  ];

  return <Dropdown trigger={<TriggerButton />} items={items} />;
}

/** Dividers between logical groups. */
export function WithDividers() {
  const items: DropdownItem[] = [
    { label: 'Edit', onClick: noop },
    { label: 'Duplicate', onClick: noop },
    { label: 'Archive', onClick: noop, divider: true },
    { label: 'Delete', onClick: noop, divider: true },
  ];

  return <Dropdown trigger={<TriggerButton />} items={items} />;
}

/** Menu aligned to the right edge of the trigger. */
export function RightAligned() {
  return (
    <div className="flex justify-end">
      <Dropdown
        trigger={<TriggerButton label="Right aligned" />}
        items={basicItems}
        align="right"
      />
    </div>
  );
}
