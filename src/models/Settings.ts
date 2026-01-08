/**
 * Settings and Account Configuration Models
 *
 * This module defines the data structures for account configuration
 * and application settings stored in settings.json
 */

/**
 * Account type options for categorization
 */
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment';

/**
 * Account configuration
 * Represents a financial account with institution and account details
 */
export interface Account {
  /** Unique identifier (auto-generated) */
  id: string;

  /** Financial institution name (e.g., "TD Bank", "Chase") */
  institutionName: string;

  /** Account name within the institution (e.g., "Checking", "Savings") */
  accountName: string;

  /** Display name used when exporting (e.g., "TD Bank - Checking")
   * Auto-generated as `{institutionName} - {accountName}` but can be customized */
  exportDisplayName: string;

  /** Optional account type for categorization */
  accountType?: AccountType;

  /** ISO timestamp of when the account was created */
  createdAt: string;

  /** ISO timestamp of when the account was last updated */
  updatedAt: string;
}

/**
 * Application preferences
 */
export interface Preferences {
  /** Path to the master data JSON file */
  masterDataPath: string;
}

/**
 * Settings file structure (settings.json)
 */
export interface SettingsFile {
  /** Schema version for migration support */
  version: string;

  /** List of configured accounts */
  accounts: Account[];

  /** Application preferences */
  preferences: Preferences;
}

/**
 * Current schema version for settings.json
 */
export const SETTINGS_VERSION = '1.0.0';

/**
 * Creates a default empty settings file
 */
export function createDefaultSettings(): SettingsFile {
  return {
    version: SETTINGS_VERSION,
    accounts: [],
    preferences: {
      masterDataPath: ''
    }
  };
}

/**
 * Generates a unique account ID
 */
export function generateAccountId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `acc_${timestamp}_${random}`;
}

/**
 * Generates the default export display name from institution and account name
 */
export function generateExportDisplayName(institutionName: string, accountName: string): string {
  return `${institutionName} - ${accountName}`;
}

/**
 * Creates a new account with auto-generated fields
 */
export function createAccount(
  institutionName: string,
  accountName: string,
  accountType?: AccountType,
  exportDisplayName?: string
): Account {
  const now = new Date().toISOString();
  return {
    id: generateAccountId(),
    institutionName,
    accountName,
    exportDisplayName: exportDisplayName || generateExportDisplayName(institutionName, accountName),
    accountType,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Input for creating a new account (without auto-generated fields)
 */
export interface CreateAccountInput {
  institutionName: string;
  accountName: string;
  exportDisplayName?: string;
  accountType?: AccountType;
}

/**
 * Input for updating an existing account
 */
export interface UpdateAccountInput {
  institutionName?: string;
  accountName?: string;
  exportDisplayName?: string;
  accountType?: AccountType;
}

/**
 * Result of checking if an account is in use
 */
export interface AccountUsageResult {
  inUse: boolean;
  usedBy: {
    importTemplates: string[];  // Template names
    transactions: number;       // Count of transactions
  };
}
