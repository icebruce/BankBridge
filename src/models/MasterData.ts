/**
 * Master Data Models
 *
 * This module defines the data structures for transaction storage
 * in the master_data.json file. The internal format is fixed and
 * controlled by the application - external format changes only
 * require template updates, not data migration.
 */

/**
 * Transaction in internal format
 * This is the canonical format for all stored transactions
 */
export interface Transaction {
  /** Unique identifier (auto-generated) */
  id: string;

  /** Transaction date in YYYY-MM-DD format */
  date: string;

  /** Merchant/payee name */
  merchant: string;

  /** Transaction category */
  category: string;

  /** Financial institution name (e.g., "TD Bank") */
  institutionName: string;

  /** Account name within the institution (e.g., "Checking") */
  accountName: string;

  /** Bank's original transaction description */
  originalStatement: string;

  /** User-added notes */
  notes: string;

  /** Transaction amount (negative = debit, positive = credit) */
  amount: number;

  /** Array of tags */
  tags: string[];

  /** Original import file name for tracking */
  sourceFile: string;

  /** ISO timestamp of when the transaction was imported */
  importedAt: string;
}

/**
 * Metadata about the master data file
 */
export interface MasterDataMetadata {
  /** Total number of transactions */
  totalTransactions: number;

  /** Date range of transactions */
  dateRange: {
    earliest: string;
    latest: string;
  };
}

/**
 * Master data file structure (master_data.json)
 */
export interface MasterDataFile {
  /** Schema version for migration support */
  version: string;

  /** ISO timestamp of last update */
  lastUpdated: string;

  /** Array of all transactions */
  transactions: Transaction[];

  /** Computed metadata */
  metadata: MasterDataMetadata;
}

/**
 * Current schema version for master_data.json
 */
export const MASTER_DATA_VERSION = '1.0.0';

/**
 * Available internal fields for export mapping
 * These are the fields that can be mapped in Export Templates
 *
 * Note: institutionName and accountName are stored internally but not
 * available for direct export. Use 'exportDisplayName' (labeled "Account"
 * in UI) which combines them from Account Configuration.
 */
export const INTERNAL_FIELDS = [
  'date',
  'merchant',
  'category',
  'exportDisplayName',  // Computed field - looked up from Account config (shows as "Account" in UI)
  'originalStatement',
  'notes',
  'amount',
  'tags'
] as const;

export type InternalField = typeof INTERNAL_FIELDS[number];

/**
 * Field descriptions for UI display
 */
export const INTERNAL_FIELD_DESCRIPTIONS: Record<InternalField, string> = {
  date: 'Transaction date',
  merchant: 'Merchant/payee name',
  category: 'Transaction category',
  exportDisplayName: 'Account name from Settings (e.g., "TD Bank - Checking")',
  originalStatement: "Bank's original description",
  notes: 'User notes',
  amount: 'Transaction amount',
  tags: 'Tags (comma-joined)'
};

/**
 * Generates a unique transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `txn_${timestamp}_${random}`;
}

/**
 * Creates a default empty master data file
 */
export function createDefaultMasterData(): MasterDataFile {
  return {
    version: MASTER_DATA_VERSION,
    lastUpdated: new Date().toISOString(),
    transactions: [],
    metadata: {
      totalTransactions: 0,
      dateRange: {
        earliest: '',
        latest: ''
      }
    }
  };
}

/**
 * Computes metadata from transactions
 */
export function computeMetadata(transactions: Transaction[]): MasterDataMetadata {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      dateRange: {
        earliest: '',
        latest: ''
      }
    };
  }

  const dates = transactions.map(t => t.date).filter(d => d).sort();

  return {
    totalTransactions: transactions.length,
    dateRange: {
      earliest: dates[0] || '',
      latest: dates[dates.length - 1] || ''
    }
  };
}

/**
 * Input for creating a new transaction (without auto-generated fields)
 */
export interface CreateTransactionInput {
  date: string;
  merchant: string;
  category: string;
  institutionName: string;
  accountName: string;
  originalStatement: string;
  notes?: string;
  amount: number;
  tags?: string[];
  sourceFile: string;
}

/**
 * Creates a new transaction with auto-generated fields
 */
export function createTransaction(input: CreateTransactionInput): Transaction {
  return {
    id: generateTransactionId(),
    date: input.date,
    merchant: input.merchant,
    category: input.category,
    institutionName: input.institutionName,
    accountName: input.accountName,
    originalStatement: input.originalStatement,
    notes: input.notes || '',
    amount: input.amount,
    tags: input.tags || [],
    sourceFile: input.sourceFile,
    importedAt: new Date().toISOString()
  };
}

/**
 * Filter options for querying transactions
 */
export interface TransactionFilterOptions {
  /** Filter by date range */
  dateFrom?: string;
  dateTo?: string;

  /** Filter by institution */
  institutionName?: string;

  /** Filter by account */
  accountName?: string;

  /** Filter by category */
  category?: string;

  /** Search text (matches merchant, originalStatement, notes) */
  searchText?: string;

  /** Filter by amount range */
  amountMin?: number;
  amountMax?: number;

  /** Filter by tags (any match) */
  tags?: string[];
}

/**
 * Sort options for transactions
 */
export interface TransactionSortOptions {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Import diff result for showing changes before applying import
 */
export interface ImportDiff {
  /** New records that will be added */
  newRecords: Transaction[];

  /** Records that have been modified */
  modifiedRecords: {
    current: Transaction;
    imported: Transaction;
    changedFields: string[];
  }[];

  /** Records that will be removed */
  removedRecords: Transaction[];

  /** Count of records that are unchanged */
  unchangedCount: number;
}

/**
 * File info for the master data file
 */
export interface MasterDataFileInfo {
  path: string;
  exists: boolean;
  lastModified?: Date;
  size?: number;
}
