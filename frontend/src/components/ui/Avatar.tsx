import { useState } from 'react';
import { cn } from './lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  fallback?: string;
  online?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeClasses: Record<AvatarSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
};

const indicatorSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-1.5 w-1.5 border',
  sm: 'h-2 w-2 border',
  md: 'h-2.5 w-2.5 border-2',
  lg: 'h-3 w-3 border-2',
  xl: 'h-4 w-4 border-2',
};

export function Avatar({
  src,
  alt = '',
  size = 'md',
  fallback = '',
  online,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;

  const initials = fallback
    ? fallback.slice(0, 2).toUpperCase()
    : alt
      ? alt
          .split(' ')
          .map((word) => word[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?';

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden',
          sizeClasses[size],
          !showImage && 'bg-blue-500 text-white',
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className={cn(
              'font-medium leading-none select-none',
              textSizeClasses[size],
            )}
          >
            {initials}
          </span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full border-white',
            online ? 'bg-green-500' : 'bg-gray-400',
            indicatorSizeClasses[size],
          )}
        />
      )}
    </div>
  );
}
