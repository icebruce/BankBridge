import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Account, AccountType } from '../../models/Settings';
import { generateExportDisplayName } from '../../models/Settings';

interface AccountFormModalProps {
  account: Account | null;
  onSave: (data: {
    institutionName: string;
    accountName: string;
    accountType: AccountType;
  }) => void;
  onCancel: () => void;
}

const AccountFormModal: FC<AccountFormModalProps> = ({ account, onSave, onCancel }) => {
  const [institutionName, setInstitutionName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [errors, setErrors] = useState<{
    institutionName?: string;
    accountName?: string;
    accountType?: string;
  }>({});

  // Compute export display name (read-only)
  const exportDisplayName = institutionName && accountName
    ? generateExportDisplayName(institutionName, accountName)
    : '';

  // Initialize form when account changes
  useEffect(() => {
    if (account) {
      setInstitutionName(account.institutionName);
      setAccountName(account.accountName);
      setAccountType(account.accountType || '');
    } else {
      setInstitutionName('');
      setAccountName('');
      setAccountType('');
    }
    setErrors({});
  }, [account]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required';
    }

    if (!accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (!accountType) {
      newErrors.accountType = 'Account type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSave({
      institutionName: institutionName.trim(),
      accountName: accountName.trim(),
      accountType: accountType as AccountType
    });
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h3 id="modal-title" className="text-lg font-semibold text-neutral-900">
              {account ? 'Edit Account' : 'Add Account'}
            </h3>
            <button
              type="button"
              className="rounded-lg p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              onClick={onCancel}
              aria-label="Close dialog"
            >
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5">
              {/* Institution Name */}
              <div>
                <label
                  htmlFor="institutionName"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Institution Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="institutionName"
                  type="text"
                  className={`electronInput w-full px-3 py-2.5 border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
                    errors.institutionName
                      ? 'border-red-300 bg-red-50'
                      : 'border-neutral-300 hover:border-neutral-400'
                  }`}
                  placeholder="e.g., TD Bank, Chase, Fidelity"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  autoFocus
                />
                {errors.institutionName && (
                  <p className="text-red-600 text-sm mt-1.5">{errors.institutionName}</p>
                )}
              </div>

              {/* Account Name */}
              <div>
                <label
                  htmlFor="accountName"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="accountName"
                  type="text"
                  className={`electronInput w-full px-3 py-2.5 border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
                    errors.accountName
                      ? 'border-red-300 bg-red-50'
                      : 'border-neutral-300 hover:border-neutral-400'
                  }`}
                  placeholder="e.g., Checking, Savings, Sapphire Reserve"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
                {errors.accountName && (
                  <p className="text-red-600 text-sm mt-1.5">{errors.accountName}</p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label
                  htmlFor="accountType"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="accountType"
                  className={`electronInput w-full px-3 py-2.5 border rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none bg-white ${
                    errors.accountType
                      ? 'border-red-300 bg-red-50'
                      : 'border-neutral-300 hover:border-neutral-400'
                  }`}
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select account type</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="investment">Investment</option>
                </select>
                {errors.accountType && (
                  <p className="text-red-600 text-sm mt-1.5">{errors.accountType}</p>
                )}
              </div>

              {/* Export Display Name (Read-only) */}
              {exportDisplayName && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Export Display Name
                  </label>
                  <div className="w-full px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700">
                    {exportDisplayName}
                  </div>
                  <p className="text-neutral-500 text-xs mt-1.5">
                    This name will appear in exports. Auto-generated from institution and account name.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <button
                type="button"
                className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                {account ? 'Save Changes' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountFormModal;
