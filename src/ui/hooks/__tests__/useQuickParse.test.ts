import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuickParse } from '../useQuickParse';

describe('useQuickParse', () => {
  const mockInvoke = vi.fn();
  const mockShowOpenDialog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.electron
    (window as any).electron = {
      invoke: mockInvoke,
      showOpenDialog: mockShowOpenDialog
    };
  });

  afterEach(() => {
    delete (window as any).electron;
  });

  describe('Initial State', () => {
    it('should return parseFile function', () => {
      const { result } = renderHook(() => useQuickParse());

      expect(typeof result.current.parseFile).toBe('function');
    });

    it('should return parseFromDialog function', () => {
      const { result } = renderHook(() => useQuickParse());

      expect(typeof result.current.parseFromDialog).toBe('function');
    });

    it('should return parseMultipleFiles function', () => {
      const { result } = renderHook(() => useQuickParse());

      expect(typeof result.current.parseMultipleFiles).toBe('function');
    });
  });

  describe('parseFile', () => {
    it('should parse file successfully', async () => {
      const mockResult = {
        success: true,
        data: [{ col1: 'value1' }],
        errors: [],
        warnings: [],
        stats: { totalRows: 1 }
      };
      mockInvoke.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useQuickParse());

      let parseResult: any;
      await act(async () => {
        parseResult = await result.current.parseFile('/path/to/file.csv');
      });

      expect(mockInvoke).toHaveBeenCalledWith('parse-file', '/path/to/file.csv', {});
      expect(parseResult).toEqual(mockResult);
    });

    it('should pass options to invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, data: [] });

      const { result } = renderHook(() => useQuickParse());

      await act(async () => {
        await result.current.parseFile('/path/to/file.csv', { delimiter: ';' });
      });

      expect(mockInvoke).toHaveBeenCalledWith('parse-file', '/path/to/file.csv', { delimiter: ';' });
    });

    it('should throw error on parse failure', async () => {
      mockInvoke.mockRejectedValue(new Error('Parse failed'));

      const { result } = renderHook(() => useQuickParse());

      await expect(
        act(async () => {
          await result.current.parseFile('/path/to/file.csv');
        })
      ).rejects.toThrow('Failed to parse file: Parse failed');
    });

    it('should handle unknown error type', async () => {
      mockInvoke.mockRejectedValue('string error');

      const { result } = renderHook(() => useQuickParse());

      await expect(
        act(async () => {
          await result.current.parseFile('/path/to/file.csv');
        })
      ).rejects.toThrow('Failed to parse file: Unknown error');
    });

    it('should throw error when electron is not available', async () => {
      delete (window as any).electron;

      const { result } = renderHook(() => useQuickParse());

      await expect(
        act(async () => {
          await result.current.parseFile('/path/to/file.csv');
        })
      ).rejects.toThrow('Electron API not available');
    });
  });

  describe('parseFromDialog', () => {
    it('should open dialog and parse selected file', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/selected.csv']
      });
      mockInvoke.mockResolvedValue({ success: true, data: [] });

      const { result } = renderHook(() => useQuickParse());

      await act(async () => {
        await result.current.parseFromDialog();
      });

      expect(mockShowOpenDialog).toHaveBeenCalledWith({
        title: 'Select file to parse',
        filters: expect.arrayContaining([
          expect.objectContaining({ name: 'Data Files' }),
          expect.objectContaining({ name: 'CSV Files' })
        ]),
        properties: ['openFile']
      });
      expect(mockInvoke).toHaveBeenCalledWith('parse-file', '/path/to/selected.csv', {});
    });

    it('should use custom title and filters', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.csv']
      });
      mockInvoke.mockResolvedValue({ success: true, data: [] });

      const { result } = renderHook(() => useQuickParse());

      await act(async () => {
        await result.current.parseFromDialog({
          title: 'Custom Title',
          filters: [{ name: 'Custom', extensions: ['xyz'] }]
        });
      });

      expect(mockShowOpenDialog).toHaveBeenCalledWith({
        title: 'Custom Title',
        filters: [{ name: 'Custom', extensions: ['xyz'] }],
        properties: ['openFile']
      });
    });

    it('should return null when dialog is canceled', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: []
      });

      const { result } = renderHook(() => useQuickParse());

      let parseResult: any;
      await act(async () => {
        parseResult = await result.current.parseFromDialog();
      });

      expect(parseResult).toBeNull();
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should return null when no files selected', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: []
      });

      const { result } = renderHook(() => useQuickParse());

      let parseResult: any;
      await act(async () => {
        parseResult = await result.current.parseFromDialog();
      });

      expect(parseResult).toBeNull();
    });

    it('should throw error when electron is not available', async () => {
      delete (window as any).electron;

      const { result } = renderHook(() => useQuickParse());

      await expect(
        act(async () => {
          await result.current.parseFromDialog();
        })
      ).rejects.toThrow('Electron API not available');
    });

    it('should throw error on dialog failure', async () => {
      mockShowOpenDialog.mockRejectedValue(new Error('Dialog failed'));

      const { result } = renderHook(() => useQuickParse());

      await expect(
        act(async () => {
          await result.current.parseFromDialog();
        })
      ).rejects.toThrow('Failed to parse from dialog: Dialog failed');
    });

    it('should pass parse options to parseFile', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.csv']
      });
      mockInvoke.mockResolvedValue({ success: true, data: [] });

      const { result } = renderHook(() => useQuickParse());

      await act(async () => {
        await result.current.parseFromDialog({
          title: 'Select',
          delimiter: ';',
          skipRows: 1
        });
      });

      // Should pass parse options but not title/filters
      expect(mockInvoke).toHaveBeenCalledWith('parse-file', '/path/to/file.csv', {
        delimiter: ';',
        skipRows: 1
      });
    });
  });

  describe('parseMultipleFiles', () => {
    it('should parse multiple files', async () => {
      mockInvoke
        .mockResolvedValueOnce({ success: true, data: [{ a: 1 }] })
        .mockResolvedValueOnce({ success: true, data: [{ b: 2 }] });

      const { result } = renderHook(() => useQuickParse());

      let results: any[];
      await act(async () => {
        results = await result.current.parseMultipleFiles(['/path/file1.csv', '/path/file2.csv']);
      });

      expect(results!.length).toBe(2);
      expect(results![0]).toEqual({ success: true, data: [{ a: 1 }] });
      expect(results![1]).toEqual({ success: true, data: [{ b: 2 }] });
    });

    it('should handle errors for individual files', async () => {
      mockInvoke
        .mockResolvedValueOnce({ success: true, data: [{ a: 1 }] })
        .mockRejectedValueOnce(new Error('File 2 failed'));

      const { result } = renderHook(() => useQuickParse());

      let results: any[];
      await act(async () => {
        results = await result.current.parseMultipleFiles(['/path/file1.csv', '/path/file2.csv']);
      });

      expect(results!.length).toBe(2);
      expect(results![0].success).toBe(true);
      expect(results![1].success).toBe(false);
      expect(results![1].errors[0].message).toContain('File 2 failed');
    });

    it('should pass options to each file parse', async () => {
      mockInvoke.mockResolvedValue({ success: true, data: [] });

      const { result } = renderHook(() => useQuickParse());

      await act(async () => {
        await result.current.parseMultipleFiles(
          ['/path/file1.csv', '/path/file2.csv'],
          { delimiter: ';' }
        );
      });

      expect(mockInvoke).toHaveBeenNthCalledWith(1, 'parse-file', '/path/file1.csv', { delimiter: ';' });
      expect(mockInvoke).toHaveBeenNthCalledWith(2, 'parse-file', '/path/file2.csv', { delimiter: ';' });
    });

    it('should return empty array for empty file list', async () => {
      const { result } = renderHook(() => useQuickParse());

      let results: any[];
      await act(async () => {
        results = await result.current.parseMultipleFiles([]);
      });

      expect(results!).toEqual([]);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should create error result with proper structure', async () => {
      mockInvoke.mockRejectedValue(new Error('Parse error'));

      const { result } = renderHook(() => useQuickParse());

      let results: any[];
      await act(async () => {
        results = await result.current.parseMultipleFiles(['/path/file.csv']);
      });

      expect(results![0]).toEqual({
        success: false,
        data: [],
        errors: [expect.objectContaining({
          name: 'ParseError',
          code: 'IO_ERROR'
        })],
        warnings: [],
        stats: {
          totalRows: 0,
          validRows: 0,
          rejectedRows: 0,
          processingTime: 0
        }
      });
    });
  });
});
