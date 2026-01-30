import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput';

const meta: Meta<typeof SearchInput> = {
  title: 'UI/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

function SearchInputControlled(props: Partial<React.ComponentProps<typeof SearchInput>>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <SearchInput
      value={value}
      onChange={setValue}
      placeholder="Search..."
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <SearchInputControlled onSearch={(v) => console.log('Search:', v)} />,
};

export const WithValue: Story = {
  render: () => (
    <SearchInputControlled
      value="React hooks"
      onSearch={(v) => console.log('Search:', v)}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <SearchInputControlled
      value="typescript"
      loading={true}
      onSearch={(v) => console.log('Search:', v)}
    />
  ),
};

export const WithPlaceholder: Story = {
  render: () => (
    <SearchInputControlled
      placeholder="Search developers, posts, topics..."
      onSearch={(v) => console.log('Search:', v)}
    />
  ),
};
