/**
 * Pure utility functions for data transformation
 * No Node APIs - 100% unit testable
 */

import { ParsedRow } from '../models/parse';

/**
 * Flatten nested object using dot notation
 * Example: { user: { name: 'John' } } -> { 'user.name': 'John' }
 */
export const flattenRow = (row: unknown, prefix = '', maxDepth = 5): ParsedRow => {
  if (maxDepth <= 0) {
    return { [prefix || 'value']: row };
  }

  if (row === null || row === undefined) {
    return { [prefix || 'value']: row };
  }

  if (typeof row !== 'object') {
    return { [prefix || 'value']: row };
  }

  if (Array.isArray(row)) {
    // Handle arrays - either flatten each item or join as string
    const result: ParsedRow = {};
    if (row.length === 0) {
      result[prefix || 'array'] = [];
    } else if (row.every(item => typeof item !== 'object')) {
      // Array of primitives - join as string
      result[prefix || 'array'] = row.join(', ');
    } else {
      // Array of objects - flatten each with index
      row.forEach((item, index) => {
        const itemPrefix = prefix ? `${prefix}.${index}` : `${index}`;
        Object.assign(result, flattenRow(item, itemPrefix, maxDepth - 1));
      });
    }
    return result;
  }

  // Handle objects
  const result: ParsedRow = {};
  const obj = row as Record<string, unknown>;
  
  for (const [key, value] of Object.entries(obj)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    Object.assign(result, flattenRow(value, newPrefix, maxDepth - 1));
  }

  return result;
};

/**
 * Expand nested lists based on mapping configuration
 * Can either explode arrays into separate rows or keep them as arrays
 */
export const expandNestedLists = (
  row: ParsedRow, 
  mapping?: Record<string, { type: 'scalar' | 'array'; explode?: boolean }>
): ParsedRow[] => {
  if (!mapping) {
    return [row];
  }

  const explodeFields = Object.entries(mapping)
    .filter(([_, config]) => config.type === 'array' && config.explode)
    .map(([field, _]) => field);

  if (explodeFields.length === 0) {
    return [row];
  }

  // Find the field with the most array items to use as the base for explosion
  let maxArrayLength = 0;
  let baseField = '';
  
  for (const field of explodeFields) {
    const value = row[field];
    if (Array.isArray(value) && value.length > maxArrayLength) {
      maxArrayLength = value.length;
      baseField = field;
    }
  }

  if (maxArrayLength === 0) {
    return [row];
  }

  // Create expanded rows
  const expandedRows: ParsedRow[] = [];
  const baseArray = row[baseField] as unknown[];

  for (let i = 0; i < maxArrayLength; i++) {
    const newRow: ParsedRow = { ...row };
    
    // Set the base field value for this row
    newRow[baseField] = baseArray[i];
    
    // Set other explode fields (use index if available, otherwise repeat last value)
    for (const field of explodeFields) {
      if (field !== baseField) {
        const fieldArray = row[field] as unknown[];
        if (Array.isArray(fieldArray)) {
          newRow[field] = fieldArray[Math.min(i, fieldArray.length - 1)] || null;
        }
      }
    }
    
    expandedRows.push(newRow);
  }

  return expandedRows;
};

/**
 * Detect data type from array of values
 */
export const detectDataType = (values: unknown[]): string => {
  if (values.length === 0) return 'text';

  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  if (nonNullValues.length === 0) return 'text';

  const stringValues = nonNullValues.map(v => String(v).trim()).filter(v => v !== '');
  if (stringValues.length === 0) return 'text';

  // Check for boolean
  const booleanPattern = /^(true|false|yes|no|y|n|1|0)$/i;
  if (stringValues.every(v => booleanPattern.test(v))) {
    return 'boolean';
  }

  // Check for numbers first (before currency to avoid false positives)
  if (stringValues.every(v => !isNaN(Number(v.replace(/[,\s]/g, ''))))) {
    // Check if any values have currency symbols
    const hasCurrencySymbols = stringValues.some(v => /[\$€£¥]/.test(v));
    if (hasCurrencySymbols) {
      return 'currency';
    }
    return 'number';
  }

  // Check for currency (values with currency symbols that didn't match number pattern)
  const currencyPattern = /^[\$€£¥]?[\d,]+\.?\d*$/;
  if (stringValues.every(v => currencyPattern.test(v.replace(/[\s$€£¥,]/g, '')))) {
    return 'currency';
  }

  // Check for dates
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or MM/DD/YYYY
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ // ISO datetime
  ];
  
  if (stringValues.some(v => datePatterns.some(pattern => pattern.test(v)))) {
    return 'date';
  }

  return 'text';
};

