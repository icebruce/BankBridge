/**
 * File Processing Service
 *
 * Transforms raw CSV/file data into transactions using import templates,
 * validates data, and detects duplicates.
 */

import type { ImportTemplate, ImportFieldMapping } from '../models/ImportTemplate';
import type { CreateTransactionInput } from '../models/MasterData';
import { isDuplicateTransaction, getAllTransactions } from './masterDataService';

// Simplified transaction for the Process Files wizard
export interface ProcessedTransaction {
  row: number;
  date: string;
  merchant: string;
  amount: number;
  originalStatement: string;
  category: string;
  notes: string;
  tags: string[];
}

export interface ProcessingError {
  row: number;
  message: string;
  field?: string;
}

export interface DuplicateMatch {
  row: number;
  description: string;
  amount: number;
  date: string;
  matchSource: string;
  // Original record data for comparison
  originalRow?: number;
  originalDescription?: string;
  originalAmount?: number;
  originalDate?: string;
}

export interface FileProcessingResult {
  transactions: ProcessedTransaction[];
  errors: ProcessingError[];
  duplicates: DuplicateMatch[];
  metrics: {
    totalAmount: number;
    minDate: string | null;
    maxDate: string | null;
  };
}

/**
 * Process file data using an import template
 */
export async function processFileData(
  rows: Record<string, string>[],
  template: ImportTemplate,
  account: { institutionName: string; accountName: string },
  fileName: string,
  existingSessionTransactions: ProcessedTransaction[] = []
): Promise<FileProcessingResult> {
  const transactions: ProcessedTransaction[] = [];
  const errors: ProcessingError[] = [];
  const duplicates: DuplicateMatch[] = [];

  // Load existing master data for duplicate detection
  const existingMasterData = await getAllTransactions();

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 because: 1-indexed and skip header row

    try {
      // Apply field mappings to transform the row
      const transformed = applyFieldMappings(row, template.fieldMappings, template.fieldCombinations);

      // Validate the transformed data
      const validationErrors = validateTransaction(transformed, rowNumber);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue; // Skip this row
      }

      // Create the processed transaction
      const transaction: ProcessedTransaction = {
        row: rowNumber,
        date: transformed.date || '',
        merchant: transformed.merchant || '',
        amount: parseAmount(transformed.amount),
        originalStatement: transformed.originalStatement || '',
        category: transformed.category || '',
        notes: transformed.notes || '',
        tags: transformed.tags ? transformed.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      // Check for duplicates against master data
      const masterDataInput: CreateTransactionInput = {
        date: transaction.date,
        merchant: transaction.merchant,
        amount: transaction.amount,
        originalStatement: transaction.originalStatement,
        category: transaction.category,
        notes: transaction.notes,
        tags: transaction.tags,
        institutionName: account.institutionName,
        accountName: account.accountName,
        sourceFile: fileName,
      };

      const masterDuplicate = isDuplicateTransaction(masterDataInput, existingMasterData);
      if (masterDuplicate) {
        const importDate = new Date(masterDuplicate.importedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        duplicates.push({
          row: rowNumber,
          description: transaction.merchant || transaction.originalStatement,
          amount: transaction.amount,
          date: transaction.date,
          matchSource: `Existing data (imported ${importDate})`,
          // Original record from master data
          originalDescription: masterDuplicate.merchant || masterDuplicate.originalStatement,
          originalAmount: masterDuplicate.amount,
          originalDate: masterDuplicate.date,
        });
        continue; // Skip this row
      }

      // Check for duplicates against other files in this session
      const sessionDuplicate = findSessionDuplicate(transaction, existingSessionTransactions);
      if (sessionDuplicate) {
        duplicates.push({
          row: rowNumber,
          description: transaction.merchant || transaction.originalStatement,
          amount: transaction.amount,
          date: transaction.date,
          matchSource: `Another file in this upload (Row ${sessionDuplicate.row})`,
          // Original record from another file
          originalRow: sessionDuplicate.row,
          originalDescription: sessionDuplicate.merchant || sessionDuplicate.originalStatement,
          originalAmount: sessionDuplicate.amount,
          originalDate: sessionDuplicate.date,
        });
        continue; // Skip this row
      }

      // Check for duplicates within this same file (already processed rows)
      const withinFileDuplicate = findSessionDuplicate(transaction, transactions);
      if (withinFileDuplicate) {
        duplicates.push({
          row: rowNumber,
          description: transaction.merchant || transaction.originalStatement,
          amount: transaction.amount,
          date: transaction.date,
          matchSource: `This file (Row ${withinFileDuplicate.row})`,
          // Original record from this file
          originalRow: withinFileDuplicate.row,
          originalDescription: withinFileDuplicate.merchant || withinFileDuplicate.originalStatement,
          originalAmount: withinFileDuplicate.amount,
          originalDate: withinFileDuplicate.date,
        });
        continue; // Skip this row
      }

      transactions.push(transaction);
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : 'Unknown error processing row',
      });
    }
  }

  // Calculate metrics from valid transactions
  const metrics = calculateMetrics(transactions);

  return {
    transactions,
    errors,
    duplicates,
    metrics,
  };
}

