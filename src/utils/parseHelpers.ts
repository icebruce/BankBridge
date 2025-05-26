import { ParseResult, ParsedRow, ParseOpts } from '../models/parse';

/**
 * Common parsing configurations for different use cases
 */
export const ParsePresets = {
  /** Fast parsing for small files */
  FAST: {
    chunkSize: 500,
    maxMemoryUsage: 256,
    enableGarbageCollection: false
  } as ParseOpts,

  /** Balanced parsing for medium files */
  BALANCED: {
    chunkSize: 1000,
    maxMemoryUsage: 512,
    enableGarbageCollection: true
  } as ParseOpts,

  /** Memory-efficient parsing for large files */
  LARGE_FILE: {
    chunkSize: 2000,
    maxMemoryUsage: 1024,
    enableGarbageCollection: true
  } as ParseOpts,

  /** Import template parsing with validation */
  IMPORT_TEMPLATE: {
    chunkSize: 1000,
    maxMemoryUsage: 512,
    enableGarbageCollection: true,
    maxRows: 100000 // Reasonable limit for template data
  } as ParseOpts,

  /** Export template parsing */
  EXPORT_TEMPLATE: {
    chunkSize: 500,
    maxMemoryUsage: 256,
    enableGarbageCollection: false,
    maxRows: 50000 // Templates usually smaller
  } as ParseOpts
};

/**
 * Extract specific columns from parsed data
 */
export function extractColumns(data: ParsedRow[], columnNames: string[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};
  
  columnNames.forEach(columnName => {
    result[columnName] = data.map(row => row[columnName]);
  });
  
  return result;
}

/**
 * Filter parsed data based on conditions
 */
export function filterRows(
  data: ParsedRow[], 
  conditions: Record<string, (value: unknown) => boolean>
): ParsedRow[] {
  return data.filter(row => {
    return Object.entries(conditions).every(([column, condition]) => {
      return condition(row[column]);
    });
  });
}

/**
 * Group parsed data by a specific column
 */
export function groupByColumn(data: ParsedRow[], columnName: string): Record<string, ParsedRow[]> {
  const groups: Record<string, ParsedRow[]> = {};
  
  data.forEach(row => {
    const value = row[columnName];
    const key = value !== null && value !== undefined ? String(value) : 'undefined';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });
  
  return groups;
}

/**
 * Calculate statistics for numeric columns
 */
export function calculateColumnStats(data: ParsedRow[], columnName: string): {
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  nullCount: number;
} {
  const values = data
    .map(row => row[columnName])
    .filter(value => value !== null && value !== undefined);
  
  const numericValues = values
    .map(value => Number(value))
    .filter(value => !isNaN(value));
  
  if (numericValues.length === 0) {
    return {
      count: 0,
      sum: 0,
      average: 0,
      min: 0,
      max: 0,
      nullCount: data.length
    };
  }
  
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  
  return {
    count: numericValues.length,
    sum,
    average: sum / numericValues.length,
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    nullCount: data.length - values.length
  };
}

/**
 * Validate that parsed data has required columns
 */
export function validateRequiredColumns(
  result: ParseResult, 
  requiredColumns: string[]
): { isValid: boolean; missingColumns: string[] } {
  if (!result.success || !result.data || result.data.length === 0) {
    return { isValid: false, missingColumns: requiredColumns };
  }
  
  const firstRow = result.data[0];
  const availableColumns = Object.keys(firstRow);
  const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns
  };
}

/**
 * Convert parsed data to CSV format
 */
export function convertToCSV(data: ParsedRow[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or quote
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Convert parsed data to JSON format
 */
export function convertToJSON(data: ParsedRow[], pretty = false): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Sample data for preview (returns first N rows)
 */
export function sampleData(data: ParsedRow[], sampleSize = 10): ParsedRow[] {
  return data.slice(0, sampleSize);
}

/**
 * Get unique values for a column
 */
export function getUniqueValues(data: ParsedRow[], columnName: string): unknown[] {
  const values = data.map(row => row[columnName]);
  return Array.from(new Set(values));
}

/**
 * Detect column data types from sample data
 */
export function detectColumnTypes(data: ParsedRow[]): Record<string, string> {
  if (data.length === 0) return {};
  
  const columnTypes: Record<string, string> = {};
  const headers = Object.keys(data[0]);
  
  headers.forEach(header => {
    const sampleValues = data.slice(0, 100).map(row => row[header]);
    columnTypes[header] = detectDataType(sampleValues);
  });
  
  return columnTypes;
}

/**
 * Simple data type detection
 */
function detectDataType(values: unknown[]): string {
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  if (nonNullValues.length === 0) return 'text';
  
  const stringValues = nonNullValues.map(v => String(v).trim()).filter(v => v !== '');
  if (stringValues.length === 0) return 'text';
  
  // Check for boolean
  const booleanPattern = /^(true|false|yes|no|y|n|1|0)$/i;
  if (stringValues.every(v => booleanPattern.test(v))) {
    return 'boolean';
  }
  
  // Check for numbers
  if (stringValues.every(v => !isNaN(Number(v.replace(/[,\s]/g, ''))))) {
    return 'number';
  }
  
  // Check for dates
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
  ];
  
  if (stringValues.some(v => datePatterns.some(pattern => pattern.test(v)))) {
    return 'date';
  }
  
  return 'text';
}

/**
 * Format parse result summary for display
 */
export function formatParseResultSummary(result: ParseResult): string {
  const { stats } = result;
  const successRate = stats.totalRows > 0 ? (stats.validRows / stats.totalRows * 100).toFixed(1) : '0';
  
  return [
    `Parsed ${stats.totalRows} rows in ${(stats.processingTime / 1000).toFixed(2)}s`,
    `Success rate: ${successRate}% (${stats.validRows} valid, ${stats.rejectedRows} rejected)`,
    result.warnings.length > 0 ? `Warnings: ${result.warnings.length}` : null,
    result.errors.length > 0 ? `Errors: ${result.errors.length}` : null
  ].filter(Boolean).join(' | ');
} 