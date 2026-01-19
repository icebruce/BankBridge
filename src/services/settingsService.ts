/**
 * Settings Service
 *
 * Handles account configuration and application preferences.
 * Works in both browser (localStorage fallback) and Electron (IPC to main process).
 */

import {
  Account,
  SettingsFile,
  CreateAccountInput,
  UpdateAccountInput,
  AccountUsageResult,
  createDefaultSettings,
  generateAccountId,
  generateExportDisplayName,
  SETTINGS_VERSION
} from '../models/Settings';

const SETTINGS_STORAGE_KEY = 'bankbridge_settings';

/**
 * Check if running in Electron environment
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' &&
         typeof (window as any).electronAPI !== 'undefined';
}

// ============================================================================
// Core Settings Operations
// ============================================================================

/**
 * Load settings from storage
 */
export async function loadSettings(): Promise<SettingsFile> {
  if (isElectron()) {
    try {
      return await (window as any).electronAPI.settings.load();
    } catch (error) {
      console.error('Error loading settings from Electron:', error);
      return createDefaultSettings();
    }
  }

  // Browser fallback (localStorage)
  return loadSettingsFromLocalStorage();
}

/**
 * Save settings to storage
 */
export async function saveSettings(settings: SettingsFile): Promise<void> {
  if (isElectron()) {
    try {
      await (window as any).electronAPI.settings.save(settings);
      return;
    } catch (error) {
      console.error('Error saving settings to Electron:', error);
      throw new Error('Failed to save settings');
    }
  }

  // Browser fallback (localStorage)
  saveSettingsToLocalStorage(settings);
}

// ============================================================================
// Account Operations
// ============================================================================

/**
 * Get all accounts
 */
export async function getAccounts(): Promise<Account[]> {
  const settings = await loadSettings();
  return settings.accounts;
}

/**
 * Get a single account by ID
 */
export async function getAccountById(id: string): Promise<Account | undefined> {
  const accounts = await getAccounts();
  return accounts.find(a => a.id === id);
}

/**
 * Get account by institution and account name
 */
export async function getAccountByNames(
  institutionName: string,
  accountName: string
): Promise<Account | undefined> {
  const accounts = await getAccounts();
  return accounts.find(
    a => a.institutionName === institutionName && a.accountName === accountName
  );
}

/**
 * Create a new account
 */
export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const settings = await loadSettings();
  const now = new Date().toISOString();

  const newAccount: Account = {
    id: generateAccountId(),
    institutionName: input.institutionName,
    accountName: input.accountName,
    exportDisplayName: input.exportDisplayName ||
      generateExportDisplayName(input.institutionName, input.accountName),
    accountType: input.accountType,
    createdAt: now,
    updatedAt: now
  };

  settings.accounts.push(newAccount);
  await saveSettings(settings);

  return newAccount;
}

/**
 * Update an existing account
 */
export async function updateAccount(
  id: string,
  updates: UpdateAccountInput
): Promise<Account> {
  const settings = await loadSettings();
  const index = settings.accounts.findIndex(a => a.id === id);

  if (index === -1) {
    throw new Error(`Account not found: ${id}`);
  }

  const existingAccount = settings.accounts[index];
  const updatedAccount: Account = {
    ...existingAccount,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Auto-update exportDisplayName if institution or account name changed
  // and exportDisplayName wasn't explicitly provided
  if (!updates.exportDisplayName &&
      (updates.institutionName || updates.accountName)) {
    updatedAccount.exportDisplayName = generateExportDisplayName(
      updatedAccount.institutionName,
      updatedAccount.accountName
    );
  }

  settings.accounts[index] = updatedAccount;
  await saveSettings(settings);

  return updatedAccount;
}

/**
 * Delete an account
 * @throws Error if account is in use
 */
export async function deleteAccount(id: string): Promise<void> {
  // Check if account is in use
  const usage = await checkAccountUsage(id);
  if (usage.inUse) {
    const reasons: string[] = [];
    if (usage.usedBy.importTemplates.length > 0) {
      reasons.push(`${usage.usedBy.importTemplates.length} import template(s)`);
    }
    if (usage.usedBy.transactions > 0) {
      reasons.push(`${usage.usedBy.transactions} transaction(s)`);
    }
    throw new Error(`Cannot delete account. In use by: ${reasons.join(', ')}`);
  }

  const settings = await loadSettings();
  settings.accounts = settings.accounts.filter(a => a.id !== id);
  await saveSettings(settings);
}

/**
 * Check if an account is in use by import templates or transactions
 */
export async function checkAccountUsage(id: string): Promise<AccountUsageResult> {
  const account = await getAccountById(id);
  if (!account) {
    return {
      inUse: false,
      usedBy: { importTemplates: [], transactions: 0 }
    };
  }

  // Check import templates
  const { getTemplatesByAccountId } = await import('./importTemplateService');
  const importTemplates = getTemplatesByAccountId(id);

  // Check transactions in master data
  // Dynamic import to avoid circular dependency
  const { countTransactionsByAccount } = await import('./masterDataService');
  const transactions = await countTransactionsByAccount(
    account.institutionName,
    account.accountName
  );

  return {
    inUse: importTemplates.length > 0 || transactions > 0,
    usedBy: {
      importTemplates,
      transactions
    }
  };
}

// ============================================================================
// Preferences Operations
// ============================================================================

/**
 * Get the master data file path
 */
export async function getMasterDataPath(): Promise<string> {
  const settings = await loadSettings();
  return settings.preferences.masterDataPath;
}

/**
 * Set the master data file path
 */
export async function setMasterDataPath(path: string): Promise<void> {
  const settings = await loadSettings();
  settings.preferences.masterDataPath = path;
  await saveSettings(settings);
}

// ============================================================================
// Export Display Name Lookup
// ============================================================================

/**
 * Get the export display name for a transaction
 * Used when exporting to look up the configured display name
 */
export async function getExportDisplayName(
  institutionName: string,
  accountName: string
): Promise<string> {
  const account = await getAccountByNames(institutionName, accountName);

  if (account) {
    return account.exportDisplayName;
  }

  // Fallback if account not found in config
  return generateExportDisplayName(institutionName, accountName);
}

// ============================================================================
// LocalStorage Fallback (for browser testing)
// ============================================================================

function loadSettingsFromLocalStorage(): SettingsFile {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return createDefaultSettings();
    }

    const data: SettingsFile = JSON.parse(stored);

    // Check version and migrate if needed
    if (data.version !== SETTINGS_VERSION) {
      console.warn(`Settings version mismatch. Expected ${SETTINGS_VERSION}, found ${data.version}`);
      // TODO: Add migration logic when schema changes
    }

    return data;
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    return createDefaultSettings();
  }
}

function saveSettingsToLocalStorage(settings: SettingsFile): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
    throw new Error('Failed to save settings. Storage might be full.');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all settings (for testing)
 */
export async function clearSettings(): Promise<void> {
  if (isElectron()) {
    // TODO: Implement in Electron
    return;
  }

  localStorage.removeItem(SETTINGS_STORAGE_KEY);
}

/**
 * Check if accounts are configured
 */
export async function hasAccounts(): Promise<boolean> {
  const accounts = await getAccounts();
  return accounts.length > 0;
}

/**
 * Get accounts formatted for dropdown selection
 */
export async function getAccountsForDropdown(): Promise<Array<{
  value: string;
  label: string;
  institution: string;
  account: string;
}>> {
  const accounts = await getAccounts();
  return accounts.map(a => ({
    value: a.id,
    label: `${a.institutionName} - ${a.accountName}`,
    institution: a.institutionName,
    account: a.accountName
  }));
}
