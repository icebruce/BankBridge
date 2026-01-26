import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTriangleExclamation,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-regular-svg-icons';
import type { FileEntry, ProcessingResult } from './ProcessFilesPage';
import { fetchImportTemplates } from '../../services/importTemplateService';
import { getAccounts } from '../../services/settingsService';
import { fileParserService } from '../../services/fileParserService';
import { processFileData, calculateOriginalMetrics, type ProcessedTransaction } from '../../services/fileProcessingService';
import ErrorReviewModal from './ErrorReviewModal';
import DuplicateReviewModal from './DuplicateReviewModal';

interface ReviewStepProps {
  files: FileEntry[];
  results: ProcessingResult[];
  onResultsChange: (results: ProcessingResult[]) => void;
}

// Helper functions
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDateRange = (minDate: string | null, maxDate: string | null): string => {
  if (!minDate || !maxDate) return 'N/A';

  // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shifts
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const minOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const maxOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${parseLocalDate(minDate).toLocaleDateString('en-US', minOpts)} - ${parseLocalDate(maxDate).toLocaleDateString('en-US', maxOpts)}`;
};

const formatDiff = (diff: number, isCurrency: boolean = false): string | null => {
  if (diff === 0) return null;
  const sign = diff > 0 ? '+' : '';
  if (isCurrency) {
    return `(${sign}${formatCurrency(diff)})`;
  }
  return `(${sign}${diff.toLocaleString()})`;
};

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
    const processFilesData = async () => {
      setProcessing(true);

      try {
        const [templates, accounts] = await Promise.all([
          fetchImportTemplates(),
          getAccounts(),
        ]);

        const newResults: ProcessingResult[] = [];
        // Track all processed transactions across files for cross-file duplicate detection
        let allSessionTransactions: ProcessedTransaction[] = [];

        for (const file of files) {
          if (!file.selectedTemplateId) continue;

          const template = templates.find((t) => t.id === file.selectedTemplateId);
          if (!template) continue;

          const account = template.accountId
            ? accounts.find((a) => a.id === template.accountId)
            : null;

          // Read the actual file content
          const fileContent = await file.file.text();

          // Parse the CSV content
          const parsed = fileParserService.parseCSVContent(fileContent);
          if (!parsed.data || parsed.data.length === 0) {
            // Handle empty or invalid file
            newResults.push({
              fileId: file.id,
              templateId: file.selectedTemplateId,
              templateName: template.name || 'Unknown Template',
              accountDisplayName: account?.exportDisplayName || template.account || 'Unknown Account',
              transactions: [],
              errors: [{ row: 0, message: 'No data found in file' }],
              duplicates: [],
              totalRecords: 0,
              processedRecords: 0,
              originalMetrics: { totalAmount: 0, minDate: null, maxDate: null },
              processedMetrics: { totalAmount: 0, minDate: null, maxDate: null },
            });
            continue;
          }

          const totalRecords = parsed.data.length;

          // Calculate original metrics from raw data (before any filtering)
          const originalMetrics = calculateOriginalMetrics(parsed.data, template);

          // Process the file data with real validation and duplicate detection
          const accountInfo = account
            ? { institutionName: account.institutionName, accountName: account.accountName }
            : { institutionName: 'Unknown', accountName: 'Unknown' };

          const processingResult = await processFileData(
            parsed.data,
            template,
            accountInfo,
            file.name,
            allSessionTransactions
          );

          // Add processed transactions to session list for cross-file duplicate detection
          allSessionTransactions = [...allSessionTransactions, ...processingResult.transactions];

          // Map to ProcessingResult format
          newResults.push({
            fileId: file.id,
            templateId: file.selectedTemplateId,
            templateName: template.name || 'Unknown Template',
            accountDisplayName: account?.exportDisplayName || template.account || 'Unknown Account',
            transactions: processingResult.transactions.map(t => ({
              date: t.date,
              merchant: t.merchant,
              amount: t.amount,
              originalStatement: t.originalStatement,
            })),
            errors: processingResult.errors,
            duplicates: processingResult.duplicates,
            totalRecords,
            processedRecords: processingResult.transactions.length,
            originalMetrics,
            processedMetrics: processingResult.metrics,
          });
        }

        onResultsChange(newResults);
        setProcessing(false);
      } catch (error) {
        console.error('Processing failed:', error);
        setProcessing(false);
      }
    };

    if (results.length === 0) {
      processFilesData();
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

      {/* Simplified Aggregate Panel */}
      <div className="bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Total: <span className="font-semibold text-neutral-900">{totalRecords.toLocaleString()}</span>
          </span>
          <span className="text-green-600">
            Ready: <span className="font-semibold">{totalProcessed.toLocaleString()}</span>
          </span>
          <span className="text-amber-600">
            Duplicates: <span className="font-semibold">{totalDuplicates}</span>
          </span>
          <span className="text-red-600">
            Errors: <span className="font-semibold">{totalErrors}</span>
          </span>
        </div>
      </div>

      {/* Processing Summary - File Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-neutral-700">Processing Summary</h4>

        <div className="max-h-[500px] overflow-y-auto space-y-4">
          {files.map((file) => {
            const result = getFileResult(file.id);
            if (!result) return null;

            const status = getFileStatus(result);
            const hasIssues = result.errors.length > 0 || result.duplicates.length > 0;

            // Calculate diffs
            const recordsDiff = result.processedRecords - result.totalRecords;
            const amountDiff = result.processedMetrics.totalAmount - result.originalMetrics.totalAmount;

            return (
              <div
                key={file.id}
                className={`
                  bg-white border rounded-lg shadow-sm transition-all duration-200 overflow-hidden
                  ${status === 'needs-review'
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-neutral-200 hover:border-neutral-300'
                  }
                `}
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faFileLines}
                            className="text-neutral-400 mr-2 flex-shrink-0"
                          />
                          <span className="font-medium text-neutral-900 truncate">{file.name}</span>
                        </div>
                        <div className="text-sm text-neutral-500 mt-0.5">
                          {result.accountDisplayName}
                        </div>
                      </div>
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
                </div>

                {/* Card Body - Original vs Processed Comparison */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Original Column */}
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-neutral-500 mb-3">Original</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Total Records:</span>
                          <span className="text-sm font-medium text-neutral-900">
                            {result.totalRecords.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Total Amount:</span>
                          <span className="text-sm font-medium text-neutral-900">
                            {formatCurrency(result.originalMetrics.totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Date Range:</span>
                          <span className="text-sm font-medium text-neutral-900">
                            {formatDateRange(result.originalMetrics.minDate, result.originalMetrics.maxDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Processed Column */}
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-neutral-500 mb-3">Processed</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Total Records:</span>
                          <span className="text-sm font-medium text-neutral-900">
                            {result.processedRecords.toLocaleString()}
                            {formatDiff(recordsDiff) && (
                              <span className="text-neutral-500 ml-1">{formatDiff(recordsDiff)}</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Total Amount:</span>
                          <span className="text-sm font-medium text-neutral-900">
                            {formatCurrency(result.processedMetrics.totalAmount)}
                            {formatDiff(amountDiff, true) && (
                              <span className="text-neutral-500 ml-1">{formatDiff(amountDiff, true)}</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Date Range:</span>
                          <span className="text-sm font-medium text-neutral-900">
                            {formatDateRange(result.processedMetrics.minDate, result.processedMetrics.maxDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer - Action Buttons */}
                {hasIssues && (
                  <div className="px-4 py-3 border-t border-neutral-200 bg-white flex justify-end gap-2">
                    {result.errors.length > 0 && (
                      <button
                        onClick={() => setErrorModalFile(result)}
                        className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:shadow-sm transition-all duration-200"
                      >
                        Review Errors ({result.errors.length})
                      </button>
                    )}
                    {result.duplicates.length > 0 && (
                      <button
                        onClick={() => setDuplicateModalFile(result)}
                        className="px-3 py-1.5 text-sm border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 hover:shadow-sm transition-all duration-200"
                      >
                        Review Duplicates ({result.duplicates.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
