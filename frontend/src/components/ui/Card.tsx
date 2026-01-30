import type { ReactNode } from 'react';
import { cn } from './lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  padding?: Padding;
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
}

interface CardSectionProps {
  className?: string;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Padding map (applied to Body only when Card‑level padding is set)
// ---------------------------------------------------------------------------

const paddingMap: Record<Padding, string> = {
  none: 'p-0',
  sm: 'px-4 py-3',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
};

// ---------------------------------------------------------------------------
// Sub‑components
// ---------------------------------------------------------------------------

function CardHeader({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}
CardHeader.displayName = 'Card.Header';

function CardBody({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}
CardBody.displayName = 'Card.Body';

function CardFooter({ className, children }: CardSectionProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg',
        className,
      )}
    >
      {children}
    </div>
  );
}
CardFooter.displayName = 'Card.Footer';

// ---------------------------------------------------------------------------
// Card root
// ---------------------------------------------------------------------------

function CardRoot({ padding = 'md', hoverable = false, className, children }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow border border-gray-200',
        hoverable && 'hover:shadow-md transition-shadow',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
CardRoot.displayName = 'Card';

// ---------------------------------------------------------------------------
// Compound component via Object.assign
// ---------------------------------------------------------------------------

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
