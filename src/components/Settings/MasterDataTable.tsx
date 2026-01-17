import { useState, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faSort,
  faSortUp,
  faSortDown,
  faChevronLeft,
  faChevronRight,
  faAnglesLeft,
  faAnglesRight,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import type { Transaction } from '../../models/MasterData';

interface MasterDataTableProps {
  transactions: Transaction[];
  totalTransactions: number;
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

const PAGE_SIZE = 25;

const MasterDataTable: FC<MasterDataTableProps> = ({
  transactions,
  totalTransactions
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

  // Helper to get formatted date for filtering
  const getFormattedDate = useCallback((dateString: string): string => {
    if (!dateString) return '';
    const numericDate = Number(dateString);
    if (!isNaN(numericDate) && numericDate > 30000 && numericDate < 60000) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + numericDate * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    }
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[1]}/${parts[2]}/${parts[0].slice(2)}`;
  }, []);

  // Helper to get formatted amount for filtering
  const getFormattedAmount = useCallback((amount: number): string => {
    const formatted = Math.abs(amount).toFixed(2);
    return amount < 0 ? `-$${formatted}` : `$${formatted}`;
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const formattedDate = getFormattedDate(txn.date);
      const formattedAmount = getFormattedAmount(txn.amount);

      // Global search - matches merchant, originalStatement, notes, category, amount, date
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        const matchesMerchant = txn.merchant.toLowerCase().includes(searchLower);
        const matchesStatement = txn.originalStatement.toLowerCase().includes(searchLower);
        const matchesNotes = txn.notes.toLowerCase().includes(searchLower);
        const matchesCategory = txn.category.toLowerCase().includes(searchLower);
        const matchesInstitution = txn.institutionName.toLowerCase().includes(searchLower);
        const matchesAccount = txn.accountName.toLowerCase().includes(searchLower);
        // Search amount (both raw number and formatted)
        const matchesAmount = txn.amount.toString().includes(searchLower) ||
                             formattedAmount.toLowerCase().includes(searchLower);
        // Search date (both raw and formatted)
        const matchesDate = txn.date.toLowerCase().includes(searchLower) ||
                           formattedDate.toLowerCase().includes(searchLower);

        if (!matchesMerchant && !matchesStatement && !matchesNotes &&
            !matchesCategory && !matchesInstitution && !matchesAccount &&
            !matchesAmount && !matchesDate) {
          return false;
        }
      }

      // Per-column filters
      // Date filter - check both raw format (YYYY-MM-DD) and display format (MM/DD/YY)
      if (columnFilters.date) {
        const filterLower = columnFilters.date.toLowerCase();
        if (!txn.date.includes(filterLower) && !formattedDate.toLowerCase().includes(filterLower)) {
          return false;
        }
      }
      if (columnFilters.merchant && !txn.merchant.toLowerCase().includes(columnFilters.merchant.toLowerCase())) return false;
      // Amount filter - check both raw number and formatted
      if (columnFilters.amount) {
        const filterVal = columnFilters.amount.toLowerCase();
        if (!txn.amount.toString().includes(filterVal) && !formattedAmount.toLowerCase().includes(filterVal)) {
          return false;
        }
      }
      if (columnFilters.institutionName && !txn.institutionName.toLowerCase().includes(columnFilters.institutionName.toLowerCase())) return false;
      if (columnFilters.accountName && !txn.accountName.toLowerCase().includes(columnFilters.accountName.toLowerCase())) return false;
      if (columnFilters.category && !txn.category.toLowerCase().includes(columnFilters.category.toLowerCase())) return false;

      return true;
    });
  }, [transactions, globalSearch, columnFilters, getFormattedDate, getFormattedAmount]);

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

  // Convert Excel serial date to ISO date string
  const excelSerialToDate = (serial: number): string => {
    // Excel uses January 1, 1900 as day 1 (with a bug treating 1900 as a leap year)
    // We need to subtract 1 because Excel starts at 1, not 0
    // Also subtract 1 for the 1900 leap year bug
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';

    // Check if it's an Excel serial date (a number like 45545)
    const numericDate = Number(dateString);
    if (!isNaN(numericDate) && numericDate > 30000 && numericDate < 60000) {
      // Likely an Excel serial date - convert it first
      dateString = excelSerialToDate(numericDate);
    }

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
              className="electronInput pl-9 pr-8 py-2 border border-neutral-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {globalSearch && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
                onClick={() => {
                  setGlobalSearch('');
                  setCurrentPage(1);
                }}
                title="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-sm text-neutral-500">
            Total records: {totalTransactions.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
          <thead>
            {/* Column Headers */}
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {getSortIcon('date')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('merchant')}
              >
                <div className="flex items-center gap-1">
                  Merchant
                  {getSortIcon('merchant')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Amount
                  {getSortIcon('amount')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('institutionName')}
              >
                <div className="flex items-center gap-1">
                  Institution
                  {getSortIcon('institutionName')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('accountName')}
              >
                <div className="flex items-center gap-1">
                  Account
                  {getSortIcon('accountName')}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category
                  {getSortIcon('category')}
                </div>
              </th>
            </tr>

            {/* Filter Row */}
            <tr className="bg-neutral-50/50 border-b border-neutral-200">
              <td className="py-2 px-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="electronInput w-full px-2 pr-7 py-1 text-sm font-normal text-neutral-600 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={columnFilters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                  />
                  {columnFilters.date && (
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
                      onClick={() => handleFilterChange('date', '')}
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="electronInput w-full px-2 pr-7 py-1 text-sm font-normal text-neutral-600 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={columnFilters.merchant}
                    onChange={(e) => handleFilterChange('merchant', e.target.value)}
                  />
                  {columnFilters.merchant && (
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
                      onClick={() => handleFilterChange('merchant', '')}
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="electronInput w-full px-2 pr-7 py-1 text-sm font-normal text-neutral-600 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={columnFilters.amount}
                    onChange={(e) => handleFilterChange('amount', e.target.value)}
                  />
                  {columnFilters.amount && (
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
                      onClick={() => handleFilterChange('amount', '')}
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="electronInput w-full px-2 pr-7 py-1 text-sm font-normal text-neutral-600 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={columnFilters.institutionName}
                    onChange={(e) => handleFilterChange('institutionName', e.target.value)}
                  />
                  {columnFilters.institutionName && (
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
                      onClick={() => handleFilterChange('institutionName', '')}
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="electronInput w-full px-2 pr-7 py-1 text-sm font-normal text-neutral-600 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={columnFilters.accountName}
                    onChange={(e) => handleFilterChange('accountName', e.target.value)}
                  />
                  {columnFilters.accountName && (
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
                      onClick={() => handleFilterChange('accountName', '')}
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="electronInput w-full px-2 pr-7 py-1 text-sm font-normal text-neutral-600 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={columnFilters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  />
                  {columnFilters.category && (
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
                      onClick={() => handleFilterChange('category', '')}
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-200 bg-white">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  No transactions match your filters
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-neutral-600">
                    {formatDate(txn.date)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-neutral-900 max-w-[200px] truncate" title={txn.merchant}>
                    {txn.merchant}
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatAmount(txn.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700 max-w-[150px] truncate" title={txn.institutionName}>
                    {txn.institutionName}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700 max-w-[150px] truncate" title={txn.accountName}>
                    {txn.accountName}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600 max-w-[150px] truncate" title={txn.category || ''}>
                    {txn.category || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-white">
          <span className="text-sm text-neutral-600">
            Showing {showingFrom}-{showingTo} of {sortedTransactions.length.toLocaleString()}
            {sortedTransactions.length !== totalTransactions && (
              <span className="text-neutral-400"> (filtered from {totalTransactions.toLocaleString()})</span>
            )}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First page"
              >
                <FontAwesomeIcon icon={faAnglesLeft} />
              </button>

              {/* Previous page */}
              <button
                className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200"
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
                title="Previous page"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
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
                    className={`w-8 h-8 text-sm rounded-lg border transition-colors duration-200 ${
                      currentPage === pageNum
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next page */}
              <button
                className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>

              {/* Last page */}
              <button
                className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last page"
              >
                <FontAwesomeIcon icon={faAnglesRight} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterDataTable;
