import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import { ToastContainer, useToast } from '../Toast';

describe('ToastContainer', () => {
  it('returns null when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders provided toasts', () => {
    const toasts = [
      { id: 1, message: 'Success message', type: 'success' as const },
      { id: 2, message: 'Error message', type: 'error' as const }
    ];
    render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('calls onRemove when dismiss button is clicked', async () => {
    const onRemove = vi.fn();
    const toasts = [{ id: 42, message: 'Dismissable', type: 'info' as const }];
    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(onRemove).toHaveBeenCalledWith(42);
  });
});

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds toast with showToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('success', 'Test message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it.each([
    ['showSuccess', 'success'],
    ['showError', 'error'],
    ['showWarning', 'warning'],
    ['showInfo', 'info']
  ] as const)('%s adds %s toast', (method, expectedType) => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current[method]('Test');
    });

    expect(result.current.toasts[0].type).toBe(expectedType);
  });

  it('removes toast with removeToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('success', 'Test');
    });
    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-removes toast after duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('success', 'Auto-remove');
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
