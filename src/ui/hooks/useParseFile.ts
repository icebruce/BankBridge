import { useState, useEffect, useCallback } from 'react';
import { ParseOpts, ParseResult, ParseProgress } from '../../models/parse';

// Declare electron API for TypeScript
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      off: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export interface UseParseFileReturn {
  parse: (filePath: string, opts?: ParseOpts) => Promise<ParseResult>;
  progress: ParseProgress | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * React hook for parsing files with progress tracking
 */
export function useParseFile(): UseParseFileReturn {
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress event handler
  const handleProgress = useCallback((progressData: ParseProgress) => {
    setProgress(progressData);
  }, []);

  // Set up progress listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.on('parse-progress', handleProgress);
      
      return () => {
        window.electron.off('parse-progress', handleProgress);
      };
    }
  }, [handleProgress]);

  // Parse function
  const parse = useCallback(async (filePath: string, opts: ParseOpts = {}): Promise<ParseResult> => {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      if (!window.electron) {
        throw new Error('Electron API not available');
      }

      const result = await window.electron.invoke('parse-file', filePath, opts);
      
      // Final progress update
      setProgress({
        processed: result.stats.totalRows,
        total: result.stats.totalRows,
        phase: 'transforming',
        currentFile: filePath.split(/[/\\]/).pop() || filePath
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    parse,
    progress,
    isLoading,
    error,
    clearError
  };
} 