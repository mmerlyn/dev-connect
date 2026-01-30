import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  title: 'UI/TextArea',
  component: TextArea,
  args: {
    placeholder: 'Write something...',
    rows: 4,
  },
};

export default meta;

type Story = StoryObj<typeof TextArea>;

// ── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {};

// ── With Label ──────────────────────────────────────────────────────────────
export const WithLabel: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
  },
};

// ── With Error ──────────────────────────────────────────────────────────────
export const WithError: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
    error: 'Bio is required.',
  },
};

// ── With Character Count ────────────────────────────────────────────────────
const CharacterCountTextArea = () => {
  const [value, setValue] = useState('Hello, this is a sample bio text.');

  return (
    <TextArea
      label="Bio"
      placeholder="Tell us about yourself..."
      maxLength={280}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

export const WithCharacterCount: Story = {
  render: () => <CharacterCountTextArea />,
};

// ── Disabled ────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  args: {
    label: 'Disabled field',
    placeholder: 'Cannot type here',
    disabled: true,
  },
};
