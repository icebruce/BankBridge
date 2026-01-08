import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Account } from '../../models/Settings';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  checkAccountUsage
} from '../../services/settingsService';
import AccountFormModal from './AccountFormModal';

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
    exportDisplayName?: string;
    accountType?: 'checking' | 'savings' | 'credit' | 'investment';
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

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingAccount(null);
  };

  const getAccountTypeLabel = (type?: string) => {
    switch (type) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'credit': return 'Credit';
      case 'investment': return 'Investment';
      default: return '-';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Account Configuration</h3>
        <button
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg flex items-center hover:bg-neutral-800 hover:shadow-sm transition-all duration-200"
          onClick={handleAddAccount}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Account
        </button>
      </div>

      {/* Accounts Table */}
      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-500 mb-4">No accounts configured yet.</p>
          <button
            className="text-blue-600 hover:text-blue-700 font-medium"
            onClick={handleAddAccount}
          >
            Add your first account
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Institution</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Account</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Export Display Name</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Type</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4">{account.institutionName}</td>
                  <td className="py-3 px-4">{account.accountName}</td>
                  <td className="py-3 px-4 text-neutral-600">{account.exportDisplayName}</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-neutral-500">
                      {getAccountTypeLabel(account.accountType)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                      onClick={() => handleEditAccount(account)}
                      title="Edit account"
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </button>
                    <button
                      className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-1"
                      onClick={() => handleDeleteClick(account)}
                      title="Delete account"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Account Form Modal */}
      {showModal && (
        <AccountFormModal
          account={editingAccount}
          onSave={handleSaveAccount}
          onCancel={handleCancelModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {deleteWarning ? 'Cannot Delete Account' : 'Delete Account'}
            </h3>

            {deleteWarning ? (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                  {deleteWarning}
                </div>
                <p className="text-neutral-600 text-sm">
                  Please remove or reassign the associated items before deleting this account.
                </p>
              </div>
            ) : (
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete the account "{deletingAccount.institutionName} - {deletingAccount.accountName}"? This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
                onClick={handleCancelDelete}
              >
                {deleteWarning ? 'Close' : 'Cancel'}
              </button>
              {!deleteWarning && (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountConfiguration;
