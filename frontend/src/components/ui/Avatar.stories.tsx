import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    online: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=avatar-default',
    alt: 'John Doe',
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar
        src="https://i.pravatar.cc/150?u=avatar-xs"
        alt="User"
        size="xs"
      />
      <Avatar
        src="https://i.pravatar.cc/150?u=avatar-sm"
        alt="User"
        size="sm"
      />
      <Avatar
        src="https://i.pravatar.cc/150?u=avatar-md"
        alt="User"
        size="md"
      />
      <Avatar
        src="https://i.pravatar.cc/150?u=avatar-lg"
        alt="User"
        size="lg"
      />
      <Avatar
        src="https://i.pravatar.cc/150?u=avatar-xl"
        alt="User"
        size="xl"
      />
    </div>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar fallback="JD" size="sm" alt="John Doe" />
      <Avatar fallback="AB" size="md" alt="Alice Brown" />
      <Avatar fallback="MK" size="lg" alt="Mary King" />
      <Avatar fallback="ZW" size="xl" alt="Zack White" />
    </div>
  ),
};

export const OnlineIndicator: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar
        src="https://i.pravatar.cc/150?u=online-1"
        alt="Online User"
        size="sm"
        online={true}
      />
      <Avatar
        src="https://i.pravatar.cc/150?u=online-2"
        alt="Offline User"
        size="md"
        online={false}
      />
      <Avatar
        src="https://i.pravatar.cc/150?u=online-3"
        alt="Online User"
        size="lg"
        online={true}
      />
      <Avatar
        src="https://i.pravatar.cc/150?u=online-4"
        alt="Online User"
        size="xl"
        online={true}
      />
    </div>
  ),
};

export const NoImage: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar alt="John Doe" size="sm" />
      <Avatar alt="Alice Brown" size="md" />
      <Avatar alt="Mary King" size="lg" />
      <Avatar size="xl" />
    </div>
  ),
};
