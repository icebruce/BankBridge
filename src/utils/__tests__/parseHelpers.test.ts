import { describe, it, expect } from 'vitest';
import {
  ParsePresets,
  extractColumns,
  filterRows,
  groupByColumn,
  calculateColumnStats,
  validateRequiredColumns,
  convertToCSV,
  convertToJSON,
  sampleData,
  getUniqueValues,
  detectColumnTypes,
  formatParseResultSummary
} from '../parseHelpers';
import { ParseResult } from '../../models/parse';

describe('parseHelpers', () => {
  const sampleData1 = [
    { name: 'John', age: 30, salary: 50000, active: true },
    { name: 'Jane', age: 25, salary: 45000, active: false },
    { name: 'Bob', age: 35, salary: 60000, active: true }
  ];

  describe('ParsePresets', () => {
    it('should have all required presets', () => {
      expect(ParsePresets.FAST).toBeDefined();
      expect(ParsePresets.BALANCED).toBeDefined();
      expect(ParsePresets.LARGE_FILE).toBeDefined();
      expect(ParsePresets.IMPORT_TEMPLATE).toBeDefined();
      expect(ParsePresets.EXPORT_TEMPLATE).toBeDefined();
    });

    it('should have correct chunk sizes', () => {
      expect(ParsePresets.FAST.chunkSize).toBe(500);
      expect(ParsePresets.BALANCED.chunkSize).toBe(1000);
      expect(ParsePresets.LARGE_FILE.chunkSize).toBe(2000);
    });
  });

  describe('extractColumns', () => {
    it('should extract specified columns', () => {
      const result = extractColumns(sampleData1, ['name', 'age']);
      
      expect(result).toEqual({
        name: ['John', 'Jane', 'Bob'],
        age: [30, 25, 35]
      });
    });

    it('should handle missing columns', () => {
      const result = extractColumns(sampleData1, ['name', 'missing']);
      
      expect(result).toEqual({
        name: ['John', 'Jane', 'Bob'],
        missing: [undefined, undefined, undefined]
      });
    });
  });

  describe('filterRows', () => {
    it('should filter rows based on conditions', () => {
      const result = filterRows(sampleData1, {
        age: (value) => Number(value) > 30,
        active: (value) => value === true
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });

    it('should return all rows when no conditions match', () => {
      const result = filterRows(sampleData1, {
        age: (value) => Number(value) > 100
      });
      
      expect(result).toHaveLength(0);
    });
  });

  describe('groupByColumn', () => {
    it('should group rows by column value', () => {
      const result = groupByColumn(sampleData1, 'active');
      
      expect(Object.keys(result)).toContain('true');
      expect(Object.keys(result)).toContain('false');
      expect(result['true']).toHaveLength(2);
      expect(result['false']).toHaveLength(1);
      expect(result['true'][0].name).toBe('John');
      expect(result['false'][0].name).toBe('Jane');
    });

    it('should handle undefined values', () => {
      const dataWithUndefined = [
        { name: 'John', category: 'A' },
        { name: 'Jane', category: undefined }
      ];
      
      const result = groupByColumn(dataWithUndefined, 'category');
      
      expect(result['A']).toHaveLength(1);
      expect(result['undefined']).toHaveLength(1);
    });
  });

  describe('calculateColumnStats', () => {
    it('should calculate statistics for numeric column', () => {
      const result = calculateColumnStats(sampleData1, 'age');
      
      expect(result.count).toBe(3);
      expect(result.sum).toBe(90);
      expect(result.average).toBe(30);
      expect(result.min).toBe(25);
      expect(result.max).toBe(35);
      expect(result.nullCount).toBe(0);
    });

    it('should handle non-numeric values', () => {
      const result = calculateColumnStats(sampleData1, 'name');
      
      expect(result.count).toBe(0);
      expect(result.sum).toBe(0);
      expect(result.average).toBe(0);
      expect(result.nullCount).toBe(3);
    });

    it('should handle null values', () => {
      const dataWithNulls = [
        { value: 10 },
        { value: null },
        { value: 20 }
      ];
      
      const result = calculateColumnStats(dataWithNulls, 'value');
      
      expect(result.count).toBe(2);
      expect(result.sum).toBe(30);
      expect(result.nullCount).toBe(1);
    });
  });

  describe('validateRequiredColumns', () => {
    const mockResult: ParseResult = {
      success: true,
      data: sampleData1,
      errors: [],
      warnings: [],
      stats: {
        totalRows: 3,
        validRows: 3,
        rejectedRows: 0,
        processingTime: 100
      }
    };

    it('should validate required columns exist', () => {
      const result = validateRequiredColumns(mockResult, ['name', 'age']);
      
      expect(result.isValid).toBe(true);
      expect(result.missingColumns).toEqual([]);
    });

    it('should detect missing columns', () => {
      const result = validateRequiredColumns(mockResult, ['name', 'missing']);
      
      expect(result.isValid).toBe(false);
      expect(result.missingColumns).toEqual(['missing']);
    });

    it('should handle unsuccessful parse result', () => {
      const failedResult = { ...mockResult, success: false, data: [] };
      const result = validateRequiredColumns(failedResult, ['name']);
      
      expect(result.isValid).toBe(false);
      expect(result.missingColumns).toEqual(['name']);
    });
  });

  describe('convertToCSV', () => {
    it('should convert data to CSV format', () => {
      const result = convertToCSV(sampleData1);
      
      expect(result).toContain('name,age,salary,active');
      expect(result).toContain('John,30,50000,true');
      expect(result).toContain('Jane,25,45000,false');
    });

    it('should handle empty data', () => {
      const result = convertToCSV([]);
      
      expect(result).toBe('');
    });

    it('should escape special characters', () => {
      const dataWithSpecialChars = [
        { name: 'John, Jr.', description: 'Has "quotes"' }
      ];
      
      const result = convertToCSV(dataWithSpecialChars);
      
      expect(result).toContain('"John, Jr."');
      expect(result).toContain('"Has ""quotes"""');
    });
  });

  describe('convertToJSON', () => {
    it('should convert data to JSON format', () => {
      const result = convertToJSON(sampleData1);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual(sampleData1);
    });

    it('should format JSON prettily when requested', () => {
      const result = convertToJSON(sampleData1, true);
      
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
  });

  describe('sampleData', () => {
    it('should return first N rows', () => {
      const result = sampleData(sampleData1, 2);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Jane');
    });

    it('should return all data if sample size is larger', () => {
      const result = sampleData(sampleData1, 10);
      
      expect(result).toHaveLength(3);
    });
  });

  describe('getUniqueValues', () => {
    it('should return unique values for a column', () => {
      const dataWithDuplicates = [
        { category: 'A' },
        { category: 'B' },
        { category: 'A' },
        { category: 'C' }
      ];
      
      const result = getUniqueValues(dataWithDuplicates, 'category');
      
      expect(result).toEqual(['A', 'B', 'C']);
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = [
        { value: 'A' },
        { value: null },
        { value: undefined },
        { value: 'A' }
      ];
      
      const result = getUniqueValues(dataWithNulls, 'value');
      
      expect(result).toContain('A');
      expect(result).toContain(null);
      expect(result).toContain(undefined);
    });
  });

  describe('detectColumnTypes', () => {
    it('should detect column data types', () => {
      const result = detectColumnTypes(sampleData1);
      
      expect(result.name).toBe('text');
      expect(result.age).toBe('number');
      expect(result.salary).toBe('number');
      expect(result.active).toBe('boolean');
    });

    it('should handle empty data', () => {
      const result = detectColumnTypes([]);
      
      expect(result).toEqual({});
    });
  });

  describe('formatParseResultSummary', () => {
    it('should format parse result summary', () => {
      const mockResult: ParseResult = {
        success: true,
        data: sampleData1,
        errors: [],
        warnings: ['Some warning'],
        stats: {
          totalRows: 100,
          validRows: 95,
          rejectedRows: 5,
          processingTime: 2500
        }
      };
      
      const result = formatParseResultSummary(mockResult);
      
      expect(result).toContain('100 rows');
      expect(result).toContain('2.50s');
      expect(result).toContain('95.0%');
      expect(result).toContain('95 valid');
      expect(result).toContain('5 rejected');
      expect(result).toContain('Warnings: 1');
    });

    it('should handle zero rows', () => {
      const mockResult: ParseResult = {
        success: false,
        data: [],
        errors: [{ name: 'Error', message: 'Test error', code: 'TEST' } as any],
        warnings: [],
        stats: {
          totalRows: 0,
          validRows: 0,
          rejectedRows: 0,
          processingTime: 100
        }
      };
      
      const result = formatParseResultSummary(mockResult);
      
      expect(result).toContain('0 rows');
      expect(result).toContain('0%');
      expect(result).toContain('Errors: 1');
    });
  });
}); 