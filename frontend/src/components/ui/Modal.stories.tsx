import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ModalDemo({
  size,
  title,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        onClick={() => setIsOpen(true)}
      >
        Open Modal
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title ?? 'Modal Title'}
        size={size}
      >
        <p className="text-sm text-gray-600">
          This is the modal body content. You can put any React elements here.
          Press Escape or click the overlay to close.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => setIsOpen(false)}
          >
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
}

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const SmallModal: Story = {
  render: () => <ModalDemo size="sm" title="Small Modal" />,
};

export const LargeModal: Story = {
  render: () => <ModalDemo size="lg" title="Large Modal" />,
};
