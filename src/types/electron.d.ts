/**
 * Type declarations for the Electron API exposed via preload script
 */

import { SettingsFile, Account, CreateAccountInput, UpdateAccountInput } from '../models/Settings';
import { MasterDataFile, MasterDataFileInfo } from '../models/MasterData';

interface SettingsAPI {
  load(): Promise<SettingsFile>;
  save(settings: SettingsFile): Promise<void>;
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(input: CreateAccountInput): Promise<Account>;
  updateAccount(id: string, updates: UpdateAccountInput): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  getMasterDataPath(): Promise<string>;
  setMasterDataPath(path: string): Promise<void>;
  pickMasterDataFolder(): Promise<string | null>;
}

interface MasterDataAPI {
  load(): Promise<MasterDataFile>;
  save(data: MasterDataFile): Promise<void>;
  getFileInfo(): Promise<MasterDataFileInfo>;
  checkModified(): Promise<boolean>;
  exportCSV(transactions: any[]): Promise<string | null>;
  exportExcel(transactions: any[]): Promise<string | null>;
  importFile(): Promise<{
    type: 'csv' | 'excel';
    content?: string;
    data?: any[];
    filePath: string;
  } | null>;
  pickFolder(): Promise<string | null>;
}

interface ElectronAPI {
  parseFile(filePath: string, opts: any): Promise<any>;
  onParseProgress(callback: (progress: number) => void): () => void;
  settings: SettingsAPI;
  masterData: MasterDataAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
