import { useState, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faMagnifyingGlass,
  faSort,
  faSortUp,
  faSortDown,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import type { Transaction } from '../../models/MasterData';
import { deleteTransaction } from '../../services/masterDataService';

interface MasterDataTableProps {
  transactions: Transaction[];
  totalTransactions: number;
  onDelete: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type SortField = 'date' | 'merchant' | 'amount' | 'institutionName' | 'accountName' | 'category';
type SortDirection = 'asc' | 'desc';

interface ColumnFilters {
  date: string;
  merchant: string;
  amount: string;
  institutionName: string;
  accountName: string;
  category: string;
}

const PAGE_SIZE = 50;

const MasterDataTable: FC<MasterDataTableProps> = ({
  transactions,
  totalTransactions,
  onDelete,
  onSuccess,
  onError
}) => {
  // Search and filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    date: '',
    merchant: '',
    amount: '',
    institutionName: '',
    accountName: '',
    category: ''
  });

  // Sort state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Delete confirmation state
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Global search - matches merchant, originalStatement, notes, category
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        const matchesMerchant = txn.merchant.toLowerCase().includes(searchLower);
        const matchesStatement = txn.originalStatement.toLowerCase().includes(searchLower);
        const matchesNotes = txn.notes.toLowerCase().includes(searchLower);
        const matchesCategory = txn.category.toLowerCase().includes(searchLower);
        const matchesInstitution = txn.institutionName.toLowerCase().includes(searchLower);
        const matchesAccount = txn.accountName.toLowerCase().includes(searchLower);

        if (!matchesMerchant && !matchesStatement && !matchesNotes &&
            !matchesCategory && !matchesInstitution && !matchesAccount) {
          return false;
        }
      }

      // Per-column filters
      if (columnFilters.date && !txn.date.includes(columnFilters.date)) return false;
      if (columnFilters.merchant && !txn.merchant.toLowerCase().includes(columnFilters.merchant.toLowerCase())) return false;
      if (columnFilters.amount && !txn.amount.toString().includes(columnFilters.amount)) return false;
      if (columnFilters.institutionName && !txn.institutionName.toLowerCase().includes(columnFilters.institutionName.toLowerCase())) return false;
      if (columnFilters.accountName && !txn.accountName.toLowerCase().includes(columnFilters.accountName.toLowerCase())) return false;
      if (columnFilters.category && !txn.category.toLowerCase().includes(columnFilters.category.toLowerCase())) return false;

      return true;
    });
  }, [transactions, globalSearch, columnFilters]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortDirection]);

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedTransactions.slice(start, start + PAGE_SIZE);
  }, [sortedTransactions, currentPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedTransactions.length / PAGE_SIZE);
  const showingFrom = sortedTransactions.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = Math.min(currentPage * PAGE_SIZE, sortedTransactions.length);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  }, [sortField]);

  // Handle column filter change
  const handleFilterChange = useCallback((field: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  // Handle delete
  const handleDeleteClick = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction(deletingTransaction.id);
      onSuccess('Transaction deleted successfully');
      onDelete();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      onError('Failed to delete transaction');
    } finally {
      setDeletingTransaction(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingTransaction(null);
  };

  // Get sort icon for a column
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <FontAwesomeIcon icon={faSort} className="w-3 h-3 text-neutral-300" />;
    }
    return sortDirection === 'asc'
      ? <FontAwesomeIcon icon={faSortUp} className="w-3 h-3 text-neutral-700" />
      : <FontAwesomeIcon icon={faSortDown} className="w-3 h-3 text-neutral-700" />;
  };

  // Format amount with currency
  const formatAmount = (amount: number): string => {
    const formatted = Math.abs(amount).toFixed(2);
    return amount < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[1]}/${parts[2]}/${parts[0].slice(2)}`;
  };

  return (
    <div>
      {/* Header with search and count */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-medium text-neutral-900">Transactions</h4>
        <div className="flex items-center gap-4">
          {/* Global Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search..."
              className="electronInput pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <span className="text-sm text-neutral-500">
            Total: {totalTransactions.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full min-w-[900px]">
          <thead>
            {/* Column Headers */}
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th
                className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {getSortIcon('date')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('merchant')}
              >
                <div className="flex items-center gap-1">
                  Merchant
                  {getSortIcon('merchant')}
                </div>
              </th>
              <th
                className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  Amount
                  {getSortIcon('amount')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('institutionName')}
              >
                <div className="flex items-center gap-1">
                  Institution
                  {getSortIcon('institutionName')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('accountName')}
              >
                <div className="flex items-center gap-1">
                  Account
                  {getSortIcon('accountName')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category
                  {getSortIcon('category')}
                </div>
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-16">
                Actions
              </th>
            </tr>

            {/* Filter Row */}
            <tr className="bg-neutral-50/50 border-b border-neutral-200">
              <th className="py-2 px-4">
                <input
                  type="text"
                  placeholder="Filter..."
                  className="electronInput w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={columnFilters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                />
              </th>
              <th className="py-2 px-4">
                <input
                  type="text"
                  placeholder="Filter..."
                  className="electronInput w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={columnFilters.merchant}
                  onChange={(e) => handleFilterChange('merchant', e.target.value)}
                />
              </th>
              <th className="py-2 px-4">
                <input
                  type="text"
                  placeholder="Filter..."
                  className="electronInput w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                  value={columnFilters.amount}
                  onChange={(e) => handleFilterChange('amount', e.target.value)}
                />
              </th>
              <th className="py-2 px-4">
                <input
                  type="text"
                  placeholder="Filter..."
                  className="electronInput w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={columnFilters.institutionName}
                  onChange={(e) => handleFilterChange('institutionName', e.target.value)}
                />
              </th>
              <th className="py-2 px-4">
                <input
                  type="text"
                  placeholder="Filter..."
                  className="electronInput w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={columnFilters.accountName}
                  onChange={(e) => handleFilterChange('accountName', e.target.value)}
                />
              </th>
              <th className="py-2 px-4">
                <input
                  type="text"
                  placeholder="Filter..."
                  className="electronInput w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={columnFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                />
              </th>
              <th></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-neutral-500">
                  No transactions match your filters
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-neutral-600">
                    {formatDate(txn.date)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                    {txn.merchant}
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatAmount(txn.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700">
                    {txn.institutionName}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700">
                    {txn.accountName}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600">
                    {txn.category || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      onClick={() => handleDeleteClick(txn)}
                      title="Delete transaction"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-neutral-600">
            Showing {showingFrom}-{showingTo} of {sortedTransactions.length.toLocaleString()}
            {sortedTransactions.length !== totalTransactions && (
              <span className="text-neutral-400"> (filtered from {totalTransactions.toLocaleString()})</span>
            )}
          </span>

          <div className="flex items-center gap-1">
            <button
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-1 text-neutral-400">...</span>
                <button
                  className="w-8 h-8 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === totalPages}
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Rendered via Portal */}
      {deletingTransaction && createPortal(
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
                  Delete Transaction
                </h3>
                <p className="text-neutral-600">
                  Are you sure you want to delete this transaction?
                </p>
                <div className="mt-3 p-3 bg-neutral-50 rounded-lg text-sm">
                  <p><span className="font-medium">Date:</span> {formatDate(deletingTransaction.date)}</p>
                  <p><span className="font-medium">Merchant:</span> {deletingTransaction.merchant}</p>
                  <p><span className="font-medium">Amount:</span> {formatAmount(deletingTransaction.amount)}</p>
                </div>
                <p className="text-neutral-500 text-sm mt-3">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                <button
                  className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MasterDataTable;
