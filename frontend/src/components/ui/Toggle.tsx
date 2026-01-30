import { cn } from './lib/utils';

type ToggleSize = 'sm' | 'md';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: ToggleSize;
  disabled?: boolean;
  className?: string;
}

const trackSizeClasses: Record<ToggleSize, string> = {
  sm: 'w-9 h-5',
  md: 'w-11 h-6',
};

const knobSizeClasses: Record<ToggleSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

const knobTranslateClasses: Record<ToggleSize, string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
};

export function Toggle({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  className,
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={cn('flex items-start', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          trackSizeClasses[size],
          checked ? 'bg-blue-600' : 'bg-gray-200',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            knobSizeClasses[size],
            checked ? knobTranslateClasses[size] : 'translate-x-0',
          )}
        />
      </button>

      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span
              className={cn(
                'text-sm font-medium text-gray-900',
                disabled && 'opacity-50',
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <p
              className={cn(
                'text-sm text-gray-500',
                disabled && 'opacity-50',
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
