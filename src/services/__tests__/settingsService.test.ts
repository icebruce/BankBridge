import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsFile, SETTINGS_VERSION, createDefaultSettings } from '../../models/Settings';

// Mock masterDataService to avoid circular dependency issues
const mockCountTransactionsByAccount = vi.fn().mockResolvedValue(0);
vi.mock('../masterDataService', () => ({
  countTransactionsByAccount: mockCountTransactionsByAccount
}));

// Mock importTemplateService for account-template integration tests
const mockGetTemplatesByAccountId = vi.fn().mockReturnValue([]);
vi.mock('../importTemplateService', () => ({
  getTemplatesByAccountId: mockGetTemplatesByAccountId
}));

const STORAGE_KEY = 'bankbridge_settings';

// Create a mock localStorage
let mockLocalStorage: { [key: string]: string } = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
  clear: vi.fn(() => { mockLocalStorage = {}; }),
  length: 0,
  key: vi.fn()
};

// Define globally before imports
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('settingsService', () => {
  // Import the service dynamically to ensure mocks are set up
  let loadSettings: typeof import('../settingsService').loadSettings;
  let saveSettings: typeof import('../settingsService').saveSettings;
  let getAccounts: typeof import('../settingsService').getAccounts;
  let getAccountById: typeof import('../settingsService').getAccountById;
  let getAccountByNames: typeof import('../settingsService').getAccountByNames;
  let createAccount: typeof import('../settingsService').createAccount;
  let updateAccount: typeof import('../settingsService').updateAccount;
  let deleteAccount: typeof import('../settingsService').deleteAccount;
  let checkAccountUsage: typeof import('../settingsService').checkAccountUsage;
  let getMasterDataPath: typeof import('../settingsService').getMasterDataPath;
  let setMasterDataPath: typeof import('../settingsService').setMasterDataPath;
  let getExportDisplayName: typeof import('../settingsService').getExportDisplayName;
  let clearSettings: typeof import('../settingsService').clearSettings;
  let hasAccounts: typeof import('../settingsService').hasAccounts;
  let getAccountsForDropdown: typeof import('../settingsService').getAccountsForDropdown;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocalStorage = {};
    localStorageMock.getItem.mockImplementation((key: string) => mockLocalStorage[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => { mockLocalStorage[key] = value; });
    localStorageMock.removeItem.mockImplementation((key: string) => { delete mockLocalStorage[key]; });
    mockCountTransactionsByAccount.mockResolvedValue(0);
    mockGetTemplatesByAccountId.mockReturnValue([]);

    // Ensure no electronAPI is available (browser mode)
    (window as any).electronAPI = undefined;

    // Reset modules to ensure fresh import with mocked localStorage
    vi.resetModules();
    const service = await import('../settingsService');
    loadSettings = service.loadSettings;
    saveSettings = service.saveSettings;
    getAccounts = service.getAccounts;
    getAccountById = service.getAccountById;
    getAccountByNames = service.getAccountByNames;
    createAccount = service.createAccount;
    updateAccount = service.updateAccount;
    deleteAccount = service.deleteAccount;
    checkAccountUsage = service.checkAccountUsage;
    getMasterDataPath = service.getMasterDataPath;
    setMasterDataPath = service.setMasterDataPath;
    getExportDisplayName = service.getExportDisplayName;
    clearSettings = service.clearSettings;
    hasAccounts = service.hasAccounts;
    getAccountsForDropdown = service.getAccountsForDropdown;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadSettings', () => {
    it('should return default settings when storage is empty', async () => {
      const settings = await loadSettings();

      expect(settings).toEqual(createDefaultSettings());
      expect(settings.version).toBe(SETTINGS_VERSION);
      expect(settings.accounts).toEqual([]);
    });

    it('should load settings from localStorage', async () => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            accountType: 'checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '/path/to/data' }
      };

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);

      const settings = await loadSettings();

      expect(settings.accounts.length).toBe(1);
      expect(settings.accounts[0].institutionName).toBe('TD Bank');
      expect(settings.preferences.masterDataPath).toBe('/path/to/data');
    });

    it('should handle corrupted JSON gracefully', async () => {
      mockLocalStorage[STORAGE_KEY] = 'invalid json {{{';

      const settings = await loadSettings();

      expect(settings).toEqual(createDefaultSettings());
    });

    it('should warn on version mismatch but still load data', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const storedSettings: SettingsFile = {
        version: '0.0.1', // Old version
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);

      const settings = await loadSettings();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Settings version mismatch')
      );
      expect(settings.accounts.length).toBe(1);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage', async () => {
      const settings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [],
        preferences: { masterDataPath: '/new/path' }
      };

      await saveSettings(settings);

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.preferences.masterDataPath).toBe('/new/path');
    });

    it('should preserve formatting in saved JSON', async () => {
      const settings = createDefaultSettings();

      await saveSettings(settings);

      // Check that it's formatted (has newlines)
      expect(mockLocalStorage[STORAGE_KEY]).toContain('\n');
    });
  });

  describe('getAccounts', () => {
    it('should return empty array when no accounts exist', async () => {
      const accounts = await getAccounts();

      expect(accounts).toEqual([]);
    });

    it('should return all accounts', async () => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            id: 'acc_2',
            institutionName: 'Chase',
            accountName: 'Savings',
            exportDisplayName: 'Chase - Savings',
            createdAt: '2023-01-02T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);

      const accounts = await getAccounts();

      expect(accounts.length).toBe(2);
      expect(accounts[0].institutionName).toBe('TD Bank');
      expect(accounts[1].institutionName).toBe('Chase');
    });
  });

  describe('getAccountById', () => {
    beforeEach(() => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);
    });

    it('should return account when found', async () => {
      const account = await getAccountById('acc_1');

      expect(account).toBeDefined();
      expect(account?.institutionName).toBe('TD Bank');
    });

    it('should return undefined when account not found', async () => {
      const account = await getAccountById('non_existent');

      expect(account).toBeUndefined();
    });
  });

  describe('getAccountByNames', () => {
    beforeEach(() => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);
    });

    it('should return account when found by names', async () => {
      const account = await getAccountByNames('TD Bank', 'Checking');

      expect(account).toBeDefined();
      expect(account?.id).toBe('acc_1');
    });

    it('should return undefined when not found', async () => {
      const account = await getAccountByNames('Chase', 'Savings');

      expect(account).toBeUndefined();
    });
  });

  describe('createAccount', () => {
    it('should create account with generated ID', async () => {
      const input = {
        institutionName: 'TD Bank',
        accountName: 'Checking',
        accountType: 'checking' as const
      };

      const account = await createAccount(input);

      expect(account.id).toMatch(/^acc_\d+_[a-z0-9]+$/);
      expect(account.institutionName).toBe('TD Bank');
      expect(account.accountName).toBe('Checking');
      expect(account.accountType).toBe('checking');
    });

    it('should generate exportDisplayName automatically', async () => {
      const input = {
        institutionName: 'Chase',
        accountName: 'Savings'
      };

      const account = await createAccount(input);

      expect(account.exportDisplayName).toBe('Chase - Savings');
    });

    it('should use custom exportDisplayName if provided', async () => {
      const input = {
        institutionName: 'Bank of America',
        accountName: 'Credit Card',
        exportDisplayName: 'BoA CC'
      };

      const account = await createAccount(input);

      expect(account.exportDisplayName).toBe('BoA CC');
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const before = new Date().toISOString();

      const account = await createAccount({
        institutionName: 'TD Bank',
        accountName: 'Checking'
      });

      const after = new Date().toISOString();

      expect(account.createdAt).toBeTruthy();
      expect(account.updatedAt).toBeTruthy();
      expect(account.createdAt).toBe(account.updatedAt);
    });

    it('should persist account to storage', async () => {
      await createAccount({
        institutionName: 'TD Bank',
        accountName: 'Checking'
      });

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.accounts.length).toBe(1);
      expect(stored.accounts[0].institutionName).toBe('TD Bank');
    });
  });

  describe('updateAccount', () => {
    beforeEach(() => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);
    });

    it('should update account fields', async () => {
      const updated = await updateAccount('acc_1', {
        accountName: 'Primary Checking'
      });

      expect(updated.accountName).toBe('Primary Checking');
      expect(updated.institutionName).toBe('TD Bank'); // Unchanged
    });

    it('should update updatedAt timestamp', async () => {
      const before = '2023-01-01T00:00:00Z';

      const updated = await updateAccount('acc_1', {
        accountName: 'Primary Checking'
      });

      expect(updated.updatedAt).not.toBe(before);
    });

    it('should auto-update exportDisplayName when institution or account name changes', async () => {
      const updated = await updateAccount('acc_1', {
        accountName: 'Savings'
      });

      expect(updated.exportDisplayName).toBe('TD Bank - Savings');
    });

    it('should not auto-update exportDisplayName if explicitly provided', async () => {
      const updated = await updateAccount('acc_1', {
        accountName: 'Savings',
        exportDisplayName: 'Custom Display Name'
      });

      expect(updated.exportDisplayName).toBe('Custom Display Name');
    });

    it('should throw error if account not found', async () => {
      await expect(updateAccount('non_existent', { accountName: 'Test' }))
        .rejects.toThrow('Account not found: non_existent');
    });

    it('should persist changes to storage', async () => {
      await updateAccount('acc_1', { accountName: 'Primary Checking' });

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.accounts[0].accountName).toBe('Primary Checking');
    });
  });

  describe('deleteAccount', () => {
    beforeEach(async () => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            id: 'acc_2',
            institutionName: 'Chase',
            accountName: 'Savings',
            exportDisplayName: 'Chase - Savings',
            createdAt: '2023-01-02T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);
    });

    it('should delete account from storage', async () => {
      await deleteAccount('acc_1');

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.accounts.length).toBe(1);
      expect(stored.accounts[0].id).toBe('acc_2');
    });

    it('should throw error if account is in use by transactions', async () => {
      mockCountTransactionsByAccount.mockResolvedValue(10);

      await expect(deleteAccount('acc_1'))
        .rejects.toThrow('Cannot delete account. In use by: 10 transaction(s)');
    });

    it('should throw error if account is in use by import templates', async () => {
      mockGetTemplatesByAccountId.mockReturnValue(['Template 1', 'Template 2']);

      await expect(deleteAccount('acc_1'))
        .rejects.toThrow('Cannot delete account. In use by: 2 import template(s)');
    });

    it('should throw error with both templates and transactions', async () => {
      mockGetTemplatesByAccountId.mockReturnValue(['TD Template']);
      mockCountTransactionsByAccount.mockResolvedValue(50);

      await expect(deleteAccount('acc_1'))
        .rejects.toThrow('Cannot delete account. In use by: 1 import template(s), 50 transaction(s)');
    });

    it('should succeed when no templates or transactions reference the account', async () => {
      mockGetTemplatesByAccountId.mockReturnValue([]);
      mockCountTransactionsByAccount.mockResolvedValue(0);

      await deleteAccount('acc_1');

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.accounts.length).toBe(1);
      expect(stored.accounts[0].id).toBe('acc_2');
    });
  });

  describe('checkAccountUsage', () => {
    beforeEach(() => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);
    });

    it('should return inUse: false when account has no usage', async () => {
      const usage = await checkAccountUsage('acc_1');

      expect(usage.inUse).toBe(false);
      expect(usage.usedBy.transactions).toBe(0);
      expect(usage.usedBy.importTemplates).toEqual([]);
    });

    it('should return inUse: true when account has transactions', async () => {
      mockCountTransactionsByAccount.mockResolvedValue(25);

      const usage = await checkAccountUsage('acc_1');

      expect(usage.inUse).toBe(true);
      expect(usage.usedBy.transactions).toBe(25);
    });

    it('should return inUse: false for non-existent account', async () => {
      const usage = await checkAccountUsage('non_existent');

      expect(usage.inUse).toBe(false);
    });

    it('should return inUse: true when account has import templates', async () => {
      mockGetTemplatesByAccountId.mockReturnValue(['TD Import Template', 'TD Backup Template']);

      const usage = await checkAccountUsage('acc_1');

      expect(usage.inUse).toBe(true);
      expect(usage.usedBy.importTemplates).toEqual(['TD Import Template', 'TD Backup Template']);
      expect(usage.usedBy.transactions).toBe(0);
    });

    it('should return combined usage from both templates and transactions', async () => {
      mockGetTemplatesByAccountId.mockReturnValue(['TD Template']);
      mockCountTransactionsByAccount.mockResolvedValue(100);

      const usage = await checkAccountUsage('acc_1');

      expect(usage.inUse).toBe(true);
      expect(usage.usedBy.importTemplates).toEqual(['TD Template']);
      expect(usage.usedBy.transactions).toBe(100);
    });

    it('should call getTemplatesByAccountId with correct account ID', async () => {
      await checkAccountUsage('acc_1');

      expect(mockGetTemplatesByAccountId).toHaveBeenCalledWith('acc_1');
    });

    it('should call countTransactionsByAccount with correct parameters', async () => {
      await checkAccountUsage('acc_1');

      expect(mockCountTransactionsByAccount).toHaveBeenCalledWith('TD Bank', 'Checking');
    });
  });

  describe('getMasterDataPath', () => {
    it('should return empty string when not configured', async () => {
      const path = await getMasterDataPath();

      expect(path).toBe('');
    });

    it('should return configured path', async () => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [],
        preferences: { masterDataPath: '/path/to/data.json' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);

      const path = await getMasterDataPath();

      expect(path).toBe('/path/to/data.json');
    });
  });

  describe('setMasterDataPath', () => {
    it('should save master data path', async () => {
      await setMasterDataPath('/new/path/to/data.json');

      const stored = JSON.parse(mockLocalStorage[STORAGE_KEY]);
      expect(stored.preferences.masterDataPath).toBe('/new/path/to/data.json');
    });
  });

  describe('getExportDisplayName', () => {
    beforeEach(() => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'My TD Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);
    });

    it('should return configured export display name', async () => {
      const name = await getExportDisplayName('TD Bank', 'Checking');

      expect(name).toBe('My TD Checking');
    });

    it('should generate fallback name for unknown account', async () => {
      const name = await getExportDisplayName('Chase', 'Savings');

      expect(name).toBe('Chase - Savings');
    });
  });

  describe('clearSettings', () => {
    it('should remove settings from localStorage', async () => {
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(createDefaultSettings());

      await clearSettings();

      expect(mockLocalStorage[STORAGE_KEY]).toBeUndefined();
    });
  });

  describe('hasAccounts', () => {
    it('should return false when no accounts exist', async () => {
      const result = await hasAccounts();

      expect(result).toBe(false);
    });

    it('should return true when accounts exist', async () => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);

      const result = await hasAccounts();

      expect(result).toBe(true);
    });
  });

  describe('getAccountsForDropdown', () => {
    it('should return empty array when no accounts', async () => {
      const options = await getAccountsForDropdown();

      expect(options).toEqual([]);
    });

    it('should return formatted dropdown options', async () => {
      const storedSettings: SettingsFile = {
        version: SETTINGS_VERSION,
        accounts: [
          {
            id: 'acc_1',
            institutionName: 'TD Bank',
            accountName: 'Checking',
            exportDisplayName: 'TD Bank - Checking',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            id: 'acc_2',
            institutionName: 'Chase',
            accountName: 'Savings',
            exportDisplayName: 'Chase - Savings',
            createdAt: '2023-01-02T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z'
          }
        ],
        preferences: { masterDataPath: '' }
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedSettings);

      const options = await getAccountsForDropdown();

      expect(options).toEqual([
        {
          value: 'acc_1',
          label: 'TD Bank - Checking',
          institution: 'TD Bank',
          account: 'Checking'
        },
        {
          value: 'acc_2',
          label: 'Chase - Savings',
          institution: 'Chase',
          account: 'Savings'
        }
      ]);
    });
  });

  describe('Round-trip persistence', () => {
    it('should preserve account data through create → load → update cycle', async () => {
      // Create account
      const created = await createAccount({
        institutionName: 'TD Bank',
        accountName: 'Checking',
        accountType: 'checking'
      });

      // Load accounts
      const loadedAccounts = await getAccounts();
      expect(loadedAccounts.length).toBe(1);
      expect(loadedAccounts[0].id).toBe(created.id);

      // Update account
      const updated = await updateAccount(created.id, {
        accountName: 'Primary Checking'
      });

      // Verify persistence
      const finalAccounts = await getAccounts();
      expect(finalAccounts[0].accountName).toBe('Primary Checking');
      expect(finalAccounts[0].institutionName).toBe('TD Bank');
    });

    it('should preserve multiple accounts correctly', async () => {
      await createAccount({ institutionName: 'TD Bank', accountName: 'Checking' });
      await createAccount({ institutionName: 'Chase', accountName: 'Savings' });
      await createAccount({ institutionName: 'BoA', accountName: 'Credit Card' });

      const accounts = await getAccounts();
      expect(accounts.length).toBe(3);

      // Delete middle account
      await deleteAccount(accounts[1].id);

      const remaining = await getAccounts();
      expect(remaining.length).toBe(2);
      expect(remaining[0].institutionName).toBe('TD Bank');
      expect(remaining[1].institutionName).toBe('BoA');
    });
  });
});
