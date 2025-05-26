import { describe, it, expect } from 'vitest';
import {
  flattenRow,
  expandNestedLists,
  detectDataType,
  calculateTypeConfidence,
  sanitizeFieldName,
  convertValue,
  validateRow
} from '../transformers';

describe('transformers', () => {
  describe('flattenRow', () => {
    it('should flatten simple nested objects', () => {
      const input = {
        user: {
          name: 'John',
          age: 30
        },
        active: true
      };

      const result = flattenRow(input);
      
      expect(result).toEqual({
        'user.name': 'John',
        'user.age': 30,
        'active': true
      });
    });

    it('should handle arrays of primitives', () => {
      const input = {
        tags: ['red', 'blue', 'green'],
        numbers: [1, 2, 3]
      };

      const result = flattenRow(input);
      
      expect(result).toEqual({
        'tags': 'red, blue, green',
        'numbers': '1, 2, 3'
      });
    });

    it('should handle arrays of objects', () => {
      const input = {
        items: [
          { name: 'item1', price: 10 },
          { name: 'item2', price: 20 }
        ]
      };

      const result = flattenRow(input);
      
      expect(result).toEqual({
        'items.0.name': 'item1',
        'items.0.price': 10,
        'items.1.name': 'item2',
        'items.1.price': 20
      });
    });

    it('should handle null and undefined values', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      };

      const result = flattenRow(input);
      
      expect(result).toEqual({
        'nullValue': null,
        'undefinedValue': undefined,
        'emptyString': ''
      });
    });

    it('should respect maxDepth parameter', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              level4: 'deep'
            }
          }
        }
      };

      const result = flattenRow(input, '', 2);
      
      expect(result).toEqual({
        'level1.level2': {
          level3: {
            level4: 'deep'
          }
        }
      });
    });

    it('should handle empty arrays', () => {
      const input = {
        emptyArray: []
      };

      const result = flattenRow(input);
      
      expect(result).toEqual({
        'emptyArray': []
      });
    });

    it('should handle primitive values', () => {
      expect(flattenRow('string')).toEqual({ 'value': 'string' });
      expect(flattenRow(123)).toEqual({ 'value': 123 });
      expect(flattenRow(true)).toEqual({ 'value': true });
    });
  });

  describe('expandNestedLists', () => {
    it('should return original row when no mapping provided', () => {
      const row = { name: 'John', tags: ['a', 'b'] };
      const result = expandNestedLists(row);
      
      expect(result).toEqual([row]);
    });

    it('should return original row when no explode fields', () => {
      const row = { name: 'John', tags: ['a', 'b'] };
      const mapping = {
        tags: { type: 'array' as const, explode: false }
      };
      
      const result = expandNestedLists(row, mapping);
      
      expect(result).toEqual([row]);
    });

    it('should explode array into separate rows', () => {
      const row = {
        name: 'John',
        tags: ['red', 'blue', 'green'],
        scores: [10, 20, 30]
      };
      
      const mapping = {
        tags: { type: 'array' as const, explode: true },
        scores: { type: 'array' as const, explode: true }
      };
      
      const result = expandNestedLists(row, mapping);
      
      expect(result).toEqual([
        { name: 'John', tags: 'red', scores: 10 },
        { name: 'John', tags: 'blue', scores: 20 },
        { name: 'John', tags: 'green', scores: 30 }
      ]);
    });

    it('should handle arrays of different lengths', () => {
      const row = {
        name: 'John',
        tags: ['red', 'blue', 'green'],
        scores: [10, 20] // shorter array
      };
      
      const mapping = {
        tags: { type: 'array' as const, explode: true },
        scores: { type: 'array' as const, explode: true }
      };
      
      const result = expandNestedLists(row, mapping);
      
      expect(result).toEqual([
        { name: 'John', tags: 'red', scores: 10 },
        { name: 'John', tags: 'blue', scores: 20 },
        { name: 'John', tags: 'green', scores: 20 } // repeats last value
      ]);
    });

    it('should handle empty arrays', () => {
      const row = {
        name: 'John',
        tags: []
      };
      
      const mapping = {
        tags: { type: 'array' as const, explode: true }
      };
      
      const result = expandNestedLists(row, mapping);
      
      expect(result).toEqual([row]);
    });
  });

  describe('detectDataType', () => {
    it('should detect boolean values', () => {
      expect(detectDataType(['true', 'false', 'yes', 'no'])).toBe('boolean');
      expect(detectDataType(['1', '0', 'y', 'n'])).toBe('boolean');
      expect(detectDataType(['TRUE', 'FALSE'])).toBe('boolean');
    });

    it('should detect currency values', () => {
      expect(detectDataType(['$10.50', '$20', '$0.99'])).toBe('currency');
      expect(detectDataType(['€15.75', '€100'])).toBe('currency');
      expect(detectDataType(['£50.75', '£100.00'])).toBe('currency');
    });

    it('should detect number values', () => {
      expect(detectDataType(['10', '20', '30'])).toBe('number');
      expect(detectDataType(['10.5', '20.75', '30.25'])).toBe('number');
      expect(detectDataType(['-10', '20', '-30'])).toBe('number');
      expect(detectDataType(['1,000', '2,500'])).toBe('number');
      expect(detectDataType(['10.50', '20.00', '0.99'])).toBe('number'); // Pure numbers without currency symbols
    });

    it('should detect date values', () => {
      expect(detectDataType(['2023-01-01', '2023-12-31'])).toBe('date');
      expect(detectDataType(['01/01/2023', '12/31/2023'])).toBe('date');
      expect(detectDataType(['01-01-2023', '12-31-2023'])).toBe('date');
      expect(detectDataType(['2023-01-01T10:30:00Z'])).toBe('date');
    });

    it('should default to text for mixed or unrecognized values', () => {
      expect(detectDataType(['hello', 'world'])).toBe('text');
      expect(detectDataType(['mixed', '123', 'values'])).toBe('text');
      expect(detectDataType([])).toBe('text');
      expect(detectDataType([null, undefined])).toBe('text');
    });

    it('should handle empty and null values', () => {
      expect(detectDataType([])).toBe('text');
      expect(detectDataType([null, undefined, ''])).toBe('text');
      expect(detectDataType(['', '  ', null])).toBe('text');
    });
  });

  describe('calculateTypeConfidence', () => {
    it('should return 1.0 for perfect matches', () => {
      expect(calculateTypeConfidence(['true', 'false'], 'boolean')).toBe(1.0);
      expect(calculateTypeConfidence(['10', '20'], 'number')).toBe(1.0);
    });

    it('should return partial confidence for mixed data', () => {
      expect(calculateTypeConfidence(['10', 'abc'], 'number')).toBe(0.5);
      expect(calculateTypeConfidence(['true', 'maybe'], 'boolean')).toBe(0.5);
    });

    it('should return 0 for empty arrays', () => {
      expect(calculateTypeConfidence([], 'text')).toBe(0);
      expect(calculateTypeConfidence([null, undefined], 'text')).toBe(0);
    });

    it('should handle text type correctly', () => {
      expect(calculateTypeConfidence(['hello', 'world'], 'text')).toBe(1.0);
      expect(calculateTypeConfidence(['123', 'abc'], 'text')).toBe(1.0);
    });
  });

  describe('sanitizeFieldName', () => {
    it('should remove special characters', () => {
      expect(sanitizeFieldName('field-name')).toBe('field_name');
      expect(sanitizeFieldName('field@name')).toBe('field_name');
      expect(sanitizeFieldName('field name')).toBe('field_name');
    });

    it('should handle numbers at start', () => {
      expect(sanitizeFieldName('123field')).toBe('_123field');
      expect(sanitizeFieldName('1_field')).toBe('_1_field');
    });

    it('should remove multiple underscores', () => {
      expect(sanitizeFieldName('field___name')).toBe('field_name');
      expect(sanitizeFieldName('___field___')).toBe('field');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFieldName('  field  ')).toBe('field');
      expect(sanitizeFieldName(' field name ')).toBe('field_name');
    });

    it('should handle empty strings', () => {
      expect(sanitizeFieldName('')).toBe('');
      expect(sanitizeFieldName('   ')).toBe('');
    });
  });

  describe('convertValue', () => {
    it('should convert boolean values', () => {
      expect(convertValue('true', 'boolean')).toBe(true);
      expect(convertValue('false', 'boolean')).toBe(false);
      expect(convertValue('yes', 'boolean')).toBe(true);
      expect(convertValue('no', 'boolean')).toBe(false);
      expect(convertValue('1', 'boolean')).toBe(true);
      expect(convertValue('0', 'boolean')).toBe(false);
    });

    it('should convert number values', () => {
      expect(convertValue('123', 'number')).toBe(123);
      expect(convertValue('123.45', 'number')).toBe(123.45);
      expect(convertValue('1,234', 'number')).toBe(1234);
      expect(convertValue('invalid', 'number')).toBe(null);
    });

    it('should convert currency values', () => {
      expect(convertValue('$123.45', 'currency')).toBe(123.45);
      expect(convertValue('€100', 'currency')).toBe(100);
      expect(convertValue('£50.75', 'currency')).toBe(50.75);
    });

    it('should convert date values', () => {
      const result = convertValue('2023-01-01', 'date');
      expect(result).toBe('2023-01-01T00:00:00.000Z');
      
      expect(convertValue('invalid-date', 'date')).toBe(null);
    });

    it('should handle null and undefined', () => {
      expect(convertValue(null, 'text')).toBe(null);
      expect(convertValue(undefined, 'text')).toBe(undefined);
      expect(convertValue('', 'text')).toBe(null);
      expect(convertValue('  ', 'text')).toBe(null);
    });

    it('should default to string for text type', () => {
      expect(convertValue('hello', 'text')).toBe('hello');
      expect(convertValue(123, 'text')).toBe('123');
    });
  });

  describe('validateRow', () => {
    it('should return valid for rows without expected fields', () => {
      const row = { name: 'John', age: 30 };
      const result = validateRow(row);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate required fields', () => {
      const row = { name: 'John' };
      const expectedFields = {
        name: { required: true },
        age: { required: true }
      };
      
      const result = validateRow(row, expectedFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Required field 'age' is missing");
    });

    it('should validate field types', () => {
      const row = { name: 'John', age: '30' }; // age is string, not number
      const expectedFields = {
        name: { type: 'string' },
        age: { type: 'number' }
      };
      
      const result = validateRow(row, expectedFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'age' expected type 'number' but got 'string'");
    });

    it('should pass validation for correct data', () => {
      const row = { name: 'John', age: 30 };
      const expectedFields = {
        name: { required: true, type: 'string' },
        age: { required: true, type: 'number' }
      };
      
      const result = validateRow(row, expectedFields);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle null values correctly', () => {
      const row = { name: 'John', age: null };
      const expectedFields = {
        name: { required: true },
        age: { required: false, type: 'number' }
      };
      
      const result = validateRow(row, expectedFields);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
}); 