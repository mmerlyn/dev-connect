import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

const DefaultIcon = (
  <svg
    className="h-12 w-12"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export const Default: Story = {
  args: {
    icon: DefaultIcon,
    title: 'No posts yet',
    description: 'Get started by creating your first post.',
  },
};

export const WithAction: Story = {
  args: {
    icon: DefaultIcon,
    title: 'No posts yet',
    description: 'Get started by creating your first post.',
    action: {
      label: 'Create Post',
      onClick: () => alert('Create post clicked'),
    },
  },
};

export const WithCustomIcon: Story = {
  args: {
    icon: (
      <svg
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you are looking for.',
  },
};

export const NoDescription: Story = {
  args: {
    icon: DefaultIcon,
    title: 'Nothing here',
  },
};
