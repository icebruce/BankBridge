import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudArrowUp,
  faXmark,
  faSpinner,
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-regular-svg-icons';
import type { FileEntry } from './ProcessFilesPage';
import { fileParserService } from '../../services/fileParserService';

interface UploadStepProps {
  files: FileEntry[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onUpdateFile: (id: string, updates: Partial<FileEntry>) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onUpdateFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background parsing for new files
  useEffect(() => {
    const pendingFiles = files.filter((f) => f.parseStatus === 'pending');

    const parseFiles = async () => {
      for (const fileEntry of pendingFiles) {
        onUpdateFile(fileEntry.id, { parseStatus: 'parsing' });

        try {
          const result = await fileParserService.parseFile(fileEntry.file);
          if (result.success) {
            onUpdateFile(fileEntry.id, {
              parseStatus: 'complete',
              parseResult: {
                columns: result.fields.map((f) => f.name),
                rowCount: result.rowCount,
              },
            });
          } else {
            onUpdateFile(fileEntry.id, {
              parseStatus: 'error',
              parseError: result.error || 'Failed to parse file',
            });
          }
        } catch (error) {
          onUpdateFile(fileEntry.id, {
            parseStatus: 'error',
            parseError: error instanceof Error ? error.message : 'Failed to parse file',
          });
        }
      }
    };

    if (pendingFiles.length > 0) {
      parseFiles();
    }
  }, [files, onUpdateFile]);

  // Check for duplicate filenames
  const getDuplicateCount = (): number => {
    const names = files.map((f) => f.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    return new Set(duplicates).size;
  };

  const isFileDuplicate = (fileName: string): boolean => {
    return files.filter((f) => f.name === fileName).length > 1;
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onAddFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = (file: FileEntry) => {
    switch (file.parseStatus) {
      case 'parsing':
        return <FontAwesomeIcon icon={faSpinner} className="text-blue-500 animate-spin" />;
      case 'complete':
        return <FontAwesomeIcon icon={faCheck} className="text-green-600" />;
      case 'error':
        return <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500" />;
      default:
        return null;
    }
  };

  const duplicateCount = getDuplicateCount();

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <FontAwesomeIcon
          icon={faCloudArrowUp}
          className={`text-4xl mb-4 transition-colors duration-200 ${
            isDragging ? 'text-blue-500' : 'text-neutral-400'
          }`}
        />
        <p className="text-neutral-700 mb-4">
          Drag and drop your CSV file here, or
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 hover:shadow-sm transition-all duration-200"
        >
          Browse Files
        </button>
        <p className="text-neutral-400 text-sm mt-4">
          Supported formats: CSV, Excel (.xlsx)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div>
          {/* Duplicate Warning */}
          {duplicateCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm mb-4">
              <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0" />
              <span>{duplicateCount} duplicate file{duplicateCount > 1 ? 's' : ''} detected</span>
            </div>
          )}

          {/* File Cards */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`
                  bg-white border rounded-lg px-4 py-3 shadow-sm transition-all duration-200
                  ${isFileDuplicate(file.name)
                    ? 'border-yellow-200'
                    : 'border-neutral-200 hover:border-neutral-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  {/* File info */}
                  <div className="flex items-center min-w-0 flex-1">
                    <FontAwesomeIcon
                      icon={faFileLines}
                      className="text-neutral-400 mr-3 flex-shrink-0"
                    />
                    <span className="font-medium text-neutral-900 truncate mr-2">{file.name}</span>
                    {isFileDuplicate(file.name) && (
                      <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium flex items-center flex-shrink-0">
                        Duplicate
                      </span>
                    )}
                  </div>

                  {/* Status & Record Count */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file)}
                      <span className="text-sm text-neutral-600">
                        {file.parseStatus === 'parsing' && 'Parsing...'}
                        {file.parseStatus === 'complete' && (
                          <span className="text-green-600">
                            {file.parseResult?.rowCount.toLocaleString()} records
                          </span>
                        )}
                        {file.parseStatus === 'error' && (
                          <span className="text-red-600">{file.parseError || 'Error'}</span>
                        )}
                        {file.parseStatus === 'pending' && 'Waiting...'}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveFile(file.id)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                      title="Remove file"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStep;
