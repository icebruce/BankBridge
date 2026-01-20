import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTriangleExclamation,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-regular-svg-icons';
import type { FileEntry, ProcessingResult, ParseError, DuplicateMatch } from './ProcessFilesPage';
import { fetchImportTemplates } from '../../services/importTemplateService';
import { getAccounts } from '../../services/settingsService';
import ErrorReviewModal from './ErrorReviewModal';
import DuplicateReviewModal from './DuplicateReviewModal';

interface ReviewStepProps {
  files: FileEntry[];
  results: ProcessingResult[];
  onResultsChange: (results: ProcessingResult[]) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  files,
  results,
  onResultsChange,
}) => {
  const [processing, setProcessing] = useState(true);
  const [errorModalFile, setErrorModalFile] = useState<ProcessingResult | null>(null);
  const [duplicateModalFile, setDuplicateModalFile] = useState<ProcessingResult | null>(null);

  // Process files when component mounts
  useEffect(() => {
    const processFiles = async () => {
      setProcessing(true);

      try {
        const [templates, accounts] = await Promise.all([
          fetchImportTemplates(),
          getAccounts(),
        ]);

        // Simulate processing for each file
        const newResults: ProcessingResult[] = [];

        for (const file of files) {
          if (!file.selectedTemplateId) continue;

          const template = templates.find((t) => t.id === file.selectedTemplateId);
          const account = template?.accountId
            ? accounts.find((a) => a.id === template.accountId)
            : null;

          // For now, create mock results - in real implementation, this would apply
          // the template mappings and detect duplicates
          const mockErrors: ParseError[] = [];
          const mockDuplicates: DuplicateMatch[] = [];
          const totalRecords = file.parseResult?.rowCount || 0;

          // Add some mock data for demonstration
          // In real implementation, this would come from actual processing
          if (Math.random() > 0.7) {
            mockErrors.push({
              row: Math.floor(Math.random() * totalRecords) + 1,
              message: 'Invalid date format',
              field: 'date',
            });
          }

          if (Math.random() > 0.6) {
            mockDuplicates.push({
              row: Math.floor(Math.random() * totalRecords) + 1,
              description: 'Sample transaction',
              amount: Math.random() * 100,
              date: new Date().toISOString().split('T')[0],
              matchSource: 'Existing data (imported Jan 20)',
            });
          }

          newResults.push({
            fileId: file.id,
            templateId: file.selectedTemplateId,
            templateName: template?.name || 'Unknown Template',
            accountDisplayName: account?.exportDisplayName || template?.account || 'Unknown Account',
            transactions: [], // Would contain actual transformed transactions
            errors: mockErrors,
            duplicates: mockDuplicates,
            totalRecords,
            processedRecords: totalRecords - mockErrors.length - mockDuplicates.length,
          });
        }

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        onResultsChange(newResults);
        setProcessing(false);
      } catch (error) {
        console.error('Processing failed:', error);
        setProcessing(false);
      }
    };

    if (results.length === 0) {
      processFiles();
    } else {
      setProcessing(false);
    }
  }, [files, results.length, onResultsChange]);

  const getFileResult = (fileId: string): ProcessingResult | undefined => {
    return results.find((r) => r.fileId === fileId);
  };

  const getFileStatus = (result: ProcessingResult): 'ready' | 'needs-review' => {
    if (result.errors.length > 0 || result.duplicates.length > 0) {
      return 'needs-review';
    }
    return 'ready';
  };

  // Calculate summary totals
  const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0);
  const totalProcessed = results.reduce((sum, r) => sum + r.processedRecords, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates.length, 0);

  if (processing) {
    return (
      <div className="bg-white p-10 border border-neutral-200 rounded-lg shadow-sm">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-2xl text-blue-500 animate-spin"
            />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Processing Files</h3>
          <p className="text-neutral-600 mb-6">
            Applying import templates and checking for duplicates...
          </p>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Review Results ({files.length} file{files.length !== 1 ? 's' : ''})
          </h3>
          <p className="text-sm text-neutral-600">
            Review processing results and resolve any issues before exporting
          </p>
        </div>
      </div>

      {/* Summary Stats Panel */}
      <div className="bg-white p-5 border border-neutral-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center p-3 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-neutral-900">{totalRecords.toLocaleString()}</div>
            <div className="text-sm font-medium text-neutral-500 mt-1">Total Records</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalProcessed.toLocaleString()}</div>
            <div className="text-sm font-medium text-green-700 mt-1">Ready to Export</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">{totalDuplicates.toLocaleString()}</div>
            <div className="text-sm font-medium text-amber-700 mt-1">Duplicates</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{totalErrors.toLocaleString()}</div>
            <div className="text-sm font-medium text-red-700 mt-1">Errors</div>
          </div>
        </div>
      </div>

      {/* File Results */}
      <div className="max-h-[400px] overflow-y-auto space-y-4">
        {files.map((file) => {
          const result = getFileResult(file.id);
          if (!result) return null;

          const status = getFileStatus(result);
          const hasIssues = result.errors.length > 0 || result.duplicates.length > 0;

          return (
            <div
              key={file.id}
              className={`
                bg-white border rounded-lg p-4 shadow-sm transition-all duration-200
                ${status === 'needs-review'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-neutral-200 hover:border-neutral-300'
                }
              `}
            >
              {/* File Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                    status === 'ready' ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {status === 'ready' ? (
                      <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                    ) : (
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-600" />
                    )}
                  </div>
                  <FontAwesomeIcon
                    icon={faFileLines}
                    className="text-neutral-400 mr-3 flex-shrink-0"
                  />
                  <span className="font-medium text-neutral-900 truncate">{file.name}</span>
                </div>
                {status === 'ready' && (
                  <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="mr-1.5" />
                    Ready
                  </span>
                )}
                {status === 'needs-review' && (
                  <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-medium flex items-center">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" />
                    Needs review
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="bg-neutral-50 p-3 rounded-lg mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">
                    <span className="font-semibold text-neutral-900">{result.processedRecords.toLocaleString()}</span> records processed
                  </span>
                  {hasIssues && (
                    <div className="flex items-center gap-3">
                      {result.duplicates.length > 0 && (
                        <span className="text-amber-600 font-medium">
                          {result.duplicates.length} duplicate{result.duplicates.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {result.errors.length > 0 && (
                        <span className="text-red-600 font-medium">
                          {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Template & Account Info */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  <span className="font-medium text-neutral-700">{result.templateName}</span>
                  <span className="mx-2">→</span>
                  <span>{result.accountDisplayName}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {result.errors.length > 0 && (
                    <button
                      onClick={() => setErrorModalFile(result)}
                      className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:shadow-sm transition-all duration-200"
                    >
                      Review Errors
                    </button>
                  )}
                  {result.duplicates.length > 0 && (
                    <button
                      onClick={() => setDuplicateModalFile(result)}
                      className="px-3 py-1.5 text-sm border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 hover:shadow-sm transition-all duration-200"
                    >
                      Review Duplicates
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Review Modal */}
      {errorModalFile && (
        <ErrorReviewModal
          isOpen={true}
          errors={errorModalFile.errors}
          fileName={files.find((f) => f.id === errorModalFile.fileId)?.name || ''}
          onClose={() => setErrorModalFile(null)}
          onApply={(action) => {
            // Handle error action (skip or reject file)
            console.log('Error action:', action);
            setErrorModalFile(null);
          }}
        />
      )}

      {/* Duplicate Review Modal */}
      {duplicateModalFile && (
        <DuplicateReviewModal
          isOpen={true}
          duplicates={duplicateModalFile.duplicates}
          fileName={files.find((f) => f.id === duplicateModalFile.fileId)?.name || ''}
          onClose={() => setDuplicateModalFile(null)}
          onApply={(selectedRows) => {
            // Handle selected duplicates (include in export)
            console.log('Include duplicates:', selectedRows);
            setDuplicateModalFile(null);
          }}
        />
      )}
    </div>
  );
};

export default ReviewStep;
