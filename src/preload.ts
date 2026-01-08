/**
 * Preload Script
 *
 * This script runs in the renderer process before the web page loads.
 * It exposes a secure API to the renderer via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Define the API structure that will be exposed to the renderer
const electronAPI = {
  // File parsing
  parseFile: (filePath: string, opts: any) =>
    ipcRenderer.invoke('parse-file', filePath, opts),

  onParseProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('parse-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('parse-progress');
  },

  // Settings API
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
    getAccounts: () => ipcRenderer.invoke('settings:get-accounts'),
    getAccount: (id: string) => ipcRenderer.invoke('settings:get-account', id),
    createAccount: (input: any) => ipcRenderer.invoke('settings:create-account', input),
    updateAccount: (id: string, updates: any) =>
      ipcRenderer.invoke('settings:update-account', id, updates),
    deleteAccount: (id: string) => ipcRenderer.invoke('settings:delete-account', id),
    getMasterDataPath: () => ipcRenderer.invoke('settings:get-master-data-path'),
    setMasterDataPath: (path: string) =>
      ipcRenderer.invoke('settings:set-master-data-path', path),
    pickMasterDataFolder: () => ipcRenderer.invoke('settings:pick-master-data-folder')
  },

  // Master Data API
  masterData: {
    load: () => ipcRenderer.invoke('master-data:load'),
    save: (data: any) => ipcRenderer.invoke('master-data:save', data),
    getFileInfo: () => ipcRenderer.invoke('master-data:get-file-info'),
    checkModified: () => ipcRenderer.invoke('master-data:check-modified'),
    exportCSV: (transactions: any[]) =>
      ipcRenderer.invoke('master-data:export-csv', transactions),
    exportExcel: (transactions: any[]) =>
      ipcRenderer.invoke('master-data:export-excel', transactions),
    importFile: () => ipcRenderer.invoke('master-data:import-file'),
    pickFolder: () => ipcRenderer.invoke('master-data:pick-folder')
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Export type for use in renderer
export type ElectronAPI = typeof electronAPI;