/**
 * Calculate confidence score for data type detection
 */
export const calculateTypeConfidence = (values: unknown[], detectedType: string): number => {
  if (values.length === 0) return 0;

  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  if (nonNullValues.length === 0) return 0;

  const stringValues = nonNullValues.map(v => String(v).trim()).filter(v => v !== '');
  if (stringValues.length === 0) return 0;

  let matchCount = 0;

  switch (detectedType) {
    case 'boolean':
      const booleanPattern = /^(true|false|yes|no|y|n|1|0)$/i;
      matchCount = stringValues.filter(v => booleanPattern.test(v)).length;
      break;
    
    case 'currency':
      const currencyPattern = /^[\$€£¥]?[\d,]+\.?\d*$/;
      matchCount = stringValues.filter(v => currencyPattern.test(v.replace(/[\s$€£¥,]/g, ''))).length;
      break;
    
    case 'number':
      matchCount = stringValues.filter(v => !isNaN(Number(v.replace(/[,\s]/g, '')))).length;
      break;
    
    case 'date':
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,
        /^\d{2}\/\d{2}\/\d{4}$/,
        /^\d{2}-\d{2}-\d{4}$/,
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      ];
      matchCount = stringValues.filter(v => 
        datePatterns.some(pattern => pattern.test(v))
      ).length;
      break;
    
    default: // text
      matchCount = stringValues.length;
  }

  return matchCount / stringValues.length;
};

/**
 * Sanitize field name for safe usage
 */
export const sanitizeFieldName = (name: string): string => {
  let result = name
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_'); // Replace multiple underscores with single
  
  // Prefix with underscore if starts with number
  if (/^\d/.test(result)) {
    result = '_' + result;
  }
  
  // Remove leading/trailing underscores (but keep the one we just added for numbers)
  if (!result.startsWith('_') || !/^\d/.test(result.substring(1))) {
    result = result.replace(/^_|_$/g, '');
  }
  
  return result;
};

/**
 * Convert value to appropriate type based on detected type
 */
export const convertValue = (value: unknown, targetType: string): unknown => {
  if (value === null || value === undefined) return value;
  
  const stringValue = String(value).trim();
  if (stringValue === '') return null;

  switch (targetType) {
    case 'boolean':
      const booleanValue = stringValue.toLowerCase();
      return ['true', 'yes', 'y', '1'].includes(booleanValue);
    
    case 'number':
    case 'currency':
      const numericValue = stringValue.replace(/[,$€£¥\s]/g, '');
      const parsed = Number(numericValue);
      return isNaN(parsed) ? null : parsed;
    
    case 'date':
      const dateValue = new Date(stringValue);
      return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
    
    default:
      return stringValue;
  }
};

/**
 * Validate row against expected schema
 */
export const validateRow = (
  row: ParsedRow, 
  expectedFields?: Record<string, unknown>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!expectedFields) {
    return { isValid: true, errors };
  }

  // Check required fields
  for (const [fieldName, fieldConfig] of Object.entries(expectedFields)) {
    if (typeof fieldConfig === 'object' && fieldConfig !== null) {
      const config = fieldConfig as { required?: boolean; type?: string };
      
      if (config.required && (row[fieldName] === null || row[fieldName] === undefined)) {
        errors.push(`Required field '${fieldName}' is missing`);
      }
      
      if (config.type && row[fieldName] !== null && row[fieldName] !== undefined) {
        const actualType = typeof row[fieldName];
        if (actualType !== config.type) {
          errors.push(`Field '${fieldName}' expected type '${config.type}' but got '${actualType}'`);
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}; 