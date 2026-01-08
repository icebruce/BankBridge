import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import { getStorageInfo, ensureStorageDirectory } from '../../services/storageLocation';
import {
  SettingsFile,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
  createDefaultSettings,
  generateAccountId,
  generateExportDisplayName,
  SETTINGS_VERSION
} from '../../models/Settings';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'main-process.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const SETTINGS_FILE_NAME = 'settings.json';

/**
 * Get the settings file path
 */
function getSettingsPath(): string {
  const { userDataPath } = getStorageInfo();
  return path.join(userDataPath, SETTINGS_FILE_NAME);
}

/**
 * Load settings from file
 */
function loadSettingsFromFile(): SettingsFile {
  const filePath = getSettingsPath();

  try {
    if (!fs.existsSync(filePath)) {
      logger.info('Settings file not found, creating default', { filePath });
      return createDefaultSettings();
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data: SettingsFile = JSON.parse(content);

    // Check version and migrate if needed
    if (data.version !== SETTINGS_VERSION) {
      logger.warn(`Settings version mismatch. Expected ${SETTINGS_VERSION}, found ${data.version}`);
      // TODO: Add migration logic when schema changes
    }

    return data;
  } catch (error) {
    logger.error('Error loading settings', { filePath, error });
    return createDefaultSettings();
  }
}

/**
 * Save settings to file
 */
function saveSettingsToFile(settings: SettingsFile): void {
  ensureStorageDirectory();
  const filePath = getSettingsPath();

  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
    logger.info('Settings saved', { filePath });
  } catch (error) {
    logger.error('Error saving settings', { filePath, error });
    throw new Error('Failed to save settings');
  }
}

/**
 * Register settings IPC handlers
 */
export function registerSettingsHandlers(): void {
  // Load settings
  ipcMain.handle('settings:load', async () => {
    logger.info('Loading settings');
    return loadSettingsFromFile();
  });

  // Save settings
  ipcMain.handle('settings:save', async (_event, settings: SettingsFile) => {
    logger.info('Saving settings');
    saveSettingsToFile(settings);
  });

  // Get all accounts
  ipcMain.handle('settings:get-accounts', async () => {
    const settings = loadSettingsFromFile();
    return settings.accounts;
  });

  // Get account by ID
  ipcMain.handle('settings:get-account', async (_event, id: string) => {
    const settings = loadSettingsFromFile();
    return settings.accounts.find(a => a.id === id);
  });

  // Create account
  ipcMain.handle('settings:create-account', async (_event, input: CreateAccountInput) => {
    const settings = loadSettingsFromFile();
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
    saveSettingsToFile(settings);

    logger.info('Account created', { id: newAccount.id, institutionName: input.institutionName });
    return newAccount;
  });

  // Update account
  ipcMain.handle('settings:update-account', async (_event, id: string, updates: UpdateAccountInput) => {
    const settings = loadSettingsFromFile();
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
    if (!updates.exportDisplayName &&
        (updates.institutionName || updates.accountName)) {
      updatedAccount.exportDisplayName = generateExportDisplayName(
        updatedAccount.institutionName,
        updatedAccount.accountName
      );
    }

    settings.accounts[index] = updatedAccount;
    saveSettingsToFile(settings);

    logger.info('Account updated', { id });
    return updatedAccount;
  });

  // Delete account
  ipcMain.handle('settings:delete-account', async (_event, id: string) => {
    const settings = loadSettingsFromFile();
    const index = settings.accounts.findIndex(a => a.id === id);

    if (index === -1) {
      throw new Error(`Account not found: ${id}`);
    }

    settings.accounts.splice(index, 1);
    saveSettingsToFile(settings);

    logger.info('Account deleted', { id });
  });

  // Get master data path
  ipcMain.handle('settings:get-master-data-path', async () => {
    const settings = loadSettingsFromFile();
    return settings.preferences.masterDataPath;
  });

  // Set master data path
  ipcMain.handle('settings:set-master-data-path', async (_event, newPath: string) => {
    const settings = loadSettingsFromFile();
    settings.preferences.masterDataPath = newPath;
    saveSettingsToFile(settings);
    logger.info('Master data path updated', { newPath });
  });

  // Pick folder for master data
  ipcMain.handle('settings:pick-master-data-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Master Data Folder'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedFolder = result.filePaths[0];
    const masterDataPath = path.join(selectedFolder, 'master_data.json');

    // Update settings with new path
    const settings = loadSettingsFromFile();
    settings.preferences.masterDataPath = masterDataPath;
    saveSettingsToFile(settings);

    logger.info('Master data folder selected', { masterDataPath });
    return masterDataPath;
  });

  logger.info('Settings IPC handlers registered');
}
