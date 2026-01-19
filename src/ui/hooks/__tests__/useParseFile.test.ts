import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useParseFile } from '../useParseFile';

describe('useParseFile', () => {
  const mockInvoke = vi.fn();
  const mockOn = vi.fn();
  const mockOff = vi.fn();

  const setupElectronMock = () => {
    (window as any).electron = {
      invoke: mockInvoke,
      on: mockOn,
      off: mockOff
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupElectronMock();
  });

  afterEach(() => {
    // Don't delete electron - keep it for cleanup
  });

  describe('Initial State', () => {
    it('should have initial state', () => {
      const { result } = renderHook(() => useParseFile());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBeNull();
    });

    it('should return parse function', () => {
      const { result } = renderHook(() => useParseFile());

      expect(typeof result.current.parse).toBe('function');
    });

    it('should return clearError function', () => {
      const { result } = renderHook(() => useParseFile());

      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Progress Listener', () => {
    it('should set up progress listener on mount', () => {
      renderHook(() => useParseFile());

      expect(mockOn).toHaveBeenCalledWith('parse-progress', expect.any(Function));
    });

    it('should clean up progress listener on unmount', () => {
      const { unmount } = renderHook(() => useParseFile());

      unmount();

      expect(mockOff).toHaveBeenCalledWith('parse-progress', expect.any(Function));
    });
  });

  describe('Parse Function', () => {
    it('should parse file successfully', async () => {
      const mockResult = {
        success: true,
        data: [{ col1: 'value1' }],
        stats: { totalRows: 1, validRows: 1, rejectedRows: 0 }
      };
      mockInvoke.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useParseFile());

      let parseResult: any;
      await act(async () => {
        parseResult = await result.current.parse('/path/to/file.csv');
      });

      expect(mockInvoke).toHaveBeenCalledWith('parse-file', '/path/to/file.csv', {});
      expect(parseResult).toEqual(mockResult);
    });

    it('should set loading state during parse', async () => {
      const mockResult = { success: true, data: [], stats: { totalRows: 0 } };
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      mockInvoke.mockReturnValue(promise);

      const { result } = renderHook(() => useParseFile());

      act(() => {
        result.current.parse('/path/to/file.csv');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(mockResult);
        await promise;
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set error on parse failure', async () => {
      mockInvoke.mockRejectedValue(new Error('Parse failed'));

      const { result } = renderHook(() => useParseFile());

      await act(async () => {
        try {
          await result.current.parse('/path/to/file.csv');
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Parse failed');
    });

    it('should handle unknown error type', async () => {
      mockInvoke.mockRejectedValue('string error');

      const { result } = renderHook(() => useParseFile());

      await act(async () => {
        try {
          await result.current.parse('/path/to/file.csv');
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Unknown error occurred');
    });

    it('should pass options to invoke', async () => {
      const mockResult = { success: true, data: [], stats: { totalRows: 0 } };
      mockInvoke.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useParseFile());

      await act(async () => {
        await result.current.parse('/path/to/file.csv', { delimiter: ';' });
      });

      expect(mockInvoke).toHaveBeenCalledWith('parse-file', '/path/to/file.csv', { delimiter: ';' });
    });

    it('should update progress after successful parse', async () => {
      const mockResult = {
        success: true,
        data: [{ col1: 'value1' }],
        stats: { totalRows: 10, validRows: 10, rejectedRows: 0 }
      };
      mockInvoke.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useParseFile());

      await act(async () => {
        await result.current.parse('/path/to/file.csv');
      });

      expect(result.current.progress).toEqual({
        processed: 10,
        total: 10,
        phase: 'transforming',
        currentFile: 'file.csv'
      });
    });

    it('should throw error when electron is not available', async () => {
      // Temporarily remove electron
      const originalElectron = (window as any).electron;
      delete (window as any).electron;

      const { result, unmount } = renderHook(() => useParseFile());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.parse('/path/to/file.csv');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Electron API not available');

      // Restore before unmount to prevent cleanup error
      (window as any).electron = originalElectron;
      unmount();
    });
  });

  describe('Clear Error', () => {
    it('should clear error when called', async () => {
      mockInvoke.mockRejectedValue(new Error('Parse failed'));

      const { result } = renderHook(() => useParseFile());

      await act(async () => {
        try {
          await result.current.parse('/path/to/file.csv');
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Parse failed');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
