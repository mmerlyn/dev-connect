import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

function ToggleControlled(props: Partial<React.ComponentProps<typeof Toggle>>) {
  const [checked, setChecked] = useState(props.checked ?? false);
  return <Toggle checked={checked} onChange={setChecked} {...props} />;
}

export const Default: Story = {
  render: () => <ToggleControlled label="Enable notifications" />,
};

export const Checked: Story = {
  render: () => <ToggleControlled checked={true} label="Enable notifications" />,
};

export const WithDescription: Story = {
  render: () => (
    <ToggleControlled
      label="Email notifications"
      description="Receive email notifications when someone comments on your posts."
    />
  ),
};

export const Small: Story = {
  render: () => (
    <ToggleControlled size="sm" label="Dark mode" />
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ToggleControlled disabled={true} label="Disabled off" />
      <ToggleControlled disabled={true} checked={true} label="Disabled on" />
    </div>
  ),
};
