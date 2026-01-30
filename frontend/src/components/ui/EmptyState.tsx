import type { ReactNode } from 'react';
import { cn } from './lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12',
        className,
      )}
    >
      {icon && (
        <div className="text-gray-400 mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-medium text-gray-900 text-lg">{title}</h3>
      {description && (
        <p className="text-gray-500 mt-1 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
