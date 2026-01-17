import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import type { Transaction, CreateTransactionInput } from '../../models/MasterData';
import { findDuplicates } from '../../services/masterDataService';

interface ImportPreviewStepProps {
  /** Transactions to be imported (after mapping) */
  transactions: CreateTransactionInput[];
  /** Called when user confirms import with selected transactions */
  onImport: (transactions: CreateTransactionInput[]) => Promise<void>;
  /** Called when user cancels */
  onCancel: () => void;
  /** Called to go back to mapping step */
  onBack: () => void;
}

interface PreviewTransaction extends CreateTransactionInput {
  index: number;
  isDuplicate: boolean;
  existingTransaction?: Transaction;
}

// Memoized table row component to prevent unnecessary re-renders
interface TableRowProps {
  item: PreviewTransaction;
  isSelected: boolean;
  onToggle: (index: number) => void;
  formatAmount: (amount: number) => string;
}

const TableRow = memo<TableRowProps>(({ item, isSelected, onToggle, formatAmount }) => (
  <tr
    className={`
      ${item.isDuplicate ? 'bg-yellow-50' : 'bg-white'}
      ${!isSelected ? 'opacity-50' : ''}
      hover:bg-neutral-50
    `}
  >
    <td className="px-4 py-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(item.index)}
        className="rounded border-neutral-300"
      />
    </td>
    <td className="px-4 py-3">
      {item.isDuplicate ? (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Duplicate
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          New
        </span>
      )}
    </td>
    <td className="px-4 py-3 text-neutral-900">{item.date}</td>
    <td className="px-4 py-3 text-neutral-900 max-w-[200px] truncate" title={item.merchant}>
      {item.merchant}
    </td>
    <td className="px-4 py-3 text-neutral-600">{item.category || '-'}</td>
    <td className={`px-4 py-3 text-right font-medium ${item.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
      {formatAmount(item.amount)}
    </td>
    <td className="px-4 py-3 text-neutral-600 max-w-[150px] truncate" title={`${item.institutionName} - ${item.accountName}`}>
      {item.institutionName && item.accountName
        ? `${item.institutionName} - ${item.accountName}`
        : item.accountName || item.institutionName || '-'}
    </td>
  </tr>
));

const ImportPreviewStep: FC<ImportPreviewStepProps> = ({
  transactions,
  onImport,
  onCancel,
  onBack
}) => {
  const [previewData, setPreviewData] = useState<PreviewTransaction[]>([]);
  // Use Set for O(1) selection operations - much faster than recreating objects
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for duplicates on mount
  useEffect(() => {
    const checkDuplicates = async () => {
      try {
        setLoading(true);
        setError(null);

        const duplicatesMap = await findDuplicates(transactions);

        const preview: PreviewTransaction[] = transactions.map((txn, index) => {
          const existingTransaction = duplicatesMap.get(index);
          const isDuplicate = !!existingTransaction;

          return {
            ...txn,
            index,
            isDuplicate,
            existingTransaction,
          };
        });

        // By default, select new transactions (non-duplicates)
        const initialSelected = new Set<number>();
        preview.forEach(item => {
          if (!item.isDuplicate) {
            initialSelected.add(item.index);
          }
        });

        setPreviewData(preview);
        setSelectedIndices(initialSelected);
      } catch (err) {
        console.error('Error checking duplicates:', err);
        setError('Failed to check for duplicates');
      } finally {
        setLoading(false);
      }
    };

    checkDuplicates();
  }, [transactions]);

  // Toggle selection of a transaction - stable callback
  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Select/deselect all
  const toggleAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIndices(new Set(previewData.map(item => item.index)));
    } else {
      setSelectedIndices(new Set());
    }
  }, [previewData]);

  // Select/deselect all duplicates
  const toggleAllDuplicates = useCallback((selected: boolean) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      previewData.forEach(item => {
        if (item.isDuplicate) {
          if (selected) {
            next.add(item.index);
          } else {
            next.delete(item.index);
          }
        }
      });
      return next;
    });
  }, [previewData]);

  // Handle import
  const handleImport = async () => {
    const selectedTransactions = previewData
      .filter(item => selectedIndices.has(item.index))
      .map(({ index, isDuplicate, existingTransaction, ...txn }) => txn);

    if (selectedTransactions.length === 0) {
      setError('Please select at least one transaction to import');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      await onImport(selectedTransactions);
    } catch (err) {
      console.error('Error importing:', err);
      setError('Failed to import transactions');
      setImporting(false);
    }
  };

  // Calculate summary stats - memoized to avoid recalculation on every render
  const { totalCount, duplicateCount, newCount, selectedCount, selectedDuplicates } = useMemo(() => {
    const total = previewData.length;
    const dupes = previewData.filter(t => t.isDuplicate).length;
    const selected = selectedIndices.size;
    const selectedDupes = previewData.filter(t => t.isDuplicate && selectedIndices.has(t.index)).length;
    return {
      totalCount: total,
      duplicateCount: dupes,
      newCount: total - dupes,
      selectedCount: selected,
      selectedDuplicates: selectedDupes,
    };
  }, [previewData, selectedIndices]);

  // Format currency - stable reference
  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-neutral-600">Checking for duplicates...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Import Preview</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Review the transactions before importing. Duplicates are automatically detected and deselected.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <span className="font-medium">Total in File</span>
          </div>
          <p className="text-2xl font-semibold text-blue-800">{totalCount}</p>
          <p className="text-xs text-blue-600 mt-1">
            {duplicateCount > 0
              ? `${newCount} new, ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''}`
              : 'No duplicates detected'}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
            <span className="font-medium">Selected for Import</span>
          </div>
          <p className="text-2xl font-semibold text-green-800">{selectedCount}</p>
          <p className="text-xs text-green-600 mt-1">
            {selectedDuplicates > 0
              ? `includes ${selectedDuplicates} duplicate${selectedDuplicates > 1 ? 's' : ''}`
              : 'Ready to import'}
          </p>
        </div>
      </div>

      {/* Duplicate Warning - shown when duplicates are selected */}
      {selectedDuplicates > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-start gap-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Warning:</span> You have selected {selectedDuplicates} duplicate{selectedDuplicates > 1 ? 's' : ''} for import.
            These transactions already exist in your master data and will create duplicate entries.
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-neutral-500">Quick actions:</span>
        <button
          type="button"
          onClick={() => toggleAll(true)}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => toggleAll(false)}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          Deselect all
        </button>
        {duplicateCount > 0 && (
          <>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => toggleAllDuplicates(false)}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Skip all duplicates
            </button>
            <button
              type="button"
              onClick={() => toggleAllDuplicates(true)}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Include duplicates
            </button>
          </>
        )}
      </div>

      {/* Transaction Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-neutral-50 border-b border-neutral-200 shadow-[0_1px_0_0_rgb(229,231,235)]">
                <th className="px-4 py-3 text-left font-medium text-neutral-600 w-12 bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={selectedCount === totalCount}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 bg-neutral-50">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 bg-neutral-50">Date</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 bg-neutral-50">Merchant</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 bg-neutral-50">Category</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600 bg-neutral-50">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 bg-neutral-50">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {previewData.map((item) => (
                <TableRow
                  key={item.index}
                  item={item}
                  isSelected={selectedIndices.has(item.index)}
                  onToggle={toggleSelection}
                  formatAmount={formatAmount}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        {/* Left: Back button (tertiary style) */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          <span>Back to Mapping</span>
        </button>

        {/* Right: Cancel and Import */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || selectedCount === 0}
            className={`px-4 py-2.5 font-medium rounded-lg transition-colors flex items-center gap-2 ${
              importing || selectedCount === 0
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewStep;
