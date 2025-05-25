// SearchAndFilters component
import type { FC } from 'react';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAccount: string;
  onAccountChange: (value: string) => void;
  selectedFileType: string;
  onFileTypeChange: (value: string) => void;
}

const SearchAndFilters: FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedAccount,
  onAccountChange,
  selectedFileType,
  onFileTypeChange
}) => {
  const accounts = ['All Accounts', 'Account 1', 'Account 2'];
  const fileTypes = ['All File Types', 'Sales Data', 'Customer Data'];

  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
            fill="currentColor"
          />
        </svg>
      </div>
      
      <select
        value={selectedAccount}
        onChange={(e) => onAccountChange(e.target.value)}
        className="px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-w-[140px]"
      >
        {accounts.map(account => (
          <option key={account} value={account}>{account}</option>
        ))}
      </select>
      
      <select
        value={selectedFileType}
        onChange={(e) => onFileTypeChange(e.target.value)}
        className="px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-w-[140px]"
      >
        {fileTypes.map(fileType => (
          <option key={fileType} value={fileType}>{fileType}</option>
        ))}
      </select>
    </div>
  );
};

export default SearchAndFilters; 