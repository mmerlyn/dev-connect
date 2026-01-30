import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  args: {
    placeholder: 'Enter text...',
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

// ── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {};

// ── With Label ──────────────────────────────────────────────────────────────
export const WithLabel: Story = {
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

// ── With Error ──────────────────────────────────────────────────────────────
export const WithError: Story = {
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    error: 'Please enter a valid email address.',
    defaultValue: 'not-an-email',
  },
};

// ── With Helper Text ────────────────────────────────────────────────────────
export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'johndoe',
    helperText: 'Your username must be 3-20 characters long.',
  },
};

// ── With Icons ──────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const MailIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Input
        label="Search"
        placeholder="Search..."
        leftIcon={<SearchIcon />}
      />
      <Input
        label="Email"
        placeholder="you@example.com"
        leftIcon={<MailIcon />}
        type="email"
      />
      <Input
        label="With right icon"
        placeholder="Enter text..."
        rightIcon={<SearchIcon />}
      />
    </div>
  ),
};

// ── Disabled ────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  args: {
    label: 'Disabled field',
    placeholder: 'Cannot type here',
    disabled: true,
  },
};
