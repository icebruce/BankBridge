import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Storage location service for Electron app
 * Handles different storage locations for development vs production
 */

export interface StorageInfo {
  templatesPath: string;
  userDataPath: string;
  isProduction: boolean;
  storageType: 'localStorage' | 'file';
}

/**
 * Get the appropriate storage location based on environment
 */
export const getStorageInfo = (): StorageInfo => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (typeof window !== 'undefined') {
    // Running in renderer process (browser context)
    return {
      templatesPath: 'localStorage',
      userDataPath: 'browser',
      isProduction,
      storageType: 'localStorage'
    };
  }
  
  // Running in main process (Electron context)
  const userDataPath = app.getPath('userData');
  const templatesPath = path.join(userDataPath, 'templates.json');
  
  return {
    templatesPath,
    userDataPath,
    isProduction,
    storageType: 'file'
  };
};

/**
 * Ensure the storage directory exists
 */
export const ensureStorageDirectory = (): void => {
  const { userDataPath, storageType } = getStorageInfo();
  
  if (storageType === 'file' && userDataPath !== 'browser') {
    try {
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }
};

/**
 * Get storage paths for different operating systems
 */
export const getStoragePaths = () => {
  const { userDataPath, isProduction } = getStorageInfo();
  
  const paths = {
    windows: {
      development: path.join(process.env.APPDATA || '', 'bankbridge-react-dev'),
      production: path.join(process.env.APPDATA || '', 'BankBridge')
    },
    mac: {
      development: path.join(process.env.HOME || '', 'Library', 'Application Support', 'bankbridge-react-dev'),
      production: path.join(process.env.HOME || '', 'Library', 'Application Support', 'BankBridge')
    },
    linux: {
      development: path.join(process.env.HOME || '', '.config', 'bankbridge-react-dev'),
      production: path.join(process.env.HOME || '', '.config', 'BankBridge')
    }
  };
  
  const platform = process.platform;
  const environment = isProduction ? 'production' : 'development';
  
  let expectedPath = '';
  switch (platform) {
    case 'win32':
      expectedPath = paths.windows[environment];
      break;
    case 'darwin':
      expectedPath = paths.mac[environment];
      break;
    case 'linux':
      expectedPath = paths.linux[environment];
      break;
    default:
      expectedPath = userDataPath;
  }
  
  return {
    current: userDataPath,
    expected: expectedPath,
    platform,
    environment
  };
};

/**
 * Log storage information for debugging
 */
export const logStorageInfo = (): void => {
  const info = getStorageInfo();
  const paths = getStoragePaths();
  
  console.group('📁 Storage Information');
  console.log('Environment:', info.isProduction ? 'Production' : 'Development');
  console.log('Storage Type:', info.storageType);
  console.log('Templates Path:', info.templatesPath);
  console.log('User Data Path:', info.userDataPath);
  console.log('Platform:', process.platform);
  console.log('Expected Path:', paths.expected);
  console.log('Current Path:', paths.current);
  console.groupEnd();
}; 