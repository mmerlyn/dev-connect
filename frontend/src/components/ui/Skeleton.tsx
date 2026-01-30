import { cn } from './lib/utils';

type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
}

const SkeletonLine = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn('animate-pulse bg-gray-200 rounded h-4', className)}
    style={style}
  />
);

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) => {
  if (variant === 'circular') {
    return (
      <div
        className={cn(
          'animate-pulse bg-gray-200 rounded-full',
          !width && !height && 'h-10 w-10',
          className
        )}
        style={{
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cn(
          'animate-pulse bg-gray-200 rounded-lg',
          !width && 'w-full',
          !height && 'h-20',
          className
        )}
        style={{
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        }}
      />
    );
  }

  // text variant
  if (lines <= 1) {
    return (
      <SkeletonLine
        className={cn(!width && 'w-full', className)}
        style={{
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        }}
      />
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={cn(
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
          style={height ? { height } : undefined}
        />
      ))}
    </div>
  );
};
