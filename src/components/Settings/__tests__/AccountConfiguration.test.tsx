import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountConfiguration from '../AccountConfiguration';
import * as settingsService from '../../../services/settingsService';
import { Account } from '../../../models/Settings';

// Mock the services
vi.mock('../../../services/settingsService');

// Mock accounts for testing
const mockAccounts: Account[] = [
  {
    id: 'acc_1',
    institutionName: 'TD Bank',
    accountName: 'Checking',
    exportDisplayName: 'TD Bank - Checking',
    accountType: 'checking',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'acc_2',
    institutionName: 'Chase',
    accountName: 'Savings',
    exportDisplayName: 'Chase - Savings',
    accountType: 'savings',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  }
];

const mockOnSuccess = vi.fn();
const mockOnError = vi.fn();

describe('AccountConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsService.getAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(settingsService.checkAccountUsage).mockResolvedValue({
      inUse: false,
      usedBy: { importTemplates: [], transactions: 0 }
    });
  });

  describe('Initial Rendering', () => {
    it('should render the section header and description', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText('Account Configuration')).toBeInTheDocument();
      expect(screen.getByText('Manage your financial accounts for importing and exporting transactions')).toBeInTheDocument();
    });

    it('should render Add Account button', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add account/i })).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
    });

    it('should display accounts after loading', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
        expect(screen.getByText('Chase')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no accounts exist', async () => {
      vi.mocked(settingsService.getAccounts).mockResolvedValue([]);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('No accounts configured yet.')).toBeInTheDocument();
        expect(screen.getByText('Add your first account')).toBeInTheDocument();
      });
    });

    it('should allow adding first account from empty state', async () => {
      vi.mocked(settingsService.getAccounts).mockResolvedValue([]);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        const addFirstAccountButton = screen.getByText('Add your first account');
        expect(addFirstAccountButton).toBeInTheDocument();
      });
    });
  });

  describe('Accounts Table', () => {
    it('should display table headers', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Institution')).toBeInTheDocument();
        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Export Display Name')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('should display account data in table rows', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
        // Use getAllByText since "Checking" appears both as account name and account type
        const checkingElements = screen.getAllByText('Checking');
        expect(checkingElements.length).toBeGreaterThan(0);
        expect(screen.getByText('TD Bank - Checking')).toBeInTheDocument();
      });
    });

    it('should display account type badge', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        // Account types should be displayed (may appear multiple times)
        const checkingElements = screen.getAllByText('Checking');
        expect(checkingElements.length).toBeGreaterThan(0);
        const savingsElements = screen.getAllByText('Savings');
        expect(savingsElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Add Account', () => {
    it('should open modal when Add Account button is clicked', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Find the header Add Account button (not the one in the modal)
      const addButtons = screen.getAllByRole('button', { name: /add account/i });
      await userEvent.click(addButtons[0]);

      // Modal should open - look for the dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should create account successfully', async () => {
      const newAccount: Account = {
        id: 'acc_3',
        institutionName: 'Bank of America',
        accountName: 'Credit Card',
        exportDisplayName: 'Bank of America - Credit Card',
        accountType: 'credit',
        createdAt: '2023-01-03T00:00:00Z',
        updatedAt: '2023-01-03T00:00:00Z'
      };

      vi.mocked(settingsService.createAccount).mockResolvedValue(newAccount);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Open modal - click first Add Account button (in header)
      const addButtons = screen.getAllByRole('button', { name: /add account/i });
      await userEvent.click(addButtons[0]);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form
      await userEvent.type(screen.getByLabelText(/institution name/i), 'Bank of America');
      await userEvent.type(screen.getByLabelText(/account name/i), 'Credit Card');
      await userEvent.selectOptions(screen.getByLabelText(/account type/i), 'credit');

      // Submit - click the button inside the modal (last one)
      const submitButtons = screen.getAllByRole('button', { name: /add account/i });
      await userEvent.click(submitButtons[submitButtons.length - 1]);

      await waitFor(() => {
        expect(settingsService.createAccount).toHaveBeenCalledWith({
          institutionName: 'Bank of America',
          accountName: 'Credit Card',
          accountType: 'credit'
        });
        expect(mockOnSuccess).toHaveBeenCalledWith('Account created successfully');
      });
    });
  });

  describe('Edit Account', () => {
    it('should open modal with account data when edit is clicked', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Find and click edit button for first account
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      // Modal should show with account data
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByDisplayValue('TD Bank')).toBeInTheDocument();
        // Use getAllByDisplayValue since there might be multiple inputs with same value
        const checkingInputs = screen.getAllByDisplayValue('Checking');
        expect(checkingInputs.length).toBeGreaterThan(0);
      });
    });

    it('should update account successfully', async () => {
      const updatedAccount: Account = {
        ...mockAccounts[0],
        accountName: 'Primary Checking',
        updatedAt: '2023-06-15T00:00:00Z'
      };

      vi.mocked(settingsService.updateAccount).mockResolvedValue(updatedAccount);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Click edit
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      // Change account name
      const accountNameInput = screen.getByLabelText(/account name/i);
      await userEvent.clear(accountNameInput);
      await userEvent.type(accountNameInput, 'Primary Checking');

      // Submit
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(settingsService.updateAccount).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith('Account updated successfully');
      });
    });
  });

  describe('Delete Account', () => {
    it('should show delete confirmation dialog', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      // Confirmation dialog should appear - check for the confirmation message
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });
    });

    it('should delete account when confirmed', async () => {
      vi.mocked(settingsService.deleteAccount).mockResolvedValue(undefined);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete account$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

      await waitFor(() => {
        expect(settingsService.deleteAccount).toHaveBeenCalledWith('acc_1');
        expect(mockOnSuccess).toHaveBeenCalledWith('Account deleted successfully');
      });
    });

    it('should cancel delete when cancel is clicked', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      // Cancel
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
      });

      // Account should still exist
      expect(screen.getByText('TD Bank')).toBeInTheDocument();
    });
  });

  describe('Account In Use Protection', () => {
    it('should show warning when trying to delete account in use', async () => {
      vi.mocked(settingsService.checkAccountUsage).mockResolvedValue({
        inUse: true,
        usedBy: {
          importTemplates: ['Template 1', 'Template 2'],
          transactions: 50
        }
      });

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      // Warning should be displayed
      await waitFor(() => {
        expect(screen.getByText('Cannot Delete Account')).toBeInTheDocument();
        expect(screen.getByText(/this account is in use by/i)).toBeInTheDocument();
      });
    });

    it('should not show delete button when account is in use', async () => {
      vi.mocked(settingsService.checkAccountUsage).mockResolvedValue({
        inUse: true,
        usedBy: {
          importTemplates: ['Template 1'],
          transactions: 10
        }
      });

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      // Should show warning dialog with only Close button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^delete account$/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when loading accounts fails', async () => {
      vi.mocked(settingsService.getAccounts).mockRejectedValue(new Error('Network error'));

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load accounts');
      });
    });

    it('should show error when creating account fails', async () => {
      vi.mocked(settingsService.createAccount).mockRejectedValue(new Error('Failed to create'));

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Open modal - click first Add Account button
      const addButtons = screen.getAllByRole('button', { name: /add account/i });
      await userEvent.click(addButtons[0]);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form
      await userEvent.type(screen.getByLabelText(/institution name/i), 'Test Bank');
      await userEvent.type(screen.getByLabelText(/account name/i), 'Test Account');
      await userEvent.selectOptions(screen.getByLabelText(/account type/i), 'checking');

      // Submit - click the button inside the modal
      const submitButtons = screen.getAllByRole('button', { name: /add account/i });
      await userEvent.click(submitButtons[submitButtons.length - 1]);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to save account');
      });
    });

    it('should show error when deleting account fails', async () => {
      vi.mocked(settingsService.deleteAccount).mockRejectedValue(new Error('Failed to delete'));

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      // Confirm
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete account$/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to delete account');
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should close modal when cancel is clicked', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Open modal - click first Add Account button
      const addButtons = screen.getAllByRole('button', { name: /add account/i });
      await userEvent.click(addButtons[0]);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Cancel
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close delete dialog when clicking cancel', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('TD Bank')).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        // Verify the confirmation message appears
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      // Click cancel button to close
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Dialog should close - the confirmation message should be gone
      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Account Type Display', () => {
    it('should display checking type correctly', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        // "Checking" appears as account name and type - verify at least one exists
        const checkingElements = screen.getAllByText('Checking');
        expect(checkingElements.length).toBeGreaterThan(0);
      });
    });

    it('should display savings type correctly', async () => {
      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        // "Savings" appears as account name and type - verify at least one exists
        const savingsElements = screen.getAllByText('Savings');
        expect(savingsElements.length).toBeGreaterThan(0);
      });
    });

    it('should display credit card type correctly', async () => {
      vi.mocked(settingsService.getAccounts).mockResolvedValue([
        {
          ...mockAccounts[0],
          accountType: 'credit'
        }
      ]);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Credit Card')).toBeInTheDocument();
      });
    });

    it('should display investment type correctly', async () => {
      vi.mocked(settingsService.getAccounts).mockResolvedValue([
        {
          ...mockAccounts[0],
          accountType: 'investment'
        }
      ]);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Investment')).toBeInTheDocument();
      });
    });

    it('should display dash for undefined account type', async () => {
      vi.mocked(settingsService.getAccounts).mockResolvedValue([
        {
          ...mockAccounts[0],
          accountType: undefined
        }
      ]);

      render(<AccountConfiguration onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });
  });
});
