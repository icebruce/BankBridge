import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import {
  MasterDataFile,
  MasterDataFileInfo,
  createDefaultMasterData,
  computeMetadata,
  MASTER_DATA_VERSION
} from '../../models/MasterData';

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

const DEFAULT_MASTER_DATA_FILE = 'master_data.json';

// Track last known modification time for external change detection
let lastKnownModTime: number | null = null;

/**
 * Get the master data file path from settings
 */
async function getMasterDataPath(): Promise<string> {
  // Import dynamically to avoid circular dependency
  const { getStorageInfo } = await import('../../services/storageLocation');
  const { userDataPath } = getStorageInfo();

  // First, try to get from settings file
  const settingsPath = path.join(userDataPath, 'settings.json');

  try {
    if (fs.existsSync(settingsPath)) {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      if (settings.preferences?.masterDataPath) {
        return settings.preferences.masterDataPath;
      }
    }
  } catch (error) {
    logger.warn('Could not read settings for master data path', { error });
  }

  // Default path
  return path.join(userDataPath, DEFAULT_MASTER_DATA_FILE);
}

/**
 * Load master data from file
 */
async function loadMasterDataFromFile(): Promise<MasterDataFile> {
  const filePath = await getMasterDataPath();

  try {
    if (!fs.existsSync(filePath)) {
      logger.info('Master data file not found, creating default', { filePath });
      return createDefaultMasterData();
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data: MasterDataFile = JSON.parse(content);

    // Update last known modification time
    const stats = fs.statSync(filePath);
    lastKnownModTime = stats.mtimeMs;

    // Check version and migrate if needed
    if (data.version !== MASTER_DATA_VERSION) {
      logger.warn(`Master data version mismatch. Expected ${MASTER_DATA_VERSION}, found ${data.version}`);
      // TODO: Add migration logic when schema changes
    }

    return data;
  } catch (error) {
    logger.error('Error loading master data', { filePath, error });
    return createDefaultMasterData();
  }
}

/**
 * Save master data to file
 */
async function saveMasterDataToFile(data: MasterDataFile): Promise<void> {
  const filePath = await getMasterDataPath();
  const directory = path.dirname(filePath);

  try {
    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Update metadata before saving
    data.metadata = computeMetadata(data.transactions);
    data.lastUpdated = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Update last known modification time
    const stats = fs.statSync(filePath);
    lastKnownModTime = stats.mtimeMs;

    logger.info('Master data saved', { filePath, transactionCount: data.transactions.length });
  } catch (error) {
    logger.error('Error saving master data', { filePath, error });
    throw new Error('Failed to save master data');
  }
}

/**
 * Get file info for master data file
 */
async function getFileInfo(): Promise<MasterDataFileInfo> {
  const filePath = await getMasterDataPath();

  try {
    if (!fs.existsSync(filePath)) {
      return { path: filePath, exists: false };
    }

    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      exists: true,
      lastModified: stats.mtime,
      size: stats.size
    };
  } catch (error) {
    logger.error('Error getting file info', { filePath, error });
    return { path: filePath, exists: false };
  }
}

/**
 * Check if file was modified externally
 */
async function checkFileModified(): Promise<boolean> {
  const filePath = await getMasterDataPath();

  try {
    if (!fs.existsSync(filePath) || lastKnownModTime === null) {
      return false;
    }

    const stats = fs.statSync(filePath);
    return stats.mtimeMs !== lastKnownModTime;
  } catch (error) {
    logger.error('Error checking file modification', { filePath, error });
    return false;
  }
}

/**
 * Register master data IPC handlers
 */
export function registerMasterDataHandlers(): void {
  // Load master data
  ipcMain.handle('master-data:load', async () => {
    logger.info('Loading master data');
    return loadMasterDataFromFile();
  });

  // Save master data
  ipcMain.handle('master-data:save', async (_event, data: MasterDataFile) => {
    logger.info('Saving master data');
    await saveMasterDataToFile(data);
  });

  // Get file info
  ipcMain.handle('master-data:get-file-info', async () => {
    return getFileInfo();
  });

  // Check if file was modified externally
  ipcMain.handle('master-data:check-modified', async () => {
    return checkFileModified();
  });

  // Export to CSV
  ipcMain.handle('master-data:export-csv', async (_event, transactions: any[]) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Master Data as CSV',
      defaultPath: 'master_data_export.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    try {
      // Generate CSV content
      const headers = [
        'date', 'merchant', 'category', 'institutionName', 'accountName',
        'originalStatement', 'notes', 'amount', 'tags', 'sourceFile', 'importedAt'
      ];

      const rows = transactions.map(txn =>
        headers.map(h => {
          const value = txn[h];
          if (Array.isArray(value)) {
            return `"${value.join(', ')}"`;
          }
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');
      fs.writeFileSync(result.filePath, csvContent, 'utf-8');

      logger.info('Master data exported to CSV', { path: result.filePath, count: transactions.length });
      return result.filePath;
    } catch (error) {
      logger.error('Error exporting to CSV', { error });
      throw new Error('Failed to export to CSV');
    }
  });

  // Export to Excel
  ipcMain.handle('master-data:export-excel', async (_event, transactions: any[]) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Master Data as Excel',
      defaultPath: 'master_data_export.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    try {
      // Use xlsx library for Excel export
      const XLSX = await import('xlsx');

      const headers = [
        'date', 'merchant', 'category', 'institutionName', 'accountName',
        'originalStatement', 'notes', 'amount', 'tags', 'sourceFile', 'importedAt'
      ];

      const data = transactions.map(txn =>
        headers.reduce((acc, h) => {
          const value = txn[h];
          acc[h] = Array.isArray(value) ? value.join(', ') : value;
          return acc;
        }, {} as Record<string, any>)
      );

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      XLSX.writeFile(workbook, result.filePath);

      logger.info('Master data exported to Excel', { path: result.filePath, count: transactions.length });
      return result.filePath;
    } catch (error) {
      logger.error('Error exporting to Excel', { error });
      throw new Error('Failed to export to Excel');
    }
  });

  // Import from file
  ipcMain.handle('master-data:import-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Master Data',
      filters: [
        { name: 'Data Files', extensions: ['csv', 'xlsx', 'xls'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.csv') {
        const content = fs.readFileSync(filePath, 'utf-8');
        logger.info('Import file read (CSV)', { filePath });
        return { type: 'csv', content, filePath };
      } else if (ext === '.xlsx' || ext === '.xls') {
        const XLSX = await import('xlsx');
        const workbook = XLSX.readFile(filePath);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);
        logger.info('Import file read (Excel)', { filePath, rowCount: data.length });
        return { type: 'excel', data, filePath };
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      logger.error('Error importing file', { filePath, error });
      throw new Error(`Failed to import file: ${(error as Error).message}`);
    }
  });

  // Pick folder for master data
  ipcMain.handle('master-data:pick-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Master Data Folder'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedFolder = result.filePaths[0];
    const masterDataPath = path.join(selectedFolder, DEFAULT_MASTER_DATA_FILE);

    logger.info('Master data folder selected', { masterDataPath });
    return masterDataPath;
  });

  logger.info('Master data IPC handlers registered');
}