/**
 * Normalize a target field name to camelCase for consistent access
 * e.g., "Date" -> "date", "Original Statement" -> "originalStatement"
 *
 * This handles backwards compatibility with legacy Import Templates that stored
 * display names (e.g., "Date", "Original Statement") instead of internal field
 * names (e.g., "date", "originalStatement"). New templates should store internal
 * field names directly.
 */
function normalizeTargetField(fieldName: string): string {
  // Handle null/undefined
  if (!fieldName) {
    return '';
  }

  // If already camelCase (no spaces and starts with lowercase), return as-is
  if (!fieldName.includes(' ') && fieldName[0] === fieldName[0].toLowerCase()) {
    return fieldName;
  }

  // Remove extra spaces and split by space
  const words = fieldName.trim().split(/\s+/);

  // Convert to camelCase
  return words.map((word, index) => {
    const lower = word.toLowerCase();
    if (index === 0) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join('');
}

/**
 * Apply field mappings to transform a raw row into a transaction object
 */
function applyFieldMappings(
  row: Record<string, string>,
  fieldMappings: ImportFieldMapping[],
  fieldCombinations?: ImportTemplate['fieldCombinations']
): Record<string, string> {
  const result: Record<string, string> = {};

  // Apply direct field mappings (normalize target field names to camelCase)
  for (const mapping of fieldMappings) {
    if (mapping.sourceField && mapping.targetField) {
      const value = row[mapping.sourceField] || '';
      const normalizedTarget = normalizeTargetField(mapping.targetField);
      result[normalizedTarget] = value.trim();
    }
  }

  // Apply field combinations (if any)
  if (fieldCombinations) {
    for (const combination of fieldCombinations) {
      const values = combination.sourceFields
        .sort((a, b) => a.order - b.order)
        .map(sf => row[sf.fieldName] || '')
        .filter(v => v.trim());

      const delimiter = combination.delimiter === 'custom'
        ? combination.customDelimiter || ' '
        : combination.delimiter === 'space' ? ' '
        : combination.delimiter === 'dash' ? ' - '
        : combination.delimiter === 'comma' ? ', '
        : ' ';

      const normalizedTarget = normalizeTargetField(combination.targetField);
      result[normalizedTarget] = values.join(delimiter);
    }
  }

  return result;
}

/**
 * Validate a transformed transaction
 */
function validateTransaction(
  data: Record<string, string>,
  rowNumber: number
): ProcessingError[] {
  const errors: ProcessingError[] = [];

  // Validate date
  const dateValue = data.date?.trim();
  if (!dateValue) {
    errors.push({
      row: rowNumber,
      message: 'Missing required field: date (check that your template maps to the correct date column)',
      field: 'date'
    });
  } else if (!isValidDate(dateValue)) {
    errors.push({
      row: rowNumber,
      message: `Invalid date format: "${dateValue}"`,
      field: 'date'
    });
  }

  // Validate amount
  const amountValue = data.amount?.trim();
  if (!amountValue) {
    errors.push({
      row: rowNumber,
      message: 'Missing required field: amount (check that your template maps to the correct amount column)',
      field: 'amount'
    });
  } else if (!isValidAmount(amountValue)) {
    errors.push({
      row: rowNumber,
      message: `Invalid amount format: "${amountValue}"`,
      field: 'amount'
    });
  }

  return errors;
}

/**
 * Check if a date string is valid
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr || !dateStr.trim()) {
    return false;
  }

  // Try parsing with JavaScript's Date constructor (handles many formats)
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    // Additional sanity check - year should be reasonable (1900-2100)
    const year = parsed.getFullYear();
    return year >= 1900 && year <= 2100;
  }

  return false;
}

/**
 * Check if an amount string is valid
 */
function isValidAmount(amountStr: string): boolean {
  // Remove currency symbols, commas, spaces
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  return !isNaN(parseFloat(cleaned));
}

/**
 * Parse an amount string into a number
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Normalize a date to YYYY-MM-DD format
 * Uses local date components to avoid timezone shifts
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return dateStr; // Return as-is if can't parse
  }

  // Use local date components to avoid timezone shifts
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Find a duplicate in session transactions
 */
function findSessionDuplicate(
  transaction: ProcessedTransaction,
  sessionTransactions: ProcessedTransaction[]
): ProcessedTransaction | null {
  return sessionTransactions.find(t =>
    t.date === transaction.date &&
    t.amount === transaction.amount &&
    similarDescription(t.originalStatement, transaction.originalStatement)
  ) || null;
}

/**
 * Check if two descriptions are similar
 */
function similarDescription(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedA = normalize(a);
  const normalizedB = normalize(b);

  if (normalizedA === normalizedB) {
    return true;
  }

  // Simple Levenshtein distance check
  return levenshteinDistance(normalizedA, normalizedB) < 3;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate metrics from transactions
 */
function calculateMetrics(transactions: ProcessedTransaction[]): {
  totalAmount: number;
  minDate: string | null;
  maxDate: string | null;
} {
  if (transactions.length === 0) {
    return { totalAmount: 0, minDate: null, maxDate: null };
  }

  let totalAmount = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const t of transactions) {
    totalAmount += t.amount;

    const normalizedDate = normalizeDate(t.date);
    if (normalizedDate) {
      if (!minDate || normalizedDate < minDate) {
        minDate = normalizedDate;
      }
      if (!maxDate || normalizedDate > maxDate) {
        maxDate = normalizedDate;
      }
    }
  }

  return { totalAmount, minDate, maxDate };
}

/**
 * Calculate original metrics from all rows (before filtering)
 */
export function calculateOriginalMetrics(
  rows: Record<string, string>[],
  template: ImportTemplate
): { totalAmount: number; minDate: string | null; maxDate: string | null } {
  let totalAmount = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;

  // Find the amount and date field mappings
  // Use normalizeTargetField to handle both internal names ("amount") and legacy display names ("Amount")
  const amountMapping = template.fieldMappings.find(m => normalizeTargetField(m.targetField) === 'amount');
  const dateMapping = template.fieldMappings.find(m => normalizeTargetField(m.targetField) === 'date');

  for (const row of rows) {
    // Extract amount
    if (amountMapping?.sourceField) {
      const amountStr = row[amountMapping.sourceField] || '';
      const amount = parseAmount(amountStr);
      if (!isNaN(amount)) {
        totalAmount += amount;
      }
    }

    // Extract date
    if (dateMapping?.sourceField) {
      const dateStr = row[dateMapping.sourceField] || '';
      const normalizedDate = normalizeDate(dateStr);
      if (normalizedDate && isValidDate(dateStr)) {
        if (!minDate || normalizedDate < minDate) {
          minDate = normalizedDate;
        }
        if (!maxDate || normalizedDate > maxDate) {
          maxDate = normalizedDate;
        }
      }
    }
  }

  return { totalAmount, minDate, maxDate };
}
