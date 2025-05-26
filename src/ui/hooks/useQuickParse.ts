import { useCallback } from 'react';
import { ParseOpts, ParseResult } from '../../models/parse';

// Extended electron API interface for this hook
interface ExtendedElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
}

export interface UseQuickParseReturn {
  /** Parse a file by path */
  parseFile: (filePath: string, opts?: ParseOpts) => Promise<ParseResult>;
  /** Open file dialog and parse selected file */
  parseFromDialog: (opts?: ParseOpts & { 
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<ParseResult | null>;
  /** Parse multiple files */
  parseMultipleFiles: (filePaths: string[], opts?: ParseOpts) => Promise<ParseResult[]>;
}

/**
 * Simplified hook for quick file parsing operations
 * Use this when you need programmatic parsing without UI components
 */
export function useQuickParse(): UseQuickParseReturn {
  
  const parseFile = useCallback(async (filePath: string, opts: ParseOpts = {}): Promise<ParseResult> => {
    if (!window.electron) {
      throw new Error('Electron API not available');
    }

    try {
      const result = await window.electron.invoke('parse-file', filePath, opts);
      return result;
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const parseFromDialog = useCallback(async (opts: ParseOpts & { 
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  } = {}): Promise<ParseResult | null> => {
    if (!window.electron) {
      throw new Error('Electron API not available');
    }

    try {
      // Open file dialog
      const electronAPI = window.electron as ExtendedElectronAPI;
      const { canceled, filePaths } = await electronAPI.showOpenDialog({
        title: opts.title || 'Select file to parse',
        filters: opts.filters || [
          { name: 'Data Files', extensions: ['csv', 'json', 'txt'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (canceled || filePaths.length === 0) {
        return null;
      }

      // Parse the selected file
      const { title, filters, ...parseOpts } = opts;
      return await parseFile(filePaths[0], parseOpts);
    } catch (error) {
      throw new Error(`Failed to parse from dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [parseFile]);

  const parseMultipleFiles = useCallback(async (filePaths: string[], opts: ParseOpts = {}): Promise<ParseResult[]> => {
    const results: ParseResult[] = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await parseFile(filePath, opts);
        results.push(result);
      } catch (error) {
        // Create error result for failed files
        results.push({
          success: false,
          data: [],
          errors: [{
            name: 'ParseError',
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'IO_ERROR'
          } as any],
          warnings: [],
          stats: {
            totalRows: 0,
            validRows: 0,
            rejectedRows: 0,
            processingTime: 0
          }
        });
      }
    }

    return results;
  }, [parseFile]);

  return {
    parseFile,
    parseFromDialog,
    parseMultipleFiles
  };
} 