/**
 * Enhanced File Parser Service
 * Lightweight and efficient parsers for CSV, JSON, and text files
 * with comprehensive error handling, encoding support, and field structure extraction
 */

export interface ParsedField {
  name: string;
  dataType: 'Text' | 'Number' | 'Date' | 'Currency' | 'Boolean';
  sampleValue: string;
  confidence: number; // 0-1 confidence in data type detection
}

export interface ParseResult {
  success: boolean;
  fields: ParsedField[];
  rowCount: number;
  previewRows?: string[][]; // First 50 rows for preview
  error?: string;
  warnings?: string[];
  detectedEncoding?: string;
  detectedDelimiter?: string;
  hasHeader?: boolean;
  hasQuotedFields?: boolean;
  hasBOM?: boolean;
}

export interface ParserOptions {
  maxRows?: number; // Limit rows for performance (default: 100)
  delimiter?: string; // CSV delimiter (default: auto-detect)
  encoding?: string; // File encoding (default: 'utf-8')
  hasHeader?: boolean; // Whether file has header row (default: auto-detect)
  maxPreviewRows?: number; // Number of preview rows (default: 50)
}

class FileParserService {
  private readonly DEFAULT_MAX_ROWS = 100;
  private readonly DEFAULT_MAX_PREVIEW_ROWS = 50;
  private readonly SAMPLE_SIZE = 10; // Number of rows to analyze for type detection

  /**
   * Parse a file based on its type
   */
  async parseFile(file: File, options: ParserOptions = {}): Promise<ParseResult> {
    try {
      const fileExtension = this.getFileExtension(file.name);
      const { text, encoding: _encoding, hasBOM } = await this.readFileWithEncoding(file, options.encoding);

      switch (fileExtension) {
        case 'csv':
          return this.parseCSV(text, options, hasBOM);
        case 'json':
          return this.parseJSON(text, options, hasBOM);
        case 'txt':
          return this.parseText(text, options, hasBOM);
        default:
          return {
            success: false,
            fields: [],
            rowCount: 0,
            error: `Unsupported file type: ${fileExtension}`
          };
      }
    } catch (error) {
      return {
        success: false,
        fields: [],
        rowCount: 0,
        error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse CSV file with enhanced features
   */
  private parseCSV(text: string, options: ParserOptions, hasBOM: boolean): ParseResult {
    try {
      // Normalize line endings (Windows \r\n and old Mac \r to Unix \n)
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Split into logical rows (respecting quoted multi-line fields)
      const lines = this.splitCSVIntoRows(normalizedText).filter(line => line.trim());
      if (lines.length === 0) {
        return {
          success: false,
          fields: [],
          rowCount: 0,
          error: 'File is empty'
        };
      }

      // Auto-detect delimiter if not specified
      const delimiter = options.delimiter || this.detectCSVDelimiter(lines[0]);
      
      // Auto-detect header row if not specified
      const hasHeader = options.hasHeader !== undefined ? options.hasHeader : this.detectHeaderRow(lines, delimiter);
      
      // Check for quoted fields
      const hasQuotedFields = this.detectQuotedFields(lines, delimiter);
      
      // Parse header row
      const headers = hasHeader ? this.parseCSVRow(lines[0], delimiter) : this.generateDefaultHeaders(lines, delimiter);
      
      if (headers.length === 0) {
        return {
          success: false,
          fields: [],
          rowCount: 0,
          error: 'No valid columns found in CSV file'
        };
      }

      // Parse data rows (skip header if present)
      const dataStartIndex = hasHeader ? 1 : 0;
      const maxRows = Math.min(options.maxRows || this.DEFAULT_MAX_ROWS, lines.length - dataStartIndex);
      const maxPreviewRows = Math.min(options.maxPreviewRows || this.DEFAULT_MAX_PREVIEW_ROWS, maxRows);
      
      const sampleRows: string[][] = [];
      const previewRows: string[][] = [];
      
      for (let i = dataStartIndex; i < dataStartIndex + maxRows; i++) {
        if (i < lines.length) {
          const row = this.parseCSVRow(lines[i], delimiter);
          if (row.length === headers.length) {
            sampleRows.push(row);
            if (previewRows.length < maxPreviewRows) {
              previewRows.push(row);
            }
          }
        }
      }

      // Generate field information
      const fields: ParsedField[] = headers.map((header, index) => {
        const sampleValues = sampleRows.map(row => row[index] || '').filter(val => val.trim());
        const sampleValue = sampleValues[0] || '';
        const dataType = this.detectDataType(sampleValues);
        
        return {
          name: header.trim() || `Column_${index + 1}`,
          dataType,
          sampleValue,
          confidence: this.calculateTypeConfidence(sampleValues, dataType)
        };
      });

      return {
        success: true,
        fields,
        rowCount: lines.length - dataStartIndex,
        previewRows: hasHeader ? [headers, ...previewRows] : previewRows,
        detectedDelimiter: delimiter,
        hasHeader,
        hasQuotedFields,
        hasBOM,
        warnings: this.generateWarnings(fields, sampleRows.length, maxRows, hasHeader)
      };

    } catch (error) {
      return {
        success: false,
        fields: [],
        rowCount: 0,
        error: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse JSON file with enhanced features
   */
  private parseJSON(text: string, options: ParserOptions, hasBOM: boolean): ParseResult {
    try {
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        // Handle single object - check if it contains nested arrays
        if (typeof data === 'object' && data !== null) {
          const nestedArrayResult = this.findNestedArrays(data);
          if (nestedArrayResult.found && nestedArrayResult.arrayData && nestedArrayResult.path) {
            return this.parseNestedJSONArray(nestedArrayResult.arrayData, nestedArrayResult.path, options, nestedArrayResult.allArrays, hasBOM);
          }
          return this.parseJSONObject(data, hasBOM);
        } else {
          return {
            success: false,
            fields: [],
            rowCount: 0,
            error: 'JSON must contain an array of objects or a single object'
          };
        }
      }

      if (data.length === 0) {
        return {
          success: false,
          fields: [],
          rowCount: 0,
          error: 'JSON array is empty'
        };
      }

      return this.parseJSONArray(data, options, hasBOM);

    } catch (error) {
      return {
        success: false,
        fields: [],
        rowCount: 0,
        error: `JSON parsing error: ${error instanceof Error ? error.message : 'Invalid JSON format'}`
      };
    }
  }

  /**
   * Parse a direct JSON array with preview
   */
  private parseJSONArray(data: any[], options: ParserOptions, hasBOM: boolean): ParseResult {
    // Analyze first few objects to determine structure
    const maxRows = Math.min(options.maxRows || this.DEFAULT_MAX_ROWS, data.length);
    const maxPreviewRows = Math.min(options.maxPreviewRows || this.DEFAULT_MAX_PREVIEW_ROWS, maxRows);
    const sampleObjects = data.slice(0, Math.min(this.SAMPLE_SIZE, maxRows));
    const previewObjects = data.slice(0, maxPreviewRows);
    
    // Collect all unique keys
    const allKeys = new Set<string>();
    sampleObjects.forEach(obj => {
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => allKeys.add(key));
      }
    });

    // Generate field information
    const fields: ParsedField[] = Array.from(allKeys).map(key => {
      const sampleValues = sampleObjects
        .map(obj => obj[key])
        .filter(val => val !== undefined && val !== null)
        .map(val => this.flattenValue(val));
      
      const sampleValue = sampleValues[0] || '';
      const dataType = this.detectDataType(sampleValues);
      
      return {
        name: key,
        dataType,
        sampleValue,
        confidence: this.calculateTypeConfidence(sampleValues, dataType)
      };
    });

    // Generate preview rows
    const previewRows = previewObjects.map(obj => {
      return Array.from(allKeys).map(key => {
        const value = obj[key];
        return value !== undefined && value !== null ? this.flattenValue(value) : '';
      });
    });

    return {
      success: true,
      fields,
      rowCount: data.length,
      previewRows: [Array.from(allKeys), ...previewRows],
      hasBOM,
      warnings: this.generateWarnings(fields, sampleObjects.length, maxRows, false)
    };
  }

  /**
   * Parse nested JSON array with context about its location
   */
  private parseNestedJSONArray(data: any[], path: string, options: ParserOptions, allArrays?: Array<{path: string; data: any[]; count: number}>, hasBOM?: boolean): ParseResult {
    const result = this.parseJSONArray(data, options, hasBOM || false);
    
    if (result.success) {
      // Add warning about nested structure
      const warnings = result.warnings || [];
      warnings.unshift(`Found nested array at path: "${path}" with ${data.length} records. Using this array for field mapping.`);
      
      // If there were multiple arrays, mention them
      if (allArrays && allArrays.length > 1) {
        const otherArrays = allArrays.filter(arr => arr.path !== path);
        if (otherArrays.length > 0) {
          const otherPaths = otherArrays.map(arr => `"${arr.path}" (${arr.count} items)`).join(', ');
          warnings.push(`Other arrays found but not used: ${otherPaths}`);
        }
      }
      
      return {
        ...result,
        warnings
      };
    }
    
    return result;
  }

  /**
   * Find nested arrays in JSON object
   */
  private findNestedArrays(obj: any, currentPath: string = ''): { found: boolean; arrayData?: any[]; path?: string; allArrays?: Array<{path: string; data: any[]; count: number}> } {
    const allArrays: Array<{path: string; data: any[]; count: number}> = [];
    
    const searchArrays = (searchObj: any, searchPath: string = '') => {
      if (Array.isArray(searchObj) && searchObj.length > 0) {
        // Check if array contains objects (not primitives)
        const firstItem = searchObj[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          allArrays.push({
            path: searchPath || 'root',
            data: searchObj,
            count: searchObj.length
          });
        }
      }
      
      if (typeof searchObj === 'object' && searchObj !== null && !Array.isArray(searchObj)) {
        // Look for arrays in object properties
        for (const [key, value] of Object.entries(searchObj)) {
          const newPath = searchPath ? `${searchPath}.${key}` : key;
          searchArrays(value, newPath);
        }
      }
    };
    
    searchArrays(obj, currentPath);
    
    if (allArrays.length === 0) {
      return { found: false };
    }
    
    // Sort by array size (largest first) and prefer arrays with more meaningful names
    allArrays.sort((a, b) => {
      // Prefer arrays with names that suggest data (list, data, items, records, etc.)
      const dataKeywords = ['list', 'data', 'items', 'records', 'transactions', 'entries', 'results'];
      const aHasDataKeyword = dataKeywords.some(keyword => a.path.toLowerCase().includes(keyword));
      const bHasDataKeyword = dataKeywords.some(keyword => b.path.toLowerCase().includes(keyword));
      
      if (aHasDataKeyword && !bHasDataKeyword) return -1;
      if (!aHasDataKeyword && bHasDataKeyword) return 1;
      
      // Then sort by size
      return b.count - a.count;
    });
    
    const bestArray = allArrays[0];
    
    return {
      found: true,
      arrayData: bestArray.data,
      path: bestArray.path,
      allArrays
    };
  }

  /**
   * Flatten complex values to strings for display
   */
  private flattenValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (Array.isArray(value)) {
      // For arrays, show first few items
      const preview = value.slice(0, 3).map(item => String(item)).join(', ');
      return value.length > 3 ? `${preview}...` : preview;
    }
    
    if (typeof value === 'object') {
      // For objects, show key-value pairs
      const entries = Object.entries(value).slice(0, 2);
      const preview = entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
      return Object.keys(value).length > 2 ? `${preview}...` : preview;
    }
    
    return String(value);
  }

  /**
   * Parse single JSON object
   */
  private parseJSONObject(obj: Record<string, any>, hasBOM: boolean): ParseResult {
    const fields: ParsedField[] = Object.entries(obj).map(([key, value]) => {
      const sampleValue = String(value);
      const dataType = this.detectDataType([sampleValue]);
      
      return {
        name: key,
        dataType,
        sampleValue,
        confidence: 1.0 // Single value, full confidence
      };
    });

    return {
      success: true,
      fields,
      rowCount: 1,
      previewRows: [Object.keys(obj), Object.values(obj).map(v => this.flattenValue(v))],
      hasBOM
    };
  }

  /**
   * Parse text file (tab-delimited or space-delimited) with enhanced features
   */
  private parseText(text: string, options: ParserOptions, hasBOM: boolean): ParseResult {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return {
          success: false,
          fields: [],
          rowCount: 0,
          error: 'File is empty'
        };
      }

      // Auto-detect delimiter (tab or multiple spaces)
      const delimiter = this.detectTextDelimiter(lines[0]);
      
      // Auto-detect header row
      const hasHeader = options.hasHeader !== undefined ? options.hasHeader : this.detectHeaderRow(lines, delimiter);
      
      // Parse header row
      const headers = hasHeader ? lines[0].split(delimiter).map(h => h.trim()).filter(h => h) : this.generateDefaultHeaders(lines, delimiter);
      
      if (headers.length === 0) {
        return {
          success: false,
          fields: [],
          rowCount: 0,
          error: 'No valid columns found in text file'
        };
      }

      // Parse data rows
      const dataStartIndex = hasHeader ? 1 : 0;
      const maxRows = Math.min(options.maxRows || this.DEFAULT_MAX_ROWS, lines.length - dataStartIndex);
      const maxPreviewRows = Math.min(options.maxPreviewRows || this.DEFAULT_MAX_PREVIEW_ROWS, maxRows);
      
      const sampleRows: string[][] = [];
      const previewRows: string[][] = [];
      
      for (let i = dataStartIndex; i < dataStartIndex + maxRows; i++) {
        if (i < lines.length) {
          const row = lines[i].split(delimiter).map(cell => cell.trim());
          if (row.length >= headers.length) {
            sampleRows.push(row);
            if (previewRows.length < maxPreviewRows) {
              previewRows.push(row);
            }
          }
        }
      }

      // Generate field information
      const fields: ParsedField[] = headers.map((header, index) => {
        const sampleValues = sampleRows.map(row => row[index] || '').filter(val => val.trim());
        const sampleValue = sampleValues[0] || '';
        const dataType = this.detectDataType(sampleValues);
        
        return {
          name: header || `Column_${index + 1}`,
          dataType,
          sampleValue,
          confidence: this.calculateTypeConfidence(sampleValues, dataType)
        };
      });

      return {
        success: true,
        fields,
        rowCount: lines.length - dataStartIndex,
        previewRows: hasHeader ? [headers, ...previewRows] : previewRows,
        detectedDelimiter: typeof delimiter === 'string' ? delimiter : 'space',
        hasHeader,
        hasBOM,
        warnings: this.generateWarnings(fields, sampleRows.length, maxRows, hasHeader)
      };

    } catch (error) {
      return {
        success: false,
        fields: [],
        rowCount: 0,
        error: `Text parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Enhanced utility methods
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private async readFileWithEncoding(file: File, preferredEncoding?: string): Promise<{ text: string; encoding: string; hasBOM: boolean }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const result = reader.result as ArrayBuffer;
          const { text, encoding, hasBOM } = this.detectEncodingAndDecode(result, preferredEncoding);
          resolve({ text, encoding, hasBOM });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private detectEncodingAndDecode(buffer: ArrayBuffer, preferredEncoding?: string): { text: string; encoding: string; hasBOM: boolean } {
    const uint8Array = new Uint8Array(buffer);
    let encoding = preferredEncoding || 'utf-8';
    let hasBOM = false;
    let startIndex = 0;

    // Check for BOM (Byte Order Mark)
    if (uint8Array.length >= 3) {
      // UTF-8 BOM: EF BB BF
      if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
        encoding = 'utf-8';
        hasBOM = true;
        startIndex = 3;
      }
      // UTF-16 LE BOM: FF FE
      else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
        encoding = 'utf-16le';
        hasBOM = true;
        startIndex = 2;
      }
      // UTF-16 BE BOM: FE FF
      else if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
        encoding = 'utf-16be';
        hasBOM = true;
        startIndex = 2;
      }
    }

    // Decode the text
    let text: string;
    if (encoding === 'utf-16le' || encoding === 'utf-16be') {
      const uint16Array = new Uint16Array(buffer.slice(startIndex));
      if (encoding === 'utf-16be') {
        // Swap byte order for big-endian
        for (let i = 0; i < uint16Array.length; i++) {
          uint16Array[i] = ((uint16Array[i] & 0xFF) << 8) | ((uint16Array[i] & 0xFF00) >> 8);
        }
      }
      text = String.fromCharCode.apply(null, Array.from(uint16Array));
    } else {
      const decoder = new TextDecoder(encoding);
      text = decoder.decode(buffer.slice(startIndex));
    }

    return { text, encoding, hasBOM };
  }

  private detectCSVDelimiter(line: string): string {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let bestDelimiter = ',';

    delimiters.forEach(delimiter => {
      const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });

    return bestDelimiter;
  }

  private detectTextDelimiter(line: string): string | RegExp {
    if (line.includes('\t')) return '\t';
    if (line.includes('  ')) return /\s{2,}/; // Multiple spaces
    return /\s+/; // Single or multiple spaces
  }

  private detectHeaderRow(lines: string[], delimiter: string | RegExp): boolean {
    if (lines.length < 2) return false;
    
    const firstRow = this.splitRow(lines[0], delimiter);
    const secondRow = this.splitRow(lines[1], delimiter);
    
    // More sophisticated header detection
    const firstRowTextRatio = this.calculateTextRatio(firstRow);
    const secondRowTextRatio = this.calculateTextRatio(secondRow);
    
    // Check for common header patterns
    const hasHeaderPatterns = firstRow.some(cell => {
      const trimmed = cell.trim().toLowerCase();
      // Common header patterns
      return trimmed.includes('name') || 
             trimmed.includes('email') || 
             trimmed.includes('phone') || 
             trimmed.includes('date') || 
             trimmed.includes('amount') || 
             trimmed.includes('id') || 
             trimmed.includes('address') ||
             trimmed.includes('city') ||
             trimmed.includes('state') ||
             trimmed.includes('zip') ||
             trimmed.includes('country') ||
             trimmed.includes('transaction') ||
             trimmed.includes('description') ||
             trimmed.includes('category') ||
             trimmed.includes('account') ||
             trimmed.includes('balance') ||
             trimmed.includes('currency') ||
             trimmed.includes('type') ||
             trimmed.includes('status');
    });
    
    // Check if first row has more text-like content than second row
    const textRatioComparison = firstRowTextRatio > secondRowTextRatio;
    
    // Check if first row has fewer empty cells than second row
    const firstRowNonEmpty = firstRow.filter(cell => cell.trim()).length;
    const secondRowNonEmpty = secondRow.filter(cell => cell.trim()).length;
    const nonEmptyComparison = firstRowNonEmpty >= secondRowNonEmpty;
    
    // Check if first row has consistent cell content (all text or all short)
    const firstRowConsistent = firstRow.every(cell => {
      const trimmed = cell.trim();
      return trimmed.length <= 30 && !/^\d+$/.test(trimmed);
    });
    
    // Additional check: if first row contains mostly short, descriptive text and second row contains data
    const firstRowLooksLikeHeaders = firstRow.every(cell => {
      const trimmed = cell.trim();
      // Headers are usually short, descriptive, and don't contain numbers or special characters
      return trimmed.length > 0 && 
             trimmed.length <= 50 && 
             !/^\d+$/.test(trimmed) && 
             !/^\d+\.\d+$/.test(trimmed) &&
             !trimmed.includes('@') && // Not email addresses
             !trimmed.includes('http') && // Not URLs
             !trimmed.includes('www.') && // Not URLs
             !trimmed.includes('.com') && // Not URLs
             !trimmed.includes('.org') && // Not URLs
             !trimmed.includes('.net'); // Not URLs
    });
    
    // Multiple criteria for header detection
    const criteria = [
      hasHeaderPatterns,           // Contains common header words
      textRatioComparison,         // First row is more text-like
      nonEmptyComparison,          // First row has fewer empty cells
      firstRowConsistent,          // First row has consistent, reasonable-length content
      firstRowLooksLikeHeaders     // First row looks like typical CSV headers
    ];
    
    // Require at least 3 out of 5 criteria to be true for more reliable detection
    const trueCriteria = criteria.filter(Boolean).length;
    const result = trueCriteria >= 3;

    return result;
  }

  private detectQuotedFields(lines: string[], _delimiter: string): boolean {
    // Check first few lines for quoted fields
    const checkLines = Math.min(5, lines.length);
    for (let i = 0; i < checkLines; i++) {
      if (lines[i].includes('"')) {
        return true;
      }
    }
    return false;
  }

  private generateDefaultHeaders(lines: string[], delimiter: string | RegExp): string[] {
    const firstRow = this.splitRow(lines[0], delimiter);
    return firstRow.map((_, index) => `Column_${index + 1}`);
  }

  private splitRow(line: string, delimiter: string | RegExp): string[] {
    if (typeof delimiter === 'string') {
      return line.split(delimiter).map(cell => cell.trim());
    } else {
      return line.split(delimiter).map(cell => cell.trim());
    }
  }

  private calculateTextRatio(cells: string[]): number {
    if (cells.length === 0) return 0;
    
    let textCells = 0;
    let totalCells = 0;
    
    cells.forEach(cell => {
      if (cell.trim()) {
        totalCells++;
        // Check if cell looks like text (not just numbers)
        if (!/^\d+$/.test(cell.trim()) && !/^\d+\.\d+$/.test(cell.trim())) {
          textCells++;
        }
      }
    });
    
    return totalCells > 0 ? textCells / totalCells : 0;
  }

  /**
   * Split CSV text into logical rows, respecting quoted multi-line fields.
   * This handles the RFC 4180 case where a quoted field can contain newlines.
   */
  private splitCSVIntoRows(text: string): string[] {
    const rows: string[] = [];
    let currentRow = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '"') {
        // Check for escaped quote (doubled quote "")
        if (inQuotes && text[i + 1] === '"') {
          // Add both quotes to current row (will be unescaped later in parseCSVRow)
          currentRow += '""';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          currentRow += char;
        }
      } else if (char === '\n' && !inQuotes) {
        // End of logical row (only when not inside quotes)
        rows.push(currentRow);
        currentRow = '';
      } else {
        currentRow += char;
      }
    }

    // Don't forget the last row (if file doesn't end with newline)
    if (currentRow) {
      rows.push(currentRow);
    }

    return rows;
  }

  /**
   * Parse a single CSV row into fields, handling quoted fields and escaped quotes.
   * Escaped quotes (doubled quotes "") are converted to single quotes.
   */
  private parseCSVRow(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote ("") - add single quote to result
          current += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state (don't add the quote char to result)
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }



  private detectDataType(values: string[]): 'Text' | 'Number' | 'Date' | 'Currency' | 'Boolean' {
    if (values.length === 0) return 'Text';

    const nonEmptyValues = values.filter(v => v.trim());
    if (nonEmptyValues.length === 0) return 'Text';

    // Check for boolean
    const booleanPattern = /^(true|false|yes|no|y|n|1|0)$/i;
    if (nonEmptyValues.every(v => booleanPattern.test(v))) {
      return 'Boolean';
    }

    // Check for currency
    const currencyPattern = /^[\$€£¥]?[\d,]+\.?\d*$/;
    if (nonEmptyValues.every(v => currencyPattern.test(v.replace(/[\s$€£¥,]/g, '')))) {
      return 'Currency';
    }

    // Check for numbers
    const numberPattern = /^-?[\d,]+\.?\d*$/;
    if (nonEmptyValues.every(v => numberPattern.test(v.replace(/[,\s]/g, '')))) {
      return 'Number';
    }

    // Check for dates
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/ // M/D/YY or MM/DD/YYYY
    ];
    
    if (nonEmptyValues.some(v => datePatterns.some(pattern => pattern.test(v)))) {
      return 'Date';
    }

    return 'Text';
  }

  private calculateTypeConfidence(values: string[], detectedType: string): number {
    if (values.length === 0) return 0;

    const nonEmptyValues = values.filter(v => v.trim());
    if (nonEmptyValues.length === 0) return 0;

    let matches = 0;
    
    nonEmptyValues.forEach(value => {
      switch (detectedType) {
        case 'Number':
          if (/^-?[\d,]+\.?\d*$/.test(value.replace(/[,\s]/g, ''))) matches++;
          break;
        case 'Boolean':
          if (/^(true|false|yes|no|y|n|1|0)$/i.test(value)) matches++;
          break;
        case 'Currency':
          if (/^[\$€£¥]?[\d,]+\.?\d*$/.test(value.replace(/[\s$€£¥,]/g, ''))) matches++;
          break;
        case 'Date':
          const datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/,
            /^\d{2}\/\d{2}\/\d{4}$/,
            /^\d{2}-\d{2}-\d{4}$/,
            /^\d{1,2}\/\d{1,2}\/\d{2,4}$/
          ];
          if (datePatterns.some(pattern => pattern.test(value))) matches++;
          break;
        default:
          matches++; // Text always matches
      }
    });

    return matches / nonEmptyValues.length;
  }

  private generateWarnings(fields: ParsedField[], sampleSize: number, maxRows: number, hasHeader: boolean): string[] {
    const warnings: string[] = [];

    // Low confidence warnings
    const lowConfidenceFields = fields.filter(f => f.confidence < 0.7);
    if (lowConfidenceFields.length > 0) {
      warnings.push(`Low confidence in data type detection for: ${lowConfidenceFields.map(f => f.name).join(', ')}`);
    }

    // Sample size warning
    if (sampleSize < maxRows) {
      warnings.push(`Analysis based on ${sampleSize} sample rows. Full file may contain different data patterns.`);
    }

    // Empty fields warning
    const emptyFields = fields.filter(f => !f.sampleValue);
    if (emptyFields.length > 0) {
      warnings.push(`No sample data found for: ${emptyFields.map(f => f.name).join(', ')}`);
    }

    // Header detection warning
    if (hasHeader === undefined) {
      warnings.push('Header row detection was automatic. Verify this is correct for your file.');
    }

    return warnings;
  }

  /**
   * Parse raw CSV content string into columns and data rows.
   * Handles multi-line quoted fields, escaped quotes, and various line endings.
   * Use this when you have CSV content as a string (e.g., from Electron API).
   */
  parseCSVContent(content: string, options: { delimiter?: string; hasHeader?: boolean } = {}): {
    columns: string[];
    data: Record<string, string>[];
  } {
    // Normalize line endings
    const normalizedText = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split into logical rows (respecting quoted multi-line fields)
    const lines = this.splitCSVIntoRows(normalizedText).filter(line => line.trim());

    if (lines.length === 0) {
      return { columns: [], data: [] };
    }

    // Auto-detect delimiter if not specified
    const delimiter = options.delimiter || this.detectCSVDelimiter(lines[0]);

    // Parse header row
    const columns = this.parseCSVRow(lines[0], delimiter);

    // Parse data rows
    const data = lines.slice(1).map(line => {
      const values = this.parseCSVRow(line, delimiter);
      return columns.reduce((obj, col, i) => {
        obj[col] = values[i] || '';
        return obj;
      }, {} as Record<string, string>);
    });

    return { columns, data };
  }

  /**
   * Parse file content (CSV or JSON) into columns and data rows.
   * Unified method that auto-detects file type from extension and returns
   * consistent { columns, data } format for processing.
   *
   * For JSON files, automatically finds nested arrays (e.g., transactionList)
   * and flattens object values to strings.
   */
  parseFileContent(content: string, fileName: string): {
    columns: string[];
    data: Record<string, string>[];
  } {
    const extension = this.getFileExtension(fileName);

    switch (extension) {
      case 'json':
        return this.parseJSONContent(content);
      case 'csv':
      case 'txt':
      default:
        return this.parseCSVContent(content);
    }
  }

  /**
   * Parse JSON content string into columns and data rows.
   * Finds nested arrays (like transactionList) and converts to tabular format.
   */
  private parseJSONContent(content: string): {
    columns: string[];
    data: Record<string, string>[];
  } {
    try {
      const parsed = JSON.parse(content);

      // Find the array of data (could be root array or nested like transactionList)
      let dataArray: any[];

      if (Array.isArray(parsed)) {
        dataArray = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Look for nested arrays
        const nestedResult = this.findNestedArrays(parsed);
        if (nestedResult.found && nestedResult.arrayData) {
          dataArray = nestedResult.arrayData;
        } else {
          // Single object - treat as single row
          dataArray = [parsed];
        }
      } else {
        return { columns: [], data: [] };
      }

      if (dataArray.length === 0) {
        return { columns: [], data: [] };
      }

      // Collect all unique keys from all objects
      const allKeys = new Set<string>();
      dataArray.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => allKeys.add(key));
        }
      });

      const columns = Array.from(allKeys);

      // Convert each object to a Record<string, string>
      const data = dataArray.map(obj => {
        const row: Record<string, string> = {};
        for (const col of columns) {
          const value = obj[col];
          row[col] = this.flattenValue(value);
        }
        return row;
      });

      return { columns, data };

    } catch (error) {
      // Invalid JSON - return empty
      return { columns: [], data: [] };
    }
  }
}

// Export singleton instance
export const fileParserService = new FileParserService(); 