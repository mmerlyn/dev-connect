import { useState, useCallback, createContext, useContext, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './lib/utils';

// ---------------------------------------------------------------------------
// Alert (inline variant)
// ---------------------------------------------------------------------------

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: ReactNode }> = {
  success: {
    container: 'border-l-green-500 bg-green-50 text-green-800',
    icon: (
      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    container: 'border-l-red-500 bg-red-50 text-red-800',
    icon: (
      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    container: 'border-l-yellow-500 bg-yellow-50 text-yellow-800',
    icon: (
      <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.58 14.86A1 1 0 002.58 20h18.84a1 1 0 00.87-1.28l-8.58-14.86a1 1 0 00-1.42 0z" />
      </svg>
    ),
  },
  info: {
    container: 'border-l-blue-500 bg-blue-50 text-blue-800',
    icon: (
      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
  },
};

export const Alert = ({ variant, title, message, onClose, className }: AlertProps) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 border-l-4 rounded-r-lg p-4',
        styles.container,
        className
      )}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">{styles.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm mt-1 opacity-90">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-auto opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Toast system (context + portal)
// ---------------------------------------------------------------------------

interface ToastItem {
  id: string;
  variant: AlertVariant;
  title: string;
  message: string;
}

interface ToastContextValue {
  showToast: (variant: AlertVariant, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: AlertVariant, title: string, message: string) => {
      const id = String(++counterRef.current);
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <ToastEntry key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// Individual toast entry that auto-dismisses
interface ToastEntryProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

const ToastEntry = ({ toast, onRemove }: ToastEntryProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className="pointer-events-auto animate-slide-in-right">
      <Alert
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        onClose={() => onRemove(toast.id)}
        className="shadow-lg"
      />
    </div>
  );
};
