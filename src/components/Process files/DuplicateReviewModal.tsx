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

const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  isOpen,
  duplicates,
  fileName,
  onClose,
  onApply,
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleToggle = (row: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(row)) {
      newSelected.delete(row);
    } else {
      newSelected.add(row);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedRows(new Set(duplicates.map((d) => d.row)));
  };

  const handleDeselectAll = () => {
    setSelectedRows(new Set());
  };

  const handleApply = () => {
    onApply(Array.from(selectedRows));
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h3 id="duplicate-modal-title" className="text-lg font-semibold">
              Duplicate Records ({duplicates.length})
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className="text-sm text-neutral-500 mb-4">
              The following records in <strong>{fileName}</strong> appear to be duplicates:
            </p>

            {/* Duplicate List */}
            <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
              {duplicates.map((duplicate, index) => (
                <label
                  key={index}
                  className={`
                    flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedRows.has(duplicate.row)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(duplicate.row)}
                    onChange={() => handleToggle(duplicate.row)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      Row {duplicate.row}: {duplicate.description} - {formatAmount(duplicate.amount)} - {duplicate.date}
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      ↳ Found in: {duplicate.matchSource}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-neutral-600 hover:text-neutral-700"
              >
                Deselect All
              </button>
            </div>

            {/* Info */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600">
              <strong>Selected rows will be INCLUDED</strong> in export (imported anyway).
              <br />
              <strong>Unselected rows will be SKIPPED</strong>.
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <span className="text-sm text-neutral-500">
              {selectedRows.size} of {duplicates.length} selected to include
            </span>
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
                Apply
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
