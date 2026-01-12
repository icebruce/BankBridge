import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Account, AccountType } from '../../models/Settings';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  checkAccountUsage
} from '../../services/settingsService';
import AccountFormModal from './AccountFormModal';
import TableActions, { TableActionPresets } from '../common/TableActions';

interface AccountConfigurationProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AccountConfiguration: FC<AccountConfigurationProps> = ({ onSuccess, onError }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const loadedAccounts = await getAccounts();
      setAccounts(loadedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      onError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowModal(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleDeleteClick = async (account: Account) => {
    try {
      // Check if account is in use
      const usage = await checkAccountUsage(account.id);

      if (usage.inUse) {
        const reasons: string[] = [];
        if (usage.usedBy.importTemplates.length > 0) {
          reasons.push(`${usage.usedBy.importTemplates.length} import template(s)`);
        }
        if (usage.usedBy.transactions > 0) {
          reasons.push(`${usage.usedBy.transactions} transaction(s)`);
        }
        setDeleteWarning(`This account is in use by: ${reasons.join(', ')}. It cannot be deleted.`);
        setDeletingAccount(account);
      } else {
        setDeleteWarning(null);
        setDeletingAccount(account);
      }
    } catch (error) {
      console.error('Error checking account usage:', error);
      onError('Failed to check account usage');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAccount || deleteWarning) return;

    try {
      await deleteAccount(deletingAccount.id);
      setAccounts(prev => prev.filter(a => a.id !== deletingAccount.id));
      onSuccess('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      onError('Failed to delete account');
    } finally {
      setDeletingAccount(null);
      setDeleteWarning(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingAccount(null);
    setDeleteWarning(null);
  };

  const handleSaveAccount = useCallback(async (data: {
    institutionName: string;
    accountName: string;
    accountType: AccountType;
  }) => {
    try {
      if (editingAccount) {
        // Update existing account
        const updated = await updateAccount(editingAccount.id, data);
        setAccounts(prev => prev.map(a => a.id === editingAccount.id ? updated : a));
        onSuccess('Account updated successfully');
      } else {
        // Create new account
        const created = await createAccount(data);
        setAccounts(prev => [...prev, created]);
        onSuccess('Account created successfully');
      }
      setShowModal(false);
      setEditingAccount(null);
    } catch (error) {
      console.error('Error saving account:', error);
      onError('Failed to save account');
    }
  }, [editingAccount, onSuccess, onError]);

  const handleCancelModal = useCallback(() => {
    setShowModal(false);
    setEditingAccount(null);
  }, []);

  const getAccountTypeLabel = (type?: string) => {
    switch (type) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'credit': return 'Credit Card';
      case 'investment': return 'Investment';
      default: return '-';
    }
  };

  const getAccountTypeBadgeClass = () => {
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Account Configuration</h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your financial accounts for importing and exporting transactions
          </p>
        </div>
        <button
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors font-medium text-sm"
          onClick={handleAddAccount}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Account
        </button>
      </div>

      {/* Accounts Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-neutral-500">
            <div className="animate-pulse">Loading accounts...</div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-neutral-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-neutral-600 mb-4">No accounts configured yet.</p>
            <button
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              onClick={handleAddAccount}
            >
              Add your first account
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-600">
                  Institution
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-600">
                  Account
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-600">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-600">
                  Export Display Name
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-neutral-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-900">{account.institutionName}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {account.accountName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeBadgeClass()}`}>
                      {getAccountTypeLabel(account.accountType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {account.exportDisplayName}
                  </td>
                  <td className="px-4 py-3">
                    <TableActions
                      actions={TableActionPresets.crud(
                        () => handleEditAccount(account),
                        () => handleDeleteClick(account)
                      )}
                      className="justify-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Account Form Modal - Rendered via Portal */}
      {showModal && createPortal(
        <AccountFormModal
          account={editingAccount}
          onSave={handleSaveAccount}
          onCancel={handleCancelModal}
        />,
        document.body
      )}

      {/* Delete Confirmation Modal - Rendered via Portal */}
      {deletingAccount && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900 bg-opacity-50 transition-opacity"
            onClick={handleCancelDelete}
          />

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="px-6 py-5">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  {deleteWarning ? 'Cannot Delete Account' : 'Delete Account'}
                </h3>

                {deleteWarning ? (
                  <div>
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm">
                      {deleteWarning}
                    </div>
                    <p className="text-neutral-600 text-sm">
                      Please remove or reassign the associated items before deleting this account.
                    </p>
                  </div>
                ) : (
                  <p className="text-neutral-600">
                    Are you sure you want to delete <span className="font-medium">{deletingAccount.institutionName} - {deletingAccount.accountName}</span>? This action cannot be undone.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                <button
                  className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                  onClick={handleCancelDelete}
                >
                  {deleteWarning ? 'Close' : 'Cancel'}
                </button>
                {!deleteWarning && (
                  <button
                    className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    onClick={handleConfirmDelete}
                  >
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AccountConfiguration;
