import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen,
  faCheck,
  faFileExport,
} from '@fortawesome/free-solid-svg-icons';
import type { ProcessingResult } from './ProcessFilesPage';

// Extended electron API interface for folder selection
interface ExtendedElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
  showOpenDialog: (options: {
    properties: string[];
    title?: string;
  }) => Promise<{ canceled: boolean; filePaths: string[] }>;
}

interface ExportStepProps {
  results: ProcessingResult[];
  exportPath: string;
  onExportPathChange: (path: string) => void;
  exportSuccess: boolean;
  onExportSuccess: () => void;
  onProcessMore: () => void;
}

const ExportStep: React.FC<ExportStepProps> = ({
  results,
  exportPath,
  onExportPathChange,
  exportSuccess,
  onExportSuccess,
  onProcessMore,
}) => {
  const [exporting, setExporting] = useState(false);

  // Generate export filenames based on account display name and date
  const getExportFilenames = (): Array<{ name: string; recordCount: number }> => {
    const today = new Date().toISOString().split('T')[0];

    // Group by account
    const byAccount = results.reduce((acc, result) => {
      const key = result.accountDisplayName;
      if (!acc[key]) {
        acc[key] = { count: 0, accountName: key };
      }
      acc[key].count += result.processedRecords;
      return acc;
    }, {} as Record<string, { count: number; accountName: string }>);

    return Object.values(byAccount).map(({ accountName, count }) => ({
      name: `${accountName}_${today}.csv`,
      recordCount: count,
    }));
  };

  const handleBrowse = async () => {
    try {
      // Try to use Electron's dialog if available
      if (window.electron) {
        const electronAPI = window.electron as ExtendedElectronAPI;
        const result = await electronAPI.showOpenDialog({
          title: 'Select Export Folder',
          properties: ['openDirectory'],
        });
        if (!result.canceled && result.filePaths.length > 0) {
          onExportPathChange(result.filePaths[0]);
        }
      } else {
        // Fallback for web/development
        const path = prompt('Enter export path:', exportPath);
        if (path) {
          onExportPathChange(path);
        }
      }
    } catch (error) {
      console.error('Failed to open folder picker:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In real implementation, this would:
    // 1. Apply export template to transformed data
    // 2. Generate CSV files
    // 3. Save to exportPath

    setExporting(false);
    onExportSuccess();
  };

  const totalRecords = results.reduce((sum, r) => sum + r.processedRecords, 0);
  const exportFiles = getExportFilenames();

  // Success state
  if (exportSuccess) {
    return (
      <div className="bg-white p-10 border border-neutral-200 rounded-lg shadow-sm">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold text-neutral-900 mb-3">Export Complete</h3>
          <p className="text-neutral-600 mb-6">
            Successfully exported <span className="font-semibold text-neutral-900">{totalRecords.toLocaleString()}</span> records
          </p>
          <div className="bg-neutral-50 p-5 rounded-lg mb-8 text-left">
            <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Exported Files
            </div>
            <div className="space-y-2">
              {exportFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faFileExport} className="text-green-500 mr-3" />
                    <span className="text-sm text-neutral-700 font-medium">{file.name}</span>
                  </div>
                  <span className="text-xs text-neutral-500">{file.recordCount.toLocaleString()} records</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-200">
              <div className="flex items-center text-sm text-neutral-500">
                <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
                <span className="truncate">{exportPath}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onProcessMore}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200 font-medium"
          >
            Process More Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Export Files</h3>
          <p className="text-sm text-neutral-600">
            Choose a destination folder and export your processed files
          </p>
        </div>
        <div className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-900">{totalRecords.toLocaleString()}</span> records ready
        </div>
      </div>

      {/* Export Summary */}
      <div className="bg-white p-5 border border-neutral-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">
            Files to Export
          </h4>
          <span className="text-sm text-neutral-500">
            {exportFiles.length} file{exportFiles.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-2">
          {exportFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white rounded-lg border border-neutral-200 flex items-center justify-center mr-3">
                  <FontAwesomeIcon
                    icon={faFileExport}
                    className="text-neutral-500"
                  />
                </div>
                <span className="font-medium text-neutral-900">{file.name}</span>
              </div>
              <span className="text-sm text-neutral-500 font-medium">
                {file.recordCount.toLocaleString()} records
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Path */}
      <div className="bg-white p-5 border border-neutral-200 rounded-lg shadow-sm">
        <label className="block text-sm font-semibold text-neutral-600 mb-2">
          Export Location
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={exportPath}
            onChange={(e) => onExportPathChange(e.target.value)}
            placeholder="Select a folder..."
            className={`
              flex-1 px-4 py-2.5 border rounded-lg electronInput transition-all duration-200
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
              ${!exportPath ? 'border-amber-300 bg-amber-50/50' : 'border-neutral-200'}
            `}
            title={exportPath}
          />
          <button
            onClick={handleBrowse}
            className="px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:shadow-sm transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <FontAwesomeIcon icon={faFolderOpen} />
            Browse
          </button>
        </div>
        {!exportPath && (
          <p className="text-sm text-amber-600 mt-2 flex items-center">
            <FontAwesomeIcon icon={faFolderOpen} className="mr-1.5" />
            Please select an export location
          </p>
        )}
      </div>

      {/* Export Button Section */}
      <div className="bg-white p-5 border border-neutral-200 rounded-lg shadow-sm">
        {exporting ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-neutral-700 font-medium">Exporting files...</p>
            <p className="text-sm text-neutral-500 mt-1">This may take a moment</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              {exportPath ? (
                <span className="flex items-center text-green-600">
                  <FontAwesomeIcon icon={faCheck} className="mr-1.5" />
                  Ready to export
                </span>
              ) : (
                <span>Select a location to enable export</span>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={!exportPath}
              className={`
                px-6 py-2.5 rounded-lg font-medium transition-all duration-200
                ${exportPath
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-sm'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                }
              `}
            >
              <FontAwesomeIcon icon={faFileExport} className="mr-2" />
              Export Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportStep;
