/**
 * SmartParse - High-performance streaming file parser
 * Supports CSV, JSON, and TXT files with progress tracking and error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import csv from '@fast-csv/parse';
import StreamValues from 'stream-json/streamers/StreamValues';
import { fileTypeFromFile } from 'file-type';
import winston from 'winston';

import {
  ParseResult,
  ParseOpts,
  ParseProgress,
  ParseError,
  ParseErrorCodes,
  ParsedRow,
  ParseStats
} from '../models/parse';

import {
  flattenRow,
  expandNestedLists,
  detectDataType,
  sanitizeFieldName,
  convertValue,
  validateRow
} from './transformers';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'parse-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'parse-combined.log' })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Main parsing function - detects file type and routes to appropriate parser
 */
export async function smartParse(
  filePath: string,
  opts: ParseOpts = {},
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  const startTime = Date.now();
  const stats: ParseStats = {
    totalRows: 0,
    validRows: 0,
    rejectedRows: 0,
    processingTime: 0
  };

  try {
    // Get file stats
    const fileStats = await fs.promises.stat(filePath);
    stats.fileSize = fileStats.size;

    // Check file size limits
    const maxSize = (opts.maxMemoryUsage || 512) * 1024 * 1024; // Convert MB to bytes
    if (fileStats.size > maxSize) {
      throw new ParseError(
        ParseErrorCodes.FILE_TOO_LARGE,
        `File size ${fileStats.size} bytes exceeds limit of ${maxSize} bytes`,
        { fileSize: fileStats.size, maxSize }
      );
    }

    onProgress?.({
      processed: 0,
      total: undefined,
      phase: 'detecting',
      currentFile: path.basename(filePath)
    });

    // Detect file type
    const fileType = await detectFileType(filePath);
    logger.info('Detected file type', { filePath, fileType });

    let result: ParseResult;

    switch (fileType) {
      case 'csv':
        result = await parseCsv(filePath, opts, onProgress);
        break;
      case 'json':
        result = await parseJson(filePath, opts, onProgress);
        break;
      case 'txt':
        result = await parseTxt(filePath, opts, onProgress);
        break;
      default:
        throw new ParseError(
          ParseErrorCodes.UNSUPPORTED_FORMAT,
          `Unsupported file type: ${fileType}`,
          { fileType, filePath }
        );
    }

    // Update final stats
    result.stats.processingTime = Date.now() - startTime;
    result.stats.fileSize = stats.fileSize;

    logger.info('Parse completed', {
      filePath,
      success: result.success,
      stats: result.stats
    });

    return result;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Parse failed', { filePath, error, processingTime });

    if (error instanceof ParseError) {
      return {
        success: false,
        data: [],
        errors: [error],
        warnings: [],
        stats: { ...stats, processingTime }
      };
    }

    return {
      success: false,
      data: [],
      errors: [new ParseError(
        ParseErrorCodes.IO_ERROR,
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )],
      warnings: [],
      stats: { ...stats, processingTime }
    };
  }
}

/**
 * Detect file type from extension and MIME type
 */
async function detectFileType(filePath: string): Promise<string> {
  // First try MIME detection
  try {
    const fileType = await fileTypeFromFile(filePath);
    if (fileType) {
      switch (fileType.mime) {
        case 'text/csv':
          return 'csv';
        case 'application/json':
          return 'json';
        case 'text/plain':
          return 'txt';
      }
    }
  } catch (error) {
    logger.warn('MIME detection failed, falling back to extension', { filePath, error });
  }

  // Fallback to extension-based detection
  const ext = path.extname(filePath).toLowerCase().slice(1);
  switch (ext) {
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    case 'txt':
    case 'tsv':
      return 'txt';
    default:
      throw new ParseError(
        ParseErrorCodes.UNSUPPORTED_FORMAT,
        `Unknown file extension: ${ext}`,
        { extension: ext, filePath }
      );
  }
}

/**
 * Parse CSV files using streaming
 */
async function parseCsv(
  filePath: string,
  opts: ParseOpts,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  const data: ParsedRow[] = [];
  const rejectRows: any[] = [];
  let headers: string[] = [];
  let rowCount = 0;
  const chunkSize = opts.chunkSize || 1000;
  const maxRows = opts.maxRows || Infinity;

  const stats: ParseStats = {
    totalRows: 0,
    validRows: 0,
    rejectedRows: 0,
    processingTime: 0
  };

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(csv.parse({ 
        headers: true,
        trim: true,
        maxRows: maxRows === Infinity ? undefined : maxRows
      }));

    stream.on('headers', (headerList: string[]) => {
      headers = headerList.map(h => sanitizeFieldName(h));
      onProgress?.({
        processed: 0,
        total: undefined,
        phase: 'parsing',
        currentFile: path.basename(filePath)
      });
    });

    stream.on('data', (row: any) => {
      try {
        rowCount++;
        stats.totalRows++;

        // Create sanitized row
        const sanitizedRow: ParsedRow = {};
        headers.forEach((header, index) => {
          const originalHeader = Object.keys(row)[index];
          sanitizedRow[header] = row[originalHeader];
        });

        // Apply transformations
        const flattenedRow = flattenRow(sanitizedRow);
        const expandedRows = expandNestedLists(flattenedRow, opts.mapping);

        // Validate and convert each expanded row
        for (const expandedRow of expandedRows) {
          const validation = validateRow(expandedRow, opts.expectedFields);
          
          if (validation.isValid) {
            // Convert values to appropriate types
            const convertedRow: ParsedRow = {};
            for (const [key, value] of Object.entries(expandedRow)) {
              const fieldType = detectDataType([value]);
              convertedRow[key] = convertValue(value, fieldType);
            }
            
            data.push(convertedRow);
            stats.validRows++;
          } else {
            rejectRows.push({
              row: expandedRow,
              errors: validation.errors,
              rowNumber: rowCount
            });
            stats.rejectedRows++;
            
            errors.push(new ParseError(
              ParseErrorCodes.VALIDATION_FAILED,
              `Row ${rowCount} validation failed: ${validation.errors.join(', ')}`,
              { row: expandedRow, errors: validation.errors },
              rowCount
            ));
          }
        }

        // Progress update
        if (rowCount % chunkSize === 0) {
          onProgress?.({
            processed: rowCount,
            total: undefined,
            phase: 'parsing',
            currentFile: path.basename(filePath)
          });

          // Force garbage collection if enabled
          if (opts.enableGarbageCollection && global.gc) {
            global.gc();
          }
        }

      } catch (error) {
        const parseError = new ParseError(
          ParseErrorCodes.CSV_ROW_INVALID,
          `Error parsing row ${rowCount}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
          rowCount
        );
        errors.push(parseError);
        stats.rejectedRows++;
      }
    });

    stream.on('end', async () => {
      try {
        onProgress?.({
          processed: rowCount,
          total: rowCount,
          phase: 'transforming',
          currentFile: path.basename(filePath)
        });

        // Write reject file if there are rejected rows
        let rejectFile: string | undefined;
        if (rejectRows.length > 0) {
          rejectFile = await writeRejectFile(filePath, rejectRows);
          warnings.push(`${rejectRows.length} rows rejected. See ${rejectFile}`);
        }

        // Generate field information
        const fields = headers.map(header => {
          const sampleValues = data.slice(0, 10).map(row => row[header]).filter(v => v != null);
          const dataType = detectDataType(sampleValues);
          
          return {
            name: header,
            type: dataType,
            sampleValue: sampleValues[0]
          };
        });

        resolve({
          success: errors.length === 0 || stats.validRows > 0,
          data,
          errors,
          warnings,
          rejectFile,
          stats,
          fields
        });

      } catch (error) {
        reject(error);
      }
    });

    stream.on('error', (error: Error) => {
      reject(new ParseError(
        ParseErrorCodes.CSV_ROW_INVALID,
        `CSV parsing error: ${error.message}`,
        error
      ));
    });
  });
}

/**
 * Parse JSON files using streaming
 */
async function parseJson(
  filePath: string,
  opts: ParseOpts,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  const data: ParsedRow[] = [];
  const rejectRows: any[] = [];
  let rowCount = 0;
  const chunkSize = opts.chunkSize || 1000;
  const maxRows = opts.maxRows || Infinity;

  const stats: ParseStats = {
    totalRows: 0,
    validRows: 0,
    rejectedRows: 0,
    processingTime: 0
  };

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(StreamValues.withParser());

    onProgress?.({
      processed: 0,
      total: undefined,
      phase: 'parsing',
      currentFile: path.basename(filePath)
    });

    stream.on('data', (chunk: any) => {
      try {
        const chunkValue = chunk.value;

        // Handle JSON arrays - process each element
        const items = Array.isArray(chunkValue) ? chunkValue : [chunkValue];

        for (const row of items) {
          if (rowCount >= maxRows) return;

          rowCount++;
          stats.totalRows++;

          // Apply transformations
          const flattenedRow = flattenRow(row);
          const expandedRows = expandNestedLists(flattenedRow, opts.mapping);

          // Validate and convert each expanded row
          for (const expandedRow of expandedRows) {
            const validation = validateRow(expandedRow, opts.expectedFields);

            if (validation.isValid) {
              // Convert values to appropriate types
              const convertedRow: ParsedRow = {};
              for (const [key, value] of Object.entries(expandedRow)) {
                const fieldType = detectDataType([value]);
                convertedRow[key] = convertValue(value, fieldType);
              }

              data.push(convertedRow);
              stats.validRows++;
            } else {
              rejectRows.push({
                row: expandedRow,
                errors: validation.errors,
                rowNumber: rowCount
              });
              stats.rejectedRows++;

              errors.push(new ParseError(
                ParseErrorCodes.VALIDATION_FAILED,
                `Row ${rowCount} validation failed: ${validation.errors.join(', ')}`,
                { row: expandedRow, errors: validation.errors },
                rowCount
              ));
            }
          }

          // Progress update
          if (rowCount % chunkSize === 0) {
            onProgress?.({
              processed: rowCount,
              total: undefined,
              phase: 'parsing',
              currentFile: path.basename(filePath)
            });

            // Force garbage collection if enabled
            if (opts.enableGarbageCollection && global.gc) {
              global.gc();
            }
          }
        }

      } catch (error) {
        const parseError = new ParseError(
          ParseErrorCodes.JSON_PARSE_ERROR,
          `Error parsing JSON row ${rowCount}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
          rowCount
        );
        errors.push(parseError);
        stats.rejectedRows++;
      }
    });

    stream.on('end', async () => {
      try {
        onProgress?.({
          processed: rowCount,
          total: rowCount,
          phase: 'transforming',
          currentFile: path.basename(filePath)
        });

        // Write reject file if there are rejected rows
        let rejectFile: string | undefined;
        if (rejectRows.length > 0) {
          rejectFile = await writeRejectFile(filePath, rejectRows);
          warnings.push(`${rejectRows.length} rows rejected. See ${rejectFile}`);
        }

        // Generate field information from sample data
        const fields = data.length > 0 ? generateFieldInfo(data.slice(0, 10)) : [];

        resolve({
          success: errors.length === 0 || stats.validRows > 0,
          data,
          errors,
          warnings,
          rejectFile,
          stats,
          fields
        });

      } catch (error) {
        reject(error);
      }
    });

    stream.on('error', (error: Error) => {
      reject(new ParseError(
        ParseErrorCodes.JSON_PARSE_ERROR,
        `JSON parsing error: ${error.message}`,
        error
      ));
    });
  });
}

/**
 * Parse text files (TSV, space-delimited, etc.)
 */
async function parseTxt(
  filePath: string,
  opts: ParseOpts,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  // For now, treat TXT files as TSV and use CSV parser with tab delimiter
  return parseCsv(filePath, { ...opts, delimiter: '\t' }, onProgress);
}

/**
 * Write rejected rows to a CSV file
 */
async function writeRejectFile(originalFilePath: string, rejectRows: any[]): Promise<string> {
  const dir = path.dirname(originalFilePath);
  const basename = path.basename(originalFilePath, path.extname(originalFilePath));
  const rejectFilePath = path.join(dir, `${basename}.rejects.csv`);

  const csvContent = [
    'Row Number,Error,Data',
    ...rejectRows.map(reject => 
      `${reject.rowNumber},"${reject.errors.join('; ')}","${JSON.stringify(reject.row).replace(/"/g, '""')}"`
    )
  ].join('\n');

  await fs.promises.writeFile(rejectFilePath, csvContent, 'utf8');
  return rejectFilePath;
}

/**
 * Generate field information from sample data
 */
function generateFieldInfo(sampleData: ParsedRow[]): Array<{ name: string; type: string; sampleValue?: unknown }> {
  if (sampleData.length === 0) return [];

  const allKeys = new Set<string>();
  sampleData.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });

  return Array.from(allKeys).map(key => {
    const sampleValues = sampleData.map(row => row[key]).filter(v => v != null);
    const dataType = detectDataType(sampleValues);
    
    return {
      name: key,
      type: dataType,
      sampleValue: sampleValues[0]
    };
  });
} 