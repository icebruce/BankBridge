import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen,
  faFileImport,
  faFileExport,
  faRotate,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import type { MasterDataFileInfo } from '../../models/MasterData';

interface FileLocationSectionProps {
  fileInfo: MasterDataFileInfo | null;
  lastUpdated?: string;
  onReload: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const FileLocationSection: FC<FileLocationSectionProps> = ({
  fileInfo,
  lastUpdated,
  onReload,
  onSuccess: _onSuccess,
  onError
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatLastModified = (dateString?: string): string => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const handleChangeFolder = async () => {
    // TODO: Implement folder picker dialog
    onError('Change folder functionality coming soon');
  };

  const handleImport = async () => {
    // TODO: Implement file import
    onError('Import functionality coming soon');
  };

  const handleExportCSV = async () => {
    setShowExportDropdown(false);
    // TODO: Implement CSV export
    onError('CSV export functionality coming soon');
  };

  const handleExportExcel = async () => {
    setShowExportDropdown(false);
    // TODO: Implement Excel export
    onError('Excel export functionality coming soon');
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await onReload();
    } finally {
      setIsReloading(false);
    }
  };

  const displayPath = fileInfo?.path || 'Not configured';

  return (
    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
      {/* File Path Display */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-neutral-700">
          Master File Location
        </label>
        <div className="text-right">
          <span className="text-xs text-neutral-500">Last modified: </span>
          <span className="text-xs font-medium text-neutral-700">
            {formatLastModified(lastUpdated)}
          </span>
        </div>
      </div>

      {/* File Path */}
      <div className="flex items-center gap-2 text-sm text-neutral-600 bg-white border border-neutral-200 px-3 py-2 rounded-lg mb-3">
        <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="truncate" title={displayPath}>
          {displayPath}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        {/* Left-aligned buttons */}
        <div className="flex items-center gap-2">
          {/* Change Folder Button */}
          <button
            className="px-3 py-2 text-sm text-neutral-700 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
            onClick={handleChangeFolder}
          >
            <FontAwesomeIcon icon={faFolderOpen} className="w-4 h-4" />
            Change Folder
          </button>

          {/* Import Button */}
          <button
            className="px-3 py-2 text-sm text-neutral-700 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
            onClick={handleImport}
          >
            <FontAwesomeIcon icon={faFileImport} className="w-4 h-4" />
            Import
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="px-3 py-2 text-sm text-neutral-700 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <FontAwesomeIcon icon={faFileExport} className="w-4 h-4" />
              Export
              <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {showExportDropdown && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                <button
                  className="w-full px-4 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  onClick={handleExportCSV}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as CSV
                </button>
                <button
                  className="w-full px-4 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  onClick={handleExportExcel}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right-aligned reload button */}
        <button
          className={`p-2 text-neutral-400 hover:text-neutral-700 hover:bg-white rounded-lg transition-colors ${isReloading ? 'animate-spin' : ''}`}
          onClick={handleReload}
          title="Reload master data"
          disabled={isReloading}
        >
          <FontAwesomeIcon icon={faRotate} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FileLocationSection;
