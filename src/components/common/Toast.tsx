import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faExclamationCircle, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

// Toast styling based on DESIGN_GUIDE.md Status Messages
const TOAST_STYLES: Record<ToastType, { bg: string; border: string; text: string; icon: typeof faCheck }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: faCheck,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: faExclamationCircle,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: faExclamationTriangle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: faInfoCircle,
  },
};

/**
 * ToastContainer - Fixed-position toast notification container
 *
 * Renders toasts in the top-right corner using createPortal.
 * Follows DESIGN_GUIDE.md Status Messages color palette.
 */
export const ToastContainer: FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const styles = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${styles.bg} ${styles.border} animate-slide-in`}
            style={{
              animation: 'slideIn 0.2s ease-out'
            }}
          >
            <FontAwesomeIcon
              icon={styles.icon}
              className={`w-4 h-4 flex-shrink-0 ${styles.text}`}
            />
            <span className={`text-sm font-medium flex-1 ${styles.text}`}>{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors ${styles.text}`}
              title="Dismiss"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};

// Toast animation styles - inject once into document
const TOAST_ANIMATION_STYLES = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

/**
 * useToast - Hook for managing toast notifications
 *
 * Usage:
 * ```tsx
 * const { toasts, showToast, removeToast } = useToast();
 *
 * // Show different toast types
 * showToast('success', 'File saved successfully');
 * showToast('error', 'Failed to load data');
 * showToast('warning', 'Some items were skipped');
 * showToast('info', 'Processing in progress...');
 *
 * // Render the container
 * <ToastContainer toasts={toasts} onRemove={removeToast} />
 * ```
 */
export function useToast(autoRemoveMs: number = 4000) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Inject animation styles once
  useEffect(() => {
    const styleId = 'toast-animation-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = TOAST_ANIMATION_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  // Remove a toast by id
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auto-remove toasts after specified duration
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map(toast =>
      setTimeout(() => removeToast(toast.id), autoRemoveMs)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [toasts, removeToast, autoRemoveMs]);

  // Show a new toast
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Convenience methods for each toast type
  const showSuccess = useCallback((message: string) => showToast('success', message), [showToast]);
  const showError = useCallback((message: string) => showToast('error', message), [showToast]);
  const showWarning = useCallback((message: string) => showToast('warning', message), [showToast]);
  const showInfo = useCallback((message: string) => showToast('info', message), [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

export default ToastContainer;
