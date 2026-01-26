import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faFileExport } from '@fortawesome/free-solid-svg-icons';
import Stepper from './Stepper';
import UploadStep from './UploadStep';
import ConfigureStep from './ConfigureStep';
import ReviewStep from './ReviewStep';
import ExportStep from './ExportStep';
import type { DuplicateMatch } from '../../services/fileProcessingService';

// Types
export interface FileEntry {
  id: string;
  file: File;
  name: string;
  size: number;
  parseStatus: 'pending' | 'parsing' | 'complete' | 'error';
  parseResult?: {
    columns: string[];
    rowCount: number;
  };
  parseError?: string;
  selectedTemplateId?: string;
  suggestedTemplateId?: string;
  isAutoMatched?: boolean;
  hasColumnMismatch?: boolean;
}

export interface ProcessingMetrics {
  totalAmount: number;
  minDate: string | null;
  maxDate: string | null;
}

export interface ProcessingResult {
  fileId: string;
  templateId: string;
  templateName: string;
  accountDisplayName: string;
  transactions: Transaction[];
  errors: ParseError[];
  duplicates: DuplicateMatch[];
  totalRecords: number;
  processedRecords: number;
  originalMetrics: ProcessingMetrics;
  processedMetrics: ProcessingMetrics;
}

export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  originalStatement: string;
}

export interface ParseError {
  row: number;
  message: string;
  field?: string;
}

// DuplicateMatch is imported from fileProcessingService
export type { DuplicateMatch };

// Step definitions
const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'configure', label: 'Configure' },
  { id: 'review', label: 'Review' },
  { id: 'export', label: 'Export' },
];

const ProcessFilesPage: React.FC = () => {
  // Wizard state
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [exportPath, setExportPath] = useState(() =>
    localStorage.getItem('bankbridge_export_path') || ''
  );
  const [exportSuccess, setExportSuccess] = useState(false);

  // Persist export path
  useEffect(() => {
    if (exportPath) {
      localStorage.setItem('bankbridge_export_path', exportPath);
    }
  }, [exportPath]);

  // Notify App.tsx about work status for navigation warning
  useEffect(() => {
    const hasWork = files.length > 0 && !exportSuccess;
    window.dispatchEvent(
      new CustomEvent('process-files-work-status', { detail: { hasWork } })
    );
  }, [files.length, exportSuccess]);

  // Browser close/refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (files.length > 0 && !exportSuccess) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [files.length, exportSuccess]);

  // File operations
  const addFiles = useCallback((newFiles: File[]) => {
    const entries: FileEntry[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      parseStatus: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...entries]);
    // Clear results since file list changed - will need reprocessing
    setResults([]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    // Clear results since file list changed - will need reprocessing
    setResults([]);
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<FileEntry>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    // Clear results if template assignment changed - will need reprocessing
    if ('selectedTemplateId' in updates) {
      setResults([]);
    }
  }, []);

  // Navigation
  const handleStepClick = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleProcessMore = () => {
    setStep(1);
    setFiles([]);
    setResults([]);
    setExportSuccess(false);
  };

  // Check if can proceed to next step
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        // At least one file uploaded
        return files.length > 0;
      case 2:
        // All files have template selected AND no column mismatches
        return files.length > 0 &&
               files.every((f) => f.selectedTemplateId) &&
               !files.some((f) => f.hasColumnMismatch);
      case 3:
        // All issues reviewed (we'll implement this logic later)
        return results.length > 0;
      case 4:
        // Export path selected
        return exportPath.trim().length > 0;
      default:
        return false;
    }
  };

  // Get disabled message for Next button
  const getDisabledMessage = (): string | null => {
    switch (step) {
      case 1:
        if (files.length === 0) return 'Upload at least one file to continue';
        return null;
      case 2:
        if (files.some((f) => !f.selectedTemplateId)) {
          return 'Select templates for all files to continue';
        }
        if (files.some((f) => f.hasColumnMismatch)) {
          return 'Fix column mismatches before continuing';
        }
        return null;
      case 3:
        if (results.length === 0) return 'Processing...';
        return null;
      case 4:
        if (!exportPath.trim()) return 'Select an export location';
        return null;
      default:
        return null;
    }
  };

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <UploadStep
            files={files}
            onAddFiles={addFiles}
            onRemoveFile={removeFile}
            onUpdateFile={updateFile}
          />
        );
      case 2:
        return (
          <ConfigureStep
            files={files}
            onUpdateFile={updateFile}
          />
        );
      case 3:
        return (
          <ReviewStep
            files={files}
            results={results}
            onResultsChange={setResults}
          />
        );
      case 4:
        return (
          <ExportStep
            results={results}
            exportPath={exportPath}
            onExportPathChange={setExportPath}
            exportSuccess={exportSuccess}
            onExportSuccess={() => setExportSuccess(true)}
            onProcessMore={handleProcessMore}
          />
        );
      default:
        return null;
    }
  };

  const disabledMessage = getDisabledMessage();

  return (
    <div className="flex flex-col h-full">
      {/* Stepper - serves as the page title */}
      <div className="mb-8">
        <Stepper
          steps={STEPS}
          currentStep={step}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 mb-6">
        {renderStep()}
      </div>

      {/* Navigation - only show if not on export success */}
      {!(step === 4 && exportSuccess) && (
        <div className="flex items-center justify-between">
          {/* Back button */}
          <div>
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:shadow-sm transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                Back
              </button>
            ) : (
              <div></div>
            )}
          </div>

          {/* Disabled message + Next button */}
          <div className="flex items-center gap-4">
            {disabledMessage && (
              <span className="text-sm text-neutral-500 italic">{disabledMessage}</span>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                canProceed()
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-sm'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {step === 2 ? (
                <>
                  Process Files
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                </>
              ) : step === 4 ? (
                <>
                  Export Files
                  <FontAwesomeIcon icon={faFileExport} className="text-sm" />
                </>
              ) : (
                <>
                  Next
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProcessFilesPage;
