/**
 * File Parser Service
 * Lightweight and efficient parsers for CSV, JSON, and text files
 * with comprehensive error handling and field structure extraction
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
  error?: string;
  warnings?: string[];
}

export interface ParserOptions {
  maxRows?: number; // Limit rows for performance (default: 100)
  delimiter?: string; // CSV delimiter (default: auto-detect)
  encoding?: string; // File encoding (default: 'utf-8')
}

class FileParserService {
  private readonly DEFAULT_MAX_ROWS = 100;
  private readonly SAMPLE_SIZE = 10; // Number of rows to analyze for type detection

  /**
   * Parse a file based on its type
   */
  async parseFile(file: File, options: ParserOptions = {}): Promise<ParseResult> {
    try {
      const fileExtension = this.getFileExtension(file.name);
      const text = await this.readFileAsText(file);

      switch (fileExtension) {
        case 'csv':
          return this.parseCSV(text, options);
        case 'json':
          return this.parseJSON(text, options);
        case 'txt':
          return this.parseText(text, options);
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
   * Parse CSV file
   */
  private parseCSV(text: string, options: ParserOptions): ParseResult {
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

      // Auto-detect delimiter
      const delimiter = options.delimiter || this.detectCSVDelimiter(lines[0]);
      
      // Parse header row
      const headers = this.parseCSVRow(lines[0], delimiter);
      if (headers.length === 0) {
        return {
          success: false,
          fields: [],
          rowCount: 0,
          error: 'No headers found in CSV file'
        };
      }

      // Parse sample data rows for type detection
      const maxRows = Math.min(options.maxRows || this.DEFAULT_MAX_ROWS, lines.length - 1);
      const sampleRows: string[][] = [];
      
      for (let i = 1; i <= Math.min(this.SAMPLE_SIZE, maxRows); i++) {
        if (i < lines.length) {
          const row = this.parseCSVRow(lines[i], delimiter);
          if (row.length === headers.length) {
            sampleRows.push(row);
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
        rowCount: lines.length - 1, // Exclude header
        warnings: this.generateWarnings(fields, sampleRows.length, maxRows)
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
   * Parse JSON file
   */
  private parseJSON(text: string, options: ParserOptions): ParseResult {
    try {
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        // Handle single object - check if it contains nested arrays
        if (typeof data === 'object' && data !== null) {
          const nestedArrayResult = this.findNestedArrays(data);
          if (nestedArrayResult.found && nestedArrayResult.arrayData && nestedArrayResult.path) {
            return this.parseNestedJSONArray(nestedArrayResult.arrayData, nestedArrayResult.path, options, nestedArrayResult.allArrays);
          }
          return this.parseJSONObject(data);
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

      return this.parseJSONArray(data, options);

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
   * Parse a direct JSON array
   */
  private parseJSONArray(data: any[], options: ParserOptions): ParseResult {
    // Analyze first few objects to determine structure
    const maxRows = Math.min(options.maxRows || this.DEFAULT_MAX_ROWS, data.length);
    const sampleObjects = data.slice(0, Math.min(this.SAMPLE_SIZE, maxRows));
    
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

    return {
      success: true,
      fields,
      rowCount: data.length,
      warnings: this.generateWarnings(fields, sampleObjects.length, maxRows)
    };
  }

  /**
   * Parse nested JSON array with context about its location
   */
  private parseNestedJSONArray(data: any[], path: string, options: ParserOptions, allArrays?: Array<{path: string; data: any[]; count: number}>): ParseResult {
    const result = this.parseJSONArray(data, options);
    
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
  private parseJSONObject(obj: Record<string, any>): ParseResult {
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
      rowCount: 1
    };
  }

  /**
   * Parse text file (tab-delimited or space-delimited)
   */
  private parseText(text: string, options: ParserOptions): ParseResult {
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
      
      // Parse header row
      const headers = lines[0].split(delimiter).map(h => h.trim()).filter(h => h);
      if (headers.length === 0) {
        return {
          success: false,
          fields: [],
          rowCount: 0,
          error: 'No headers found in text file'
        };
      }

      // Parse sample data rows
      const maxRows = Math.min(options.maxRows || this.DEFAULT_MAX_ROWS, lines.length - 1);
      const sampleRows: string[][] = [];
      
             for (let i = 1; i <= Math.min(this.SAMPLE_SIZE, maxRows); i++) {
         if (i < lines.length) {
           const row = lines[i].split(delimiter).map(cell => cell.trim());
           if (row.length >= headers.length) {
             sampleRows.push(row);
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
        rowCount: lines.length - 1,
        warnings: this.generateWarnings(fields, sampleRows.length, maxRows)
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
   * Utility methods
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
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

  private parseCSVRow(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
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

  private generateWarnings(fields: ParsedField[], sampleSize: number, maxRows: number): string[] {
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

    return warnings;
  }
}

// Export singleton instance
export const fileParserService = new FileParserService(); 