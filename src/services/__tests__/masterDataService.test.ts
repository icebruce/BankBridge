import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateTransactionInput, Transaction, MasterDataFile, MASTER_DATA_VERSION, createDefaultMasterData } from '../../models/MasterData';

const STORAGE_KEY = 'bankbridge_master_data';

// Mock settingsService
vi.mock('../settingsService', () => ({
  getMasterDataPath: vi.fn().mockResolvedValue('')
}));

// Mock localStorage
let mockLocalStorage: { [key: string]: string } = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
  clear: vi.fn(() => { mockLocalStorage = {}; }),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  date: '2023-06-01',
  merchant: 'Amazon',
  amount: -50.00,
  institutionName: 'TD Bank',
  accountName: 'Checking',
  category: 'Shopping',
  originalStatement: 'AMAZON PURCHASE',
  notes: '',
  tags: [],
  sourceFile: 'test.csv',
  importedAt: '2023-06-15T10:00:00Z',
  ...overrides
});

const createMockMasterData = (transactions: Transaction[] = []): MasterDataFile => ({
  version: MASTER_DATA_VERSION,
  lastUpdated: new Date().toISOString(),
  metadata: {
    totalTransactions: transactions.length,
    dateRange: transactions.length > 0
      ? { earliest: transactions[0].date, latest: transactions[transactions.length - 1].date }
      : { earliest: '', latest: '' },
    accounts: [...new Set(transactions.map(t => `${t.institutionName} - ${t.accountName}`))]
  },
  transactions
});

describe('masterDataService', () => {
  let loadMasterData: typeof import('../masterDataService').loadMasterData;
  let saveMasterData: typeof import('../masterDataService').saveMasterData;
  let getFileInfo: typeof import('../masterDataService').getFileInfo;
  let checkFileModified: typeof import('../masterDataService').checkFileModified;
  let getAllTransactions: typeof import('../masterDataService').getAllTransactions;
  let getTransactions: typeof import('../masterDataService').getTransactions;
  let getTransactionById: typeof import('../masterDataService').getTransactionById;
  let addTransactions: typeof import('../masterDataService').addTransactions;
  let addTransaction: typeof import('../masterDataService').addTransaction;
  let updateTransaction: typeof import('../masterDataService').updateTransaction;
  let deleteTransaction: typeof import('../masterDataService').deleteTransaction;
  let deleteTransactions: typeof import('../masterDataService').deleteTransactions;
  let isDuplicateTransaction: typeof import('../masterDataService').isDuplicateTransaction;
  let findDuplicates: typeof import('../masterDataService').findDuplicates;
  let getMetadata: typeof import('../masterDataService').getMetadata;
  let getUniqueValues: typeof import('../masterDataService').getUniqueValues;
  let getUniqueTags: typeof import('../masterDataService').getUniqueTags;
  let clearMasterData: typeof import('../masterDataService').clearMasterData;
  let hasMasterData: typeof import('../masterDataService').hasMasterData;
  let initializeMasterData: typeof import('../masterDataService').initializeMasterData;
  let getTransactionCount: typeof import('../masterDataService').getTransactionCount;
  let getTransactionsByAccount: typeof import('../masterDataService').getTransactionsByAccount;
  let countTransactionsByAccount: typeof import('../masterDataService').countTransactionsByAccount;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocalStorage = {};
    localStorageMock.getItem.mockImplementation((key: string) => mockLocalStorage[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => { mockLocalStorage[key] = value; });
    localStorageMock.removeItem.mockImplementation((key: string) => { delete mockLocalStorage[key]; });

    // Ensure no electronAPI is available (browser mode)
    (window as any).electronAPI = undefined;

    // Reset modules to ensure fresh import
    vi.resetModules();
    const service = await import('../masterDataService');
    loadMasterData = service.loadMasterData;
    saveMasterData = service.saveMasterData;
    getFileInfo = service.getFileInfo;
    checkFileModified = service.checkFileModified;
    getAllTransactions = service.getAllTransactions;
    getTransactions = service.getTransactions;
    getTransactionById = service.getTransactionById;
    addTransactions = service.addTransactions;
    addTransaction = service.addTransaction;
    updateTransaction = service.updateTransaction;
    deleteTransaction = service.deleteTransaction;
    deleteTransactions = service.deleteTransactions;
    isDuplicateTransaction = service.isDuplicateTransaction;
    findDuplicates = service.findDuplicates;
    getMetadata = service.getMetadata;
    getUniqueValues = service.getUniqueValues;
    getUniqueTags = service.getUniqueTags;
    clearMasterData = service.clearMasterData;
    hasMasterData = service.hasMasterData;
    initializeMasterData = service.initializeMasterData;
    getTransactionCount = service.getTransactionCount;
    getTransactionsByAccount = service.getTransactionsByAccount;
    countTransactionsByAccount = service.countTransactionsByAccount;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadMasterData', () => {
    it('should return default master data when storage is empty', async () => {
      const data = await loadMasterData();

      expect(data.version).toBe(MASTER_DATA_VERSION);
      expect(data.transactions).toEqual([]);
    });

    it('should load master data from localStorage', async () => {
      const transactions = [createMockTransaction()];
      const masterData = createMockMasterData(transactions);
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(masterData);

      const data = await loadMasterData();

      expect(data.transactions.length).toBe(1);
      expect(data.transactions[0].merchant).toBe('Amazon');
    });

    it('should handle corrupted JSON gracefully', async () => {
      mockLocalStorage[STORAGE_KEY] = 'invalid json {{{';

      const data = await loadMasterData();

      expect(data).toEqual(createDefaultMasterData());
    });

    it('should warn on version mismatch', async () => {
      const masterData = createMockMasterData([]);
      masterData.version = '0.0.1'; // Old version
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(masterData);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await loadMasterData();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Master data version mismatch')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('saveMasterData', () => {
    it('should save master data to localStorage', async () => {
      const transactions = [createMockTransaction()];
      const masterData = createMockMasterData(transactions);

      await saveMasterData(masterData);

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.transactions.length).toBe(1);
    });

    it('should update metadata on save', async () => {
      const transactions = [
        createMockTransaction({ date: '2023-01-01' }),
        createMockTransaction({ date: '2023-12-31' })
      ];
      const masterData = createMockMasterData(transactions);

      await saveMasterData(masterData);

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.metadata.totalTransactions).toBe(2);
    });

    it('should update lastUpdated timestamp', async () => {
      const masterData = createMockMasterData([]);
      const before = new Date().toISOString();

      await saveMasterData(masterData);

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.lastUpdated >= before).toBe(true);
    });
  });

  describe('getFileInfo', () => {
    it('should return localStorage info when not in Electron', async () => {
      const info = await getFileInfo();

      expect(info.path).toBe('localStorage');
      expect(info.exists).toBe(false);
    });

    it('should return exists: true when data exists', async () => {
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData([]));

      const info = await getFileInfo();

      expect(info.exists).toBe(true);
    });
  });

  describe('checkFileModified', () => {
    it('should return false in browser mode', async () => {
      const modified = await checkFileModified();

      expect(modified).toBe(false);
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', async () => {
      const transactions = [
        createMockTransaction({ id: 'txn_1' }),
        createMockTransaction({ id: 'txn_2' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getAllTransactions();

      expect(result.length).toBe(2);
    });

    it('should return empty array when no transactions', async () => {
      const result = await getAllTransactions();

      expect(result).toEqual([]);
    });
  });

  describe('getTransactions', () => {
    beforeEach(() => {
      const transactions = [
        createMockTransaction({ id: 'txn_1', date: '2023-01-15', amount: -100, category: 'Shopping' }),
        createMockTransaction({ id: 'txn_2', date: '2023-02-20', amount: -50, category: 'Food' }),
        createMockTransaction({ id: 'txn_3', date: '2023-03-25', amount: 500, category: 'Income' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));
    });

    it('should return paginated results', async () => {
      const result = await getTransactions(undefined, undefined, { page: 1, pageSize: 2 });

      expect(result.items.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by date range', async () => {
      const result = await getTransactions({ dateFrom: '2023-02-01', dateTo: '2023-02-28' });

      expect(result.items.length).toBe(1);
      expect(result.items[0].date).toBe('2023-02-20');
    });

    it('should filter by category', async () => {
      const result = await getTransactions({ category: 'shop' });

      expect(result.items.length).toBe(1);
      expect(result.items[0].category).toBe('Shopping');
    });

    it('should filter by amount range', async () => {
      const result = await getTransactions({ amountMin: 0 });

      expect(result.items.length).toBe(1);
      expect(result.items[0].amount).toBe(500);
    });

    it('should sort by date ascending', async () => {
      const result = await getTransactions(undefined, { field: 'date', direction: 'asc' });

      expect(result.items[0].date).toBe('2023-01-15');
      expect(result.items[2].date).toBe('2023-03-25');
    });

    it('should sort by date descending', async () => {
      const result = await getTransactions(undefined, { field: 'date', direction: 'desc' });

      expect(result.items[0].date).toBe('2023-03-25');
      expect(result.items[2].date).toBe('2023-01-15');
    });

    it('should sort by amount', async () => {
      const result = await getTransactions(undefined, { field: 'amount', direction: 'asc' });

      expect(result.items[0].amount).toBe(-100);
      expect(result.items[2].amount).toBe(500);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction when found', async () => {
      const transactions = [createMockTransaction({ id: 'txn_123' })];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const txn = await getTransactionById('txn_123');

      expect(txn).toBeDefined();
      expect(txn?.id).toBe('txn_123');
    });

    it('should return undefined when not found', async () => {
      const txn = await getTransactionById('non_existent');

      expect(txn).toBeUndefined();
    });
  });

  describe('addTransactions', () => {
    it('should add transactions and return them with IDs', async () => {
      const inputs: CreateTransactionInput[] = [
        {
          date: '2023-06-01',
          merchant: 'Amazon',
          amount: -50,
          institutionName: 'TD Bank',
          accountName: 'Checking',
          category: 'Shopping',
          originalStatement: 'AMAZON',
          notes: '',
          tags: [],
          sourceFile: 'test.csv'
        }
      ];

      const added = await addTransactions(inputs);

      expect(added.length).toBe(1);
      expect(added[0].id).toBeDefined();
      expect(added[0].importedAt).toBeDefined();
    });

    it('should persist transactions to storage', async () => {
      const inputs: CreateTransactionInput[] = [
        {
          date: '2023-06-01',
          merchant: 'Amazon',
          amount: -50,
          institutionName: 'TD Bank',
          accountName: 'Checking',
          category: 'Shopping',
          originalStatement: 'AMAZON',
          notes: '',
          tags: [],
          sourceFile: 'test.csv'
        }
      ];

      await addTransactions(inputs);

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.transactions.length).toBe(1);
    });
  });

  describe('addTransaction', () => {
    it('should add a single transaction', async () => {
      const input: CreateTransactionInput = {
        date: '2023-06-01',
        merchant: 'Amazon',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        category: 'Shopping',
        originalStatement: 'AMAZON',
        notes: '',
        tags: [],
        sourceFile: 'test.csv'
      };

      const added = await addTransaction(input);

      expect(added.id).toBeDefined();
      expect(added.merchant).toBe('Amazon');
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction fields', async () => {
      const transactions = [createMockTransaction({ id: 'txn_123', merchant: 'Amazon' })];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const updated = await updateTransaction('txn_123', { merchant: 'Updated Merchant' });

      expect(updated.merchant).toBe('Updated Merchant');
      expect(updated.id).toBe('txn_123');
    });

    it('should throw error if transaction not found', async () => {
      await expect(updateTransaction('non_existent', { merchant: 'Test' }))
        .rejects.toThrow('Transaction not found: non_existent');
    });

    it('should persist changes to storage', async () => {
      const transactions = [createMockTransaction({ id: 'txn_123' })];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      await updateTransaction('txn_123', { category: 'Updated Category' });

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.transactions[0].category).toBe('Updated Category');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction by ID', async () => {
      const transactions = [
        createMockTransaction({ id: 'txn_1' }),
        createMockTransaction({ id: 'txn_2' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      await deleteTransaction('txn_1');

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.transactions.length).toBe(1);
      expect(stored.transactions[0].id).toBe('txn_2');
    });

    it('should throw error if transaction not found', async () => {
      await expect(deleteTransaction('non_existent'))
        .rejects.toThrow('Transaction not found: non_existent');
    });
  });

  describe('deleteTransactions', () => {
    it('should delete multiple transactions', async () => {
      const transactions = [
        createMockTransaction({ id: 'txn_1' }),
        createMockTransaction({ id: 'txn_2' }),
        createMockTransaction({ id: 'txn_3' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      await deleteTransactions(['txn_1', 'txn_3']);

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.transactions.length).toBe(1);
      expect(stored.transactions[0].id).toBe('txn_2');
    });
  });

  describe('isDuplicateTransaction', () => {
    it('should detect exact duplicates', () => {
      const existing = [createMockTransaction({
        date: '2023-06-01',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        originalStatement: 'AMAZON PURCHASE'
      })];

      const newTxn: CreateTransactionInput = {
        date: '2023-06-01',
        merchant: 'Amazon',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        category: 'Shopping',
        originalStatement: 'AMAZON PURCHASE',
        notes: '',
        tags: [],
        sourceFile: 'test.csv'
      };

      const duplicate = isDuplicateTransaction(newTxn, existing);

      expect(duplicate).not.toBeNull();
    });

    it('should detect duplicates with similar descriptions', () => {
      const existing = [createMockTransaction({
        date: '2023-06-01',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        originalStatement: 'AMAZON PURCHASE'
      })];

      const newTxn: CreateTransactionInput = {
        date: '2023-06-01',
        merchant: 'Amazon',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        category: 'Shopping',
        originalStatement: 'AMAZON  PURCHASE', // Extra space
        notes: '',
        tags: [],
        sourceFile: 'test.csv'
      };

      const duplicate = isDuplicateTransaction(newTxn, existing);

      expect(duplicate).not.toBeNull();
    });

    it('should return null for non-duplicates', () => {
      const existing = [createMockTransaction({
        date: '2023-06-01',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        originalStatement: 'AMAZON PURCHASE'
      })];

      const newTxn: CreateTransactionInput = {
        date: '2023-06-02', // Different date
        merchant: 'Amazon',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        category: 'Shopping',
        originalStatement: 'AMAZON PURCHASE',
        notes: '',
        tags: [],
        sourceFile: 'test.csv'
      };

      const duplicate = isDuplicateTransaction(newTxn, existing);

      expect(duplicate).toBeNull();
    });

    it('should not match transactions from different accounts', () => {
      const existing = [createMockTransaction({
        date: '2023-06-01',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        originalStatement: 'AMAZON PURCHASE'
      })];

      const newTxn: CreateTransactionInput = {
        date: '2023-06-01',
        merchant: 'Amazon',
        amount: -50,
        institutionName: 'Chase', // Different institution
        accountName: 'Savings',
        category: 'Shopping',
        originalStatement: 'AMAZON PURCHASE',
        notes: '',
        tags: [],
        sourceFile: 'test.csv'
      };

      const duplicate = isDuplicateTransaction(newTxn, existing);

      expect(duplicate).toBeNull();
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicates in batch', async () => {
      const existing = [createMockTransaction({
        id: 'existing_1',
        date: '2023-06-01',
        amount: -50,
        institutionName: 'TD Bank',
        accountName: 'Checking',
        originalStatement: 'AMAZON PURCHASE'
      })];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(existing));

      const newTransactions: CreateTransactionInput[] = [
        {
          date: '2023-06-01',
          merchant: 'Amazon',
          amount: -50,
          institutionName: 'TD Bank',
          accountName: 'Checking',
          category: 'Shopping',
          originalStatement: 'AMAZON PURCHASE',
          notes: '',
          tags: [],
          sourceFile: 'test.csv'
        },
        {
          date: '2023-06-02',
          merchant: 'Starbucks',
          amount: -5,
          institutionName: 'TD Bank',
          accountName: 'Checking',
          category: 'Food',
          originalStatement: 'STARBUCKS',
          notes: '',
          tags: [],
          sourceFile: 'test.csv'
        }
      ];

      const duplicates = await findDuplicates(newTransactions);

      expect(duplicates.size).toBe(1);
      expect(duplicates.has(0)).toBe(true);
      expect(duplicates.has(1)).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata from master data', async () => {
      const transactions = [createMockTransaction()];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const metadata = await getMetadata();

      expect(metadata.totalTransactions).toBe(1);
    });
  });

  describe('getUniqueValues', () => {
    it('should return unique institution names', async () => {
      const transactions = [
        createMockTransaction({ institutionName: 'TD Bank' }),
        createMockTransaction({ institutionName: 'Chase' }),
        createMockTransaction({ institutionName: 'TD Bank' }) // Duplicate
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const values = await getUniqueValues('institutionName');

      expect(values).toEqual(['Chase', 'TD Bank']); // Sorted
    });

    it('should return unique categories', async () => {
      const transactions = [
        createMockTransaction({ category: 'Shopping' }),
        createMockTransaction({ category: 'Food' }),
        createMockTransaction({ category: 'Shopping' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const values = await getUniqueValues('category');

      expect(values).toEqual(['Food', 'Shopping']);
    });
  });

  describe('getUniqueTags', () => {
    it('should return unique tags', async () => {
      const transactions = [
        createMockTransaction({ tags: ['work', 'expense'] }),
        createMockTransaction({ tags: ['personal', 'expense'] }),
        createMockTransaction({ tags: [] })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const tags = await getUniqueTags();

      expect(tags).toEqual(['expense', 'personal', 'work']);
    });
  });

  describe('clearMasterData', () => {
    it('should remove master data from localStorage', async () => {
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData([]));

      await clearMasterData();

      expect(mockLocalStorage[STORAGE_KEY]).toBeUndefined();
    });
  });

  describe('hasMasterData', () => {
    it('should return false when no data exists', async () => {
      const exists = await hasMasterData();

      expect(exists).toBe(false);
    });

    it('should return true when data exists', async () => {
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData([]));

      const exists = await hasMasterData();

      expect(exists).toBe(true);
    });
  });

  describe('initializeMasterData', () => {
    it('should create empty master data', async () => {
      const data = await initializeMasterData();

      expect(data.transactions).toEqual([]);
      expect(data.version).toBe(MASTER_DATA_VERSION);
    });

    it('should save to storage', async () => {
      await initializeMasterData();

      expect(mockLocalStorage[STORAGE_KEY]).toBeDefined();
    });
  });

  describe('getTransactionCount', () => {
    it('should return transaction count', async () => {
      const transactions = [
        createMockTransaction(),
        createMockTransaction(),
        createMockTransaction()
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const count = await getTransactionCount();

      expect(count).toBe(3);
    });

    it('should return 0 when empty', async () => {
      const count = await getTransactionCount();

      expect(count).toBe(0);
    });
  });

  describe('getTransactionsByAccount', () => {
    it('should return transactions for specific account', async () => {
      const transactions = [
        createMockTransaction({ institutionName: 'TD Bank', accountName: 'Checking' }),
        createMockTransaction({ institutionName: 'Chase', accountName: 'Savings' }),
        createMockTransaction({ institutionName: 'TD Bank', accountName: 'Checking' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactionsByAccount('TD Bank', 'Checking');

      expect(result.length).toBe(2);
    });
  });

  describe('countTransactionsByAccount', () => {
    it('should return count for specific account', async () => {
      const transactions = [
        createMockTransaction({ institutionName: 'TD Bank', accountName: 'Checking' }),
        createMockTransaction({ institutionName: 'Chase', accountName: 'Savings' }),
        createMockTransaction({ institutionName: 'TD Bank', accountName: 'Checking' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const count = await countTransactionsByAccount('TD Bank', 'Checking');

      expect(count).toBe(2);
    });
  });

  describe('Filtering', () => {
    it('should filter by institution name', async () => {
      const transactions = [
        createMockTransaction({ id: 'filter_1', institutionName: 'TD Bank', accountName: 'Checking', merchant: 'Store1' }),
        createMockTransaction({ id: 'filter_2', institutionName: 'Chase', accountName: 'Savings', merchant: 'Store2' }),
        createMockTransaction({ id: 'filter_3', institutionName: 'TD Bank', accountName: 'Savings', merchant: 'Store3' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactions({ institutionName: 'td' });

      expect(result.items.length).toBe(2);
    });

    it('should filter by account name', async () => {
      const transactions = [
        createMockTransaction({ id: 'filter_1', institutionName: 'TD Bank', accountName: 'Checking', merchant: 'Store1' }),
        createMockTransaction({ id: 'filter_2', institutionName: 'Chase', accountName: 'Savings', merchant: 'Store2' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactions({ accountName: 'check' });

      expect(result.items.length).toBe(1);
    });

    it('should filter by search text in merchant', async () => {
      // Clear and set fresh data
      mockLocalStorage = {};
      const transactions = [
        createMockTransaction({ id: 'search_1', merchant: 'Target Store', originalStatement: 'TARGET' }),
        createMockTransaction({ id: 'search_2', merchant: 'Starbucks', originalStatement: 'STARBUCKS' }),
        createMockTransaction({ id: 'search_3', merchant: 'Walmart', originalStatement: 'WALMART' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactions({ searchText: 'target' });

      expect(result.items.length).toBe(1);
      expect(result.items[0].merchant).toBe('Target Store');
    });

    it('should filter by search text in notes', async () => {
      const transactions = [
        createMockTransaction({ id: 'filter_1', notes: 'online order' }),
        createMockTransaction({ id: 'filter_2', notes: 'coffee purchase' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactions({ searchText: 'coffee' });

      expect(result.items.length).toBe(1);
    });

    it('should filter by tags', async () => {
      const transactions = [
        createMockTransaction({ id: 'filter_1', merchant: 'Amazon', tags: ['shopping', 'online'] }),
        createMockTransaction({ id: 'filter_2', merchant: 'Starbucks', tags: ['food'] }),
        createMockTransaction({ id: 'filter_3', merchant: 'Walmart', tags: [] })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactions({ tags: ['shopping'] });

      expect(result.items.length).toBe(1);
      expect(result.items[0].merchant).toBe('Amazon');
    });

    it('should combine multiple filters', async () => {
      const transactions = [
        createMockTransaction({ id: 'filter_1', institutionName: 'TD Bank', accountName: 'Checking' }),
        createMockTransaction({ id: 'filter_2', institutionName: 'Chase', accountName: 'Savings' }),
        createMockTransaction({ id: 'filter_3', institutionName: 'TD Bank', accountName: 'Savings' })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactions({ institutionName: 'TD', accountName: 'Check' });

      expect(result.items.length).toBe(1);
    });
  });

  describe('Sorting by tags', () => {
    it('should sort by tag count', async () => {
      const transactions = [
        createMockTransaction({ id: 'txn_1', tags: ['a'] }),
        createMockTransaction({ id: 'txn_2', tags: ['a', 'b', 'c'] }),
        createMockTransaction({ id: 'txn_3', tags: ['a', 'b'] })
      ];
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createMockMasterData(transactions));

      const result = await getTransactions(undefined, { field: 'tags', direction: 'asc' });

      expect(result.items[0].tags.length).toBe(1);
      expect(result.items[2].tags.length).toBe(3);
    });
  });
});
