import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchAndFilters from '../SearchAndFilters';

describe('SearchAndFilters', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    selectedAccount: 'All Accounts',
    onAccountChange: vi.fn(),
    selectedFileType: 'All File Types',
    onFileTypeChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and calls onSearchChange when typing', async () => {
    const onSearchChange = vi.fn();
    render(<SearchAndFilters {...defaultProps} onSearchChange={onSearchChange} />);

    const input = screen.getByPlaceholderText('Search templates...');
    await userEvent.type(input, 'test');

    expect(onSearchChange).toHaveBeenCalled();
  });

  it('renders account options and calls onAccountChange when selecting', async () => {
    const onAccountChange = vi.fn();
    render(
      <SearchAndFilters
        {...defaultProps}
        accounts={['Chase', 'TD Bank']}
        onAccountChange={onAccountChange}
      />
    );

    expect(screen.getByText('Chase')).toBeInTheDocument();
    expect(screen.getByText('TD Bank')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], 'Chase');

    expect(onAccountChange).toHaveBeenCalledWith('Chase');
  });

  it('renders file type options and calls onFileTypeChange when selecting', async () => {
    const onFileTypeChange = vi.fn();
    render(
      <SearchAndFilters
        {...defaultProps}
        fileTypes={['CSV', 'Excel']}
        onFileTypeChange={onFileTypeChange}
      />
    );

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[1], 'CSV');

    expect(onFileTypeChange).toHaveBeenCalledWith('CSV');
  });

  it('displays selected values', () => {
    render(
      <SearchAndFilters
        {...defaultProps}
        searchTerm="test search"
        accounts={['Chase', 'TD Bank']}
        selectedAccount="TD Bank"
        fileTypes={['CSV', 'Excel']}
        selectedFileType="Excel"
      />
    );

    expect(screen.getByPlaceholderText('Search templates...')).toHaveValue('test search');

    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toHaveValue('TD Bank');
    expect(selects[1]).toHaveValue('Excel');
  });
});
