export type ParseProgress = { 
  processed: number; 
  total?: number;
  phase: 'detecting' | 'parsing' | 'validating' | 'transforming';
  currentFile?: string;
  estimatedTimeRemaining?: number;
};

export interface ParseOpts {
  expectedFields?: Record<string, unknown>;     // for zod schema builder
  mapping?: Record<
    string,
    { type: 'scalar' | 'array'; explode?: boolean }
  >;
  chunkSize?: number; // For streaming (default: 1000)
  maxMemoryUsage?: number; // Memory limit in MB (default: 512)
  enableGarbageCollection?: boolean; // Force GC periodically
  maxRows?: number; // Limit total rows processed
  delimiter?: string; // CSV delimiter (for TXT files)
}

export interface ParsedRow {
  [key: string]: unknown;
}

export interface ParseStats {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  processingTime: number;
  memoryUsed?: number;
  fileSize?: number;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedRow[];
  errors: ParseError[];
  warnings: string[];
  rejectFile?: string; // Path to reject file
  stats: ParseStats;
  fields?: Array<{
    name: string;
    type: string;
    sampleValue?: unknown;
  }>;
}

export class ParseError extends Error {
  constructor(
    public code: string, 
    message: string,
    public meta?: unknown,
    public row?: number,
    public column?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export const ParseErrorCodes = {
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  SCHEMA_MISMATCH: 'SCHEMA_MISMATCH',
  CSV_ROW_INVALID: 'CSV_ROW_INVALID',
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  TRANSFORM_ERROR: 'TRANSFORM_ERROR',
  IO_ERROR: 'IO_ERROR'
} as const;

export type ParseErrorCode = typeof ParseErrorCodes[keyof typeof ParseErrorCodes]; 