import React, { useState, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUpload,
  faFile,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faDownload,
  faTimes,
  faFileAlt,
  faFileCsv,
  faFileCode
} from '@fortawesome/free-solid-svg-icons';

import { useParseFile } from '../../ui/hooks/useParseFile';
import { ParseOpts, ParseResult } from '../../models/parse';

export interface FileParserProps {
  /** Callback when parsing completes successfully */
  onParseComplete?: (result: ParseResult) => void;
  /** Callback when parsing fails */
  onParseError?: (error: string) => void;
  /** Callback when file is selected but before parsing */
  onFileSelected?: (file: File) => void;
  /** Parse options to customize parsing behavior */
  parseOptions?: ParseOpts;
  /** Accepted file types (default: .csv,.json,.txt) */
  acceptedTypes?: string;
  /** Maximum file size in MB (default: 100) */
  maxFileSizeMB?: number;
  /** Show advanced options panel */
  showAdvancedOptions?: boolean;
  /** Custom title for the component */
  title?: string;
  /** Custom description */
  description?: string;
  /** Disable the component */
  disabled?: boolean;
  /** Show progress details */
  showProgressDetails?: boolean;
  /** Custom CSS classes */
  className?: string;
}

const FileParser: React.FC<FileParserProps> = ({
  onParseComplete,
  onParseError,
  onFileSelected,
  parseOptions = {},
  acceptedTypes = '.csv,.json,.txt',
  maxFileSizeMB = 100,
  showAdvancedOptions = false,
  title = 'File Parser',
  description = 'Upload and parse CSV, JSON, or TXT files',
  disabled = false,
  showProgressDetails = true,
  className = ''
}) => {
  const { parse, progress, isLoading, error, clearError } = useParseFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [advancedOpts, setAdvancedOpts] = useState<ParseOpts>(parseOptions);

  // File type icons
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv': return faFileCsv;
      case 'json': return faFileCode;
      case 'txt': return faFileAlt;
      default: return faFile;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxFileSizeMB}MB limit`;
    }

    // Check file type
    const allowedTypes = acceptedTypes.split(',').map(t => t.trim());
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      return `File type not supported. Allowed types: ${acceptedTypes}`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onParseError?.(validationError);
      return;
    }

    setSelectedFile(file);
    setParseResult(null);
    clearError();
    onFileSelected?.(file);
  }, [maxFileSizeMB, acceptedTypes, onFileSelected, onParseError, clearError]);

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Start parsing
  const handleParse = async () => {
    if (!selectedFile) return;

    try {
      // Create a temporary file path for Electron
      const filePath = (selectedFile as any).path || selectedFile.name;
      
      const result = await parse(filePath, advancedOpts);
      setParseResult(result);
      
      if (result.success) {
        onParseComplete?.(result);
      } else {
        onParseError?.(result.errors.map(e => e.message).join(', '));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      onParseError?.(errorMessage);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setParseResult(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download reject file
  const handleDownloadRejects = () => {
    if (parseResult?.rejectFile) {
      // TODO: Implement file download via Electron main process
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-600 mt-1">{description}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* File Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
            ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-neutral-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-400 cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          {selectedFile ? (
            <div className="space-y-3">
              <FontAwesomeIcon 
                icon={getFileIcon(selectedFile.name)} 
                className="text-4xl text-blue-500" 
              />
              <div>
                <p className="font-medium text-neutral-900">{selectedFile.name}</p>
                <p className="text-sm text-neutral-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <FontAwesomeIcon icon={faUpload} className="text-4xl text-neutral-400" />
              <div>
                <p className="text-lg font-medium text-neutral-700">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-neutral-500">
                  Supports {acceptedTypes} files up to {maxFileSizeMB}MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="border border-neutral-200 rounded-lg p-4">
            <h4 className="font-medium text-neutral-900 mb-3">Advanced Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Max Rows
                </label>
                <input
                  type="number"
                  value={advancedOpts.maxRows || ''}
                  onChange={(e) => setAdvancedOpts(prev => ({
                    ...prev,
                    maxRows: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Chunk Size
                </label>
                <input
                  type="number"
                  value={advancedOpts.chunkSize || 1000}
                  onChange={(e) => setAdvancedOpts(prev => ({
                    ...prev,
                    chunkSize: parseInt(e.target.value) || 1000
                  }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedOpts.enableGarbageCollection || false}
                  onChange={(e) => setAdvancedOpts(prev => ({
                    ...prev,
                    enableGarbageCollection: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-neutral-700">Enable garbage collection</span>
              </label>
            </div>
          </div>
        )}

        {/* Progress */}
        {isLoading && progress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">
                {progress.phase.charAt(0).toUpperCase() + progress.phase.slice(1)}...
              </span>
              {progress.total && (
                <span className="text-sm text-neutral-500">
                  {progress.processed} / {progress.total}
                </span>
              )}
            </div>
            
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: progress.total 
                    ? `${(progress.processed / progress.total) * 100}%`
                    : '50%'
                }}
              />
            </div>

            {showProgressDetails && (
              <div className="text-xs text-neutral-500 space-y-1">
                <div>Phase: {progress.phase}</div>
                {progress.currentFile && <div>File: {progress.currentFile}</div>}
                {progress.estimatedTimeRemaining && (
                  <div>ETA: {Math.round(progress.estimatedTimeRemaining / 1000)}s</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Parsing Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {parseResult && (
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${
              parseResult.success ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-start">
                <FontAwesomeIcon 
                  icon={parseResult.success ? faCheckCircle : faExclamationTriangle} 
                  className={`mt-0.5 mr-3 ${
                    parseResult.success ? 'text-green-500' : 'text-yellow-500'
                  }`} 
                />
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${
                    parseResult.success ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {parseResult.success ? 'Parsing Completed' : 'Parsing Completed with Warnings'}
                  </h4>
                  <div className={`text-sm mt-2 space-y-1 ${
                    parseResult.success ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    <div>Total Rows: {parseResult.stats.totalRows}</div>
                    <div>Valid Rows: {parseResult.stats.validRows}</div>
                    {parseResult.stats.rejectedRows > 0 && (
                      <div>Rejected Rows: {parseResult.stats.rejectedRows}</div>
                    )}
                    <div>Processing Time: {(parseResult.stats.processingTime / 1000).toFixed(2)}s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reject File Download */}
            {parseResult.rejectFile && (
              <button
                onClick={handleDownloadRejects}
                className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Download Reject File
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleParse}
            disabled={!selectedFile || isLoading || disabled}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Parsing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faFile} className="mr-2" />
                Parse File
              </>
            )}
          </button>

          {selectedFile && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileParser; 