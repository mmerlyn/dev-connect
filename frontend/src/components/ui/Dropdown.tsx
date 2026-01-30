import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { cn } from './lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ---- Close on outside click ----
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // ---- Focus management ----
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < itemRefs.current.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // ---- Keyboard navigation ----
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isOpen) {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % items.length);
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        }
        case 'Enter': {
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            items[focusedIndex].onClick();
            setIsOpen(false);
            setFocusedIndex(-1);
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        }
      }
    },
    [isOpen, focusedIndex, items],
  );

  // ---- Toggle ----
  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setFocusedIndex(-1);
      return next;
    });
  };

  // ---- Render ----
  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute mt-2 min-w-[12rem] z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
                setFocusedIndex(-1);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                item.divider && 'border-t border-gray-200',
                focusedIndex === index && 'bg-gray-100',
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
