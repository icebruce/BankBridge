import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { smartParse } from '../SmartParse';
import { ParseErrorCodes } from '../../models/parse';

// Mock winston to avoid file system operations in tests
vi.mock('winston', () => ({
  default: {
    createLogger: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      add: vi.fn()
    }),
    format: {
      combine: vi.fn(() => vi.fn()),
      timestamp: vi.fn(() => vi.fn()),
      errors: vi.fn(() => vi.fn()),
      json: vi.fn(() => vi.fn()),
      simple: vi.fn(() => vi.fn())
    },
    transports: {
      File: vi.fn(),
      Console: vi.fn()
    }
  },
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    add: vi.fn()
  }),
  format: {
    combine: vi.fn(() => vi.fn()),
    timestamp: vi.fn(() => vi.fn()),
    errors: vi.fn(() => vi.fn()),
    json: vi.fn(() => vi.fn()),
    simple: vi.fn(() => vi.fn())
  },
  transports: {
    File: vi.fn(),
    Console: vi.fn()
  }
}));

// Mock file-type
vi.mock('file-type', () => ({
  fileTypeFromFile: vi.fn()
}));

describe('SmartParse', () => {
  const testDataDir = path.join(__dirname, '../../../test-data');
  
  beforeEach(() => {
    // Ensure test data directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testDataDir, file));
      });
    }
  });

  describe('CSV parsing', () => {
    it('should parse simple CSV file', async () => {
      const csvContent = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;
      
      const filePath = path.join(testDataDir, 'test.csv');
      fs.writeFileSync(filePath, csvContent);

      const result = await smartParse(filePath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.fields).toHaveLength(3);
      expect(result.fields?.map(f => f.name)).toEqual(['name', 'age', 'city']);
      expect(result.stats.totalRows).toBe(3);
      expect(result.stats.validRows).toBe(3);
      expect(result.stats.rejectedRows).toBe(0);
    });

    it('should handle CSV with special characters in field names', async () => {
      const csvContent = `"First Name","Last-Name","Email@Address"
John,Doe,john@example.com
Jane,Smith,jane@example.com`;
      
      const filePath = path.join(testDataDir, 'special-chars.csv');
      fs.writeFileSync(filePath, csvContent);

      const result = await smartParse(filePath);

      expect(result.success).toBe(true);
      expect(result.fields?.map(f => f.name)).toEqual(['First_Name', 'Last_Name', 'Email_Address']);
    });

    it('should detect data types correctly', async () => {
      const csvContent = `name,age,salary,active,start_date
John,30,50000.50,true,2023-01-15
Jane,25,45000.00,false,2023-02-01`;
      
      const filePath = path.join(testDataDir, 'types.csv');
      fs.writeFileSync(filePath, csvContent);

      const result = await smartParse(filePath);

      expect(result.success).toBe(true);
      expect(result.fields?.find(f => f.name === 'name')?.type).toBe('text');
      expect(result.fields?.find(f => f.name === 'age')?.type).toBe('number');
      expect(result.fields?.find(f => f.name === 'salary')?.type).toBe('number');
      expect(result.fields?.find(f => f.name === 'active')?.type).toBe('boolean');
      expect(result.fields?.find(f => f.name === 'start_date')?.type).toBe('date');
    });
  });

  describe('JSON parsing', () => {
    it('should parse JSON array', async () => {
      const jsonContent = JSON.stringify([
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' },
        { name: 'Bob', age: 35, city: 'Chicago' }
      ]);
      
      const filePath = path.join(testDataDir, 'test.json');
      fs.writeFileSync(filePath, jsonContent);

      const result = await smartParse(filePath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.stats.totalRows).toBe(3);
      expect(result.stats.validRows).toBe(3);
    });

    it('should handle nested JSON objects', async () => {
      const jsonContent = JSON.stringify([
        { 
          name: 'John', 
          contact: { email: 'john@example.com', phone: '123-456-7890' },
          tags: ['developer', 'javascript']
        },
        { 
          name: 'Jane', 
          contact: { email: 'jane@example.com', phone: '098-765-4321' },
          tags: ['designer', 'ui/ux']
        }
      ]);
      
      const filePath = path.join(testDataDir, 'nested.json');
      fs.writeFileSync(filePath, jsonContent);

      const result = await smartParse(filePath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      
      // Check that nested objects are flattened
      const firstRow = result.data![0];
      expect(firstRow['contact.email']).toBe('john@example.com');
      expect(firstRow['contact.phone']).toBe('123-456-7890');
      // Arrays are converted to comma-separated strings during value conversion
      expect(firstRow['tags']).toBe('developer,javascript');
    });
  });

  describe('Error handling', () => {
    it('should handle file too large error', async () => {
      const csvContent = 'name,age\nJohn,30';
      const filePath = path.join(testDataDir, 'large.csv');
      fs.writeFileSync(filePath, csvContent);

      // Use 0.00001 MB = ~10 bytes limit (file is ~18 bytes, so it exceeds the limit)
      const result = await smartParse(filePath, { maxMemoryUsage: 0.00001 });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ParseErrorCodes.FILE_TOO_LARGE);
    });

    it('should handle unsupported file type', async () => {
      const filePath = path.join(testDataDir, 'test.xyz');
      fs.writeFileSync(filePath, 'some content');

      const result = await smartParse(filePath);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ParseErrorCodes.UNSUPPORTED_FORMAT);
    });

    it('should handle non-existent file', async () => {
      const filePath = path.join(testDataDir, 'nonexistent.csv');

      const result = await smartParse(filePath);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ParseErrorCodes.IO_ERROR);
    });
  });

  describe('Progress tracking', () => {
    it('should call progress callback during parsing', async () => {
      const csvContent = Array.from({ length: 100 }, (_, i) => 
        `name${i},${20 + i},city${i}`
      ).join('\n');
      const fullContent = 'name,age,city\n' + csvContent;
      
      const filePath = path.join(testDataDir, 'progress.csv');
      fs.writeFileSync(filePath, fullContent);

      const progressUpdates: any[] = [];
      const onProgress = vi.fn((progress) => {
        progressUpdates.push(progress);
      });

      const result = await smartParse(filePath, { chunkSize: 10 }, onProgress);

      expect(result.success).toBe(true);
      expect(onProgress).toHaveBeenCalled();
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Check that we got different phases
      const phases = progressUpdates.map(p => p.phase);
      expect(phases).toContain('parsing');
      expect(phases).toContain('transforming');
    });
  });

  describe('Options handling', () => {
    it('should respect maxRows option', async () => {
      const csvContent = Array.from({ length: 100 }, (_, i) => 
        `name${i},${20 + i}`
      ).join('\n');
      const fullContent = 'name,age\n' + csvContent;
      
      const filePath = path.join(testDataDir, 'maxrows.csv');
      fs.writeFileSync(filePath, fullContent);

      const result = await smartParse(filePath, { maxRows: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);
      expect(result.stats.totalRows).toBe(10);
    });

    it('should handle array explosion mapping', async () => {
      const jsonContent = JSON.stringify([
        { name: 'John', tags: ['developer', 'javascript', 'react'] },
        { name: 'Jane', tags: ['designer', 'ui/ux'] }
      ]);
      
      const filePath = path.join(testDataDir, 'explode.json');
      fs.writeFileSync(filePath, jsonContent);

      const result = await smartParse(filePath, {
        mapping: {
          tags: { type: 'array', explode: true }
        }
      });

      expect(result.success).toBe(true);
      // Should have 5 rows total (3 for John, 2 for Jane)
      expect(result.data).toHaveLength(5);
      
      // Check that tags are exploded
      const johnRows = result.data!.filter(row => row.name === 'John');
      expect(johnRows).toHaveLength(3);
      expect(johnRows.map(row => row.tags)).toEqual(['developer', 'javascript', 'react']);
    });
  });
}); 