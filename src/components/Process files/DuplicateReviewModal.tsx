import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import type { DuplicateMatch } from './ProcessFilesPage';

interface DuplicateReviewModalProps {
  isOpen: boolean;
  duplicates: DuplicateMatch[];
  fileName: string;
  onClose: () => void;
  onApply: (selectedRows: number[]) => void;
}

type Selection = 'original' | 'duplicate';

const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  isOpen,
  duplicates,
  fileName,
  onClose,
  onApply,
}) => {
  // Track selection for each duplicate set: 'original' keeps original (skips duplicate), 'duplicate' keeps duplicate
  const [selections, setSelections] = useState<Record<number, Selection>>(() => {
    // Default to keeping original (skip duplicates)
    const initial: Record<number, Selection> = {};
    duplicates.forEach((_, idx) => {
      initial[idx] = 'original';
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleSelectionChange = (index: number, selection: Selection) => {
    setSelections((prev) => ({ ...prev, [index]: selection }));
  };

  const handleApply = () => {
    // Return rows that should be INCLUDED (where user selected 'duplicate')
    const selectedRows = duplicates
      .filter((_, idx) => selections[idx] === 'duplicate')
      .map((d) => d.row);
    onApply(selectedRows);
  };

  const formatAmount = (amount: number | undefined): string => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getSourceLabel = (matchSource: string): string => {
    if (matchSource.includes('Existing data')) {
      return 'Master Data';
    } else if (matchSource.includes('Another file')) {
      return 'Another File';
    }
    return 'This File';
  };

  // Count how many duplicates will be included
  const duplicatesToInclude = Object.values(selections).filter((s) => s === 'duplicate').length;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div>
              <h3 id="duplicate-modal-title" className="text-lg font-semibold">
                Review Duplicates
              </h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''} found in {fileName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {duplicates.map((duplicate, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg overflow-hidden">
                  {/* Set Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
                    <span className="text-sm font-medium text-neutral-700">
                      Duplicate Set #{index + 1}
                    </span>
                    <span className="text-xs text-neutral-500">
                      Source: {getSourceLabel(duplicate.matchSource)}
                    </span>
                  </div>

                  {/* Comparison Cards */}
                  <div className="p-4 space-y-3">
                    {/* Original Record */}
                    <label
                      className={`
                        block p-4 border rounded-lg cursor-pointer transition-all
                        ${selections[index] === 'original'
                          ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-200'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="radio"
                          name={`duplicate-${index}`}
                          checked={selections[index] === 'original'}
                          onChange={() => handleSelectionChange(index, 'original')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-neutral-900">
                          Original
                          {duplicate.originalRow && (
                            <span className="text-neutral-500 font-normal ml-1">(Row {duplicate.originalRow})</span>
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 ml-7">
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Date</div>
                          <div className="text-sm font-medium text-neutral-900">
                            {formatDate(duplicate.originalDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Amount</div>
                          <div className="text-sm font-medium text-neutral-900">
                            {formatAmount(duplicate.originalAmount)}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-neutral-500 mb-1">Description</div>
                          <div className="text-sm font-medium text-neutral-900 truncate">
                            {duplicate.originalDescription || '-'}
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Duplicate Record */}
                    <label
                      className={`
                        block p-4 border rounded-lg cursor-pointer transition-all
                        ${selections[index] === 'duplicate'
                          ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-200'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="radio"
                          name={`duplicate-${index}`}
                          checked={selections[index] === 'duplicate'}
                          onChange={() => handleSelectionChange(index, 'duplicate')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-neutral-900">
                          Duplicate
                          <span className="text-neutral-500 font-normal ml-1">(Row {duplicate.row})</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 ml-7">
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Date</div>
                          <div className="text-sm font-medium text-neutral-900">
                            {formatDate(duplicate.date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Amount</div>
                          <div className="text-sm font-medium text-neutral-900">
                            {formatAmount(duplicate.amount)}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-neutral-500 mb-1">Description</div>
                          <div className="text-sm font-medium text-neutral-900 truncate">
                            {duplicate.description || '-'}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <div className="text-sm text-neutral-600">
              <span className="font-medium">{duplicates.length - duplicatesToInclude}</span> originals kept,{' '}
              <span className="font-medium">{duplicatesToInclude}</span> duplicates to include
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2.5 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DuplicateReviewModal;
