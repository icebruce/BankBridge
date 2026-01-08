/**
 * Master Data Service
 *
 * Handles transaction storage and retrieval from master_data.json.
 * Works in both browser (localStorage fallback) and Electron (IPC to main process).
 */

import {
  Transaction,
  MasterDataFile,
  MasterDataMetadata,
  TransactionFilterOptions,
  TransactionSortOptions,
  PaginationOptions,
  PaginatedResult,
  CreateTransactionInput,
  MasterDataFileInfo,
  createDefaultMasterData,
  createTransaction,
  computeMetadata,
  MASTER_DATA_VERSION
} from '../models/MasterData';
import { getMasterDataPath } from './settingsService';

const MASTER_DATA_STORAGE_KEY = 'bankbridge_master_data';

/**
 * Check if running in Electron environment
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' &&
         typeof (window as any).electronAPI !== 'undefined';
}

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Load master data from storage
 */
export async function loadMasterData(): Promise<MasterDataFile> {
  if (isElectron()) {
    try {
      return await (window as any).electronAPI.masterData.load();
    } catch (error) {
      console.error('Error loading master data from Electron:', error);
      return createDefaultMasterData();
    }
  }

  // Browser fallback (localStorage)
  return loadMasterDataFromLocalStorage();
}

/**
 * Save master data to storage
 */
export async function saveMasterData(data: MasterDataFile): Promise<void> {
  // Update metadata before saving
  data.metadata = computeMetadata(data.transactions);
  data.lastUpdated = new Date().toISOString();

  if (isElectron()) {
    try {
      await (window as any).electronAPI.masterData.save(data);
      return;
    } catch (error) {
      console.error('Error saving master data to Electron:', error);
      throw new Error('Failed to save master data');
    }
  }

  // Browser fallback (localStorage)
  saveMasterDataToLocalStorage(data);
}

/**
 * Get file info for the master data file
 */
export async function getFileInfo(): Promise<MasterDataFileInfo> {
  if (isElectron()) {
    try {
      return await (window as any).electronAPI.masterData.getFileInfo();
    } catch (error) {
      console.error('Error getting file info:', error);
      const path = await getMasterDataPath();
      return { path, exists: false };
    }
  }

  // Browser fallback
  return {
    path: 'localStorage',
    exists: localStorage.getItem(MASTER_DATA_STORAGE_KEY) !== null
  };
}

/**
 * Check if the master data file has been modified externally
 */
export async function checkFileModified(): Promise<boolean> {
  if (isElectron()) {
    try {
      return await (window as any).electronAPI.masterData.checkModified();
    } catch (error) {
      console.error('Error checking file modification:', error);
      return false;
    }
  }

  // Browser fallback - localStorage doesn't have external modification
  return false;
}

// ============================================================================
// Transaction Operations
// ============================================================================

/**
 * Get all transactions
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const data = await loadMasterData();
  return data.transactions;
}

/**
 * Get transactions with optional filtering, sorting, and pagination
 */
export async function getTransactions(
  filters?: TransactionFilterOptions,
  sort?: TransactionSortOptions,
  pagination?: PaginationOptions
): Promise<PaginatedResult<Transaction>> {
  const data = await loadMasterData();
  let transactions = [...data.transactions];

  // Apply filters
  if (filters) {
    transactions = filterTransactions(transactions, filters);
  }

  // Apply sorting
  if (sort) {
    transactions = sortTransactions(transactions, sort);
  }

  // Calculate total before pagination
  const total = transactions.length;

  // Apply pagination
  if (pagination) {
    const start = (pagination.page - 1) * pagination.pageSize;
    transactions = transactions.slice(start, start + pagination.pageSize);
  }

  return {
    items: transactions,
    total,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || total,
    totalPages: pagination ? Math.ceil(total / pagination.pageSize) : 1
  };
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  const transactions = await getAllTransactions();
  return transactions.find(t => t.id === id);
}

/**
 * Add new transactions to master data
 */
export async function addTransactions(inputs: CreateTransactionInput[]): Promise<Transaction[]> {
  const data = await loadMasterData();
  const newTransactions = inputs.map(input => createTransaction(input));

  data.transactions.push(...newTransactions);
  await saveMasterData(data);

  return newTransactions;
}

/**
 * Add a single transaction
 */
export async function addTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const results = await addTransactions([input]);
  return results[0];
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'importedAt'>>
): Promise<Transaction> {
  const data = await loadMasterData();
  const index = data.transactions.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error(`Transaction not found: ${id}`);
  }

  const updatedTransaction: Transaction = {
    ...data.transactions[index],
    ...updates
  };

  data.transactions[index] = updatedTransaction;
  await saveMasterData(data);

  return updatedTransaction;
}

/**
 * Delete a transaction by ID
 */
export async function deleteTransaction(id: string): Promise<void> {
  const data = await loadMasterData();
  const index = data.transactions.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error(`Transaction not found: ${id}`);
  }

  data.transactions.splice(index, 1);
  await saveMasterData(data);
}

/**
 * Delete multiple transactions by IDs
 */
export async function deleteTransactions(ids: string[]): Promise<void> {
  const data = await loadMasterData();
  data.transactions = data.transactions.filter(t => !ids.includes(t.id));
  await saveMasterData(data);
}

// ============================================================================
// Duplicate Detection
// ============================================================================

/**
 * Check if a transaction is a duplicate of an existing one
 */
export function isDuplicateTransaction(
  newTxn: CreateTransactionInput,
  existing: Transaction[]
): Transaction | null {
  const match = existing.find(txn =>
    txn.date === newTxn.date &&
    txn.amount === newTxn.amount &&
    txn.institutionName === newTxn.institutionName &&
    txn.accountName === newTxn.accountName &&
    similarDescription(txn.originalStatement, newTxn.originalStatement)
  );

  return match || null;
}

/**
 * Check if two descriptions are similar (handles slight variations)
 */
function similarDescription(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedA = normalize(a);
  const normalizedB = normalize(b);

  if (normalizedA === normalizedB) {
    return true;
  }

  // Simple Levenshtein distance check for minor variations
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
 * Find duplicates in a batch of transactions to import
 */
export async function findDuplicates(
  newTransactions: CreateTransactionInput[]
): Promise<Map<number, Transaction>> {
  const existing = await getAllTransactions();
  const duplicates = new Map<number, Transaction>();

  newTransactions.forEach((newTxn, index) => {
    const duplicate = isDuplicateTransaction(newTxn, existing);
    if (duplicate) {
      duplicates.set(index, duplicate);
    }
  });

  return duplicates;
}

// ============================================================================
// Filtering and Sorting
// ============================================================================

/**
 * Filter transactions based on filter options
 */
function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilterOptions
): Transaction[] {
  return transactions.filter(txn => {
    // Date range filter
    if (filters.dateFrom && txn.date < filters.dateFrom) return false;
    if (filters.dateTo && txn.date > filters.dateTo) return false;

    // Institution filter
    if (filters.institutionName &&
        !txn.institutionName.toLowerCase().includes(filters.institutionName.toLowerCase())) {
      return false;
    }

    // Account filter
    if (filters.accountName &&
        !txn.accountName.toLowerCase().includes(filters.accountName.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filters.category &&
        !txn.category.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
    }

    // Amount range filter
    if (filters.amountMin !== undefined && txn.amount < filters.amountMin) return false;
    if (filters.amountMax !== undefined && txn.amount > filters.amountMax) return false;

    // Tags filter (any match)
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag =>
        txn.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!hasMatchingTag) return false;
    }

    // Search text (matches merchant, originalStatement, notes)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesMerchant = txn.merchant.toLowerCase().includes(searchLower);
      const matchesStatement = txn.originalStatement.toLowerCase().includes(searchLower);
      const matchesNotes = txn.notes.toLowerCase().includes(searchLower);
      if (!matchesMerchant && !matchesStatement && !matchesNotes) return false;
    }

    return true;
  });
}

/**
 * Sort transactions based on sort options
 */
function sortTransactions(
  transactions: Transaction[],
  sort: TransactionSortOptions
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const aValue = a[sort.field];
    const bValue = b[sort.field];

    let comparison = 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
      comparison = aValue.length - bValue.length;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

// ============================================================================
// Statistics and Metadata
// ============================================================================

/**
 * Get metadata about the master data
 */
export async function getMetadata(): Promise<MasterDataMetadata> {
  const data = await loadMasterData();
  return data.metadata;
}

/**
 * Get unique values for a field (for filter dropdowns)
 */
export async function getUniqueValues(
  field: 'institutionName' | 'accountName' | 'category'
): Promise<string[]> {
  const transactions = await getAllTransactions();
  const values = new Set<string>();

  transactions.forEach(txn => {
    const value = txn[field];
    if (value) {
      values.add(value);
    }
  });

  return Array.from(values).sort();
}

/**
 * Get all unique tags
 */
export async function getUniqueTags(): Promise<string[]> {
  const transactions = await getAllTransactions();
  const tags = new Set<string>();

  transactions.forEach(txn => {
    txn.tags.forEach(tag => tags.add(tag));
  });

  return Array.from(tags).sort();
}

// ============================================================================
// LocalStorage Fallback (for browser testing)
// ============================================================================

function loadMasterDataFromLocalStorage(): MasterDataFile {
  try {
    const stored = localStorage.getItem(MASTER_DATA_STORAGE_KEY);
    if (!stored) {
      return createDefaultMasterData();
    }

    const data: MasterDataFile = JSON.parse(stored);

    // Check version and migrate if needed
    if (data.version !== MASTER_DATA_VERSION) {
      console.warn(`Master data version mismatch. Expected ${MASTER_DATA_VERSION}, found ${data.version}`);
      // TODO: Add migration logic when schema changes
    }

    return data;
  } catch (error) {
    console.error('Error loading master data from localStorage:', error);
    return createDefaultMasterData();
  }
}

function saveMasterDataToLocalStorage(data: MasterDataFile): void {
  try {
    localStorage.setItem(MASTER_DATA_STORAGE_KEY, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving master data to localStorage:', error);
    throw new Error('Failed to save master data. Storage might be full.');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all master data (for testing)
 */
export async function clearMasterData(): Promise<void> {
  if (isElectron()) {
    // TODO: Implement in Electron
    return;
  }

  localStorage.removeItem(MASTER_DATA_STORAGE_KEY);
}

/**
 * Check if master data exists
 */
export async function hasMasterData(): Promise<boolean> {
  const info = await getFileInfo();
  return info.exists;
}

/**
 * Get transaction count
 */
export async function getTransactionCount(): Promise<number> {
  const data = await loadMasterData();
  return data.transactions.length;
}

/**
 * Get transactions by account (for account usage check)
 */
export async function getTransactionsByAccount(
  institutionName: string,
  accountName: string
): Promise<Transaction[]> {
  const transactions = await getAllTransactions();
  return transactions.filter(
    t => t.institutionName === institutionName && t.accountName === accountName
  );
}

/**
 * Count transactions by account (for account usage check)
 */
export async function countTransactionsByAccount(
  institutionName: string,
  accountName: string
): Promise<number> {
  const transactions = await getTransactionsByAccount(institutionName, accountName);
  return transactions.length;
}
