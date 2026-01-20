import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import type { ParseError } from './ProcessFilesPage';

interface ErrorReviewModalProps {
  isOpen: boolean;
  errors: ParseError[];
  fileName: string;
  onClose: () => void;
  onApply: (action: 'skip' | 'reject-file') => void;
}

const ErrorReviewModal: React.FC<ErrorReviewModalProps> = ({
  isOpen,
  errors,
  fileName,
  onClose,
  onApply,
}) => {
  const [selectedAction, setSelectedAction] = useState<'skip' | 'reject-file'>('skip');

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(selectedAction);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h3 id="error-modal-title" className="text-lg font-semibold">
              Parsing Errors ({errors.length})
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
              The following errors were found in <strong>{fileName}</strong>:
            </p>

            {/* Error List */}
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                >
                  <div className="font-medium text-red-700">
                    Row {error.row}: {error.message}
                  </div>
                  {error.field && (
                    <div className="text-red-600 text-xs mt-1">
                      Field: {error.field}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-700">
                What would you like to do with these rows?
              </p>

              <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="radio"
                  name="errorAction"
                  value="skip"
                  checked={selectedAction === 'skip'}
                  onChange={() => setSelectedAction('skip')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium">Skip these rows</div>
                  <div className="text-sm text-neutral-500">
                    Exclude from export, continue with remaining records
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="radio"
                  name="errorAction"
                  value="reject-file"
                  checked={selectedAction === 'reject-file'}
                  onChange={() => setSelectedAction('reject-file')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium">Send to reject file</div>
                  <div className="text-sm text-neutral-500">
                    Save problematic rows to a separate file for manual review
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
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
    </div>,
    document.body
  );
};

export default ErrorReviewModal;
