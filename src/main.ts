import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { logStorageInfo } from './services/storageLocation';
import { registerParseFileHandler } from './main/ipcHandlers/parseFile';
import { registerSettingsHandlers } from './main/ipcHandlers/settings';
import { registerMasterDataHandlers } from './main/ipcHandlers/masterData';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      // Performance optimizations
      experimentalFeatures: true,
      backgroundThrottling: false,
    },
    // Performance optimizations for input responsiveness
    show: false, // Don't show until ready
    titleBarStyle: 'default',
  });

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
    
    // Focus the window to ensure input responsiveness
    if (win.isFocusable()) {
      win.focus();
    }
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5174');
    // Open DevTools in development
    win.webContents.openDevTools();
  } else {
    // In production, load the built files
    win.loadFile(path.join(__dirname, '../index.html'));
  }

  // Handle window errors
  win.webContents.on('did-fail-load', (_event, _errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
  });

  // Optimize for input responsiveness
  win.webContents.on('dom-ready', () => {
    // Inject CSS to improve input performance in Electron
    win.webContents.insertCSS(`
      /* Electron-specific optimizations for input responsiveness */
      input, textarea, select {
        -webkit-user-select: text !important;
        -webkit-app-region: no-drag !important;
        pointer-events: auto !important;
      }
      
      /* Disable hardware acceleration on problematic elements */
      .drag-handle, [draggable="true"] {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
      
      /* Ensure proper focus styles */
      input:focus, textarea:focus, select:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
    `);
  });
}

app.whenReady().then(() => {
  // Log storage information for debugging
  logStorageInfo();

  // Register IPC handlers
  registerParseFileHandler();
  registerSettingsHandlers();
  registerMasterDataHandlers();

  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 