import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountFormModal from '../AccountFormModal';
import { Account } from '../../../models/Settings';

const mockOnSave = vi.fn();
const mockOnCancel = vi.fn();

const mockAccount: Account = {
  id: 'acc_1',
  institutionName: 'TD Bank',
  accountName: 'Checking',
  exportDisplayName: 'TD Bank - Checking',
  accountType: 'checking',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('AccountFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Add Mode', () => {
    it('renders empty form with Add Account title and button', () => {
      render(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('heading', { name: 'Add Account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/institution name/i)).toHaveValue('');
      expect(screen.getByLabelText(/account name/i)).toHaveValue('');
    });

    it('submits valid data and trims whitespace', async () => {
      render(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      await userEvent.type(screen.getByLabelText(/institution name/i), '  TD Bank  ');
      await userEvent.type(screen.getByLabelText(/account name/i), '  Checking  ');
      await userEvent.selectOptions(screen.getByLabelText(/account type/i), 'checking');
      await userEvent.click(screen.getByRole('button', { name: /add account/i }));

      expect(mockOnSave).toHaveBeenCalledWith({
        institutionName: 'TD Bank',
        accountName: 'Checking',
        accountType: 'checking'
      });
    });
  });

  describe('Edit Mode', () => {
    it('populates form with account data and shows Save Changes button', () => {
      render(
        <AccountFormModal account={mockAccount} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Edit Account')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/institution name/i)).toHaveValue('TD Bank');
      expect(screen.getByLabelText(/account name/i)).toHaveValue('Checking');
      expect(screen.getByLabelText(/account type/i)).toHaveValue('checking');
    });

    it('resets form when switching between accounts', () => {
      const { rerender } = render(
        <AccountFormModal account={mockAccount} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/institution name/i)).toHaveValue('TD Bank');

      rerender(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/institution name/i)).toHaveValue('');
    });
  });

  describe('Validation', () => {
    it.each([
      ['institution name', /institution name is required/i],
      ['account name', /account name is required/i],
      ['account type', /account type is required/i]
    ])('shows error when %s is empty', async (_, expectedError) => {
      render(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      await userEvent.click(screen.getByRole('button', { name: /add account/i }));

      expect(screen.getByText(expectedError)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('clears errors after correcting fields and resubmitting', async () => {
      render(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      await userEvent.click(screen.getByRole('button', { name: /add account/i }));
      expect(screen.getByText(/institution name is required/i)).toBeInTheDocument();

      await userEvent.type(screen.getByLabelText(/institution name/i), 'TD Bank');
      await userEvent.type(screen.getByLabelText(/account name/i), 'Checking');
      await userEvent.selectOptions(screen.getByLabelText(/account type/i), 'checking');
      await userEvent.click(screen.getByRole('button', { name: /add account/i }));

      expect(screen.queryByText(/institution name is required/i)).not.toBeInTheDocument();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('Export Display Name Preview', () => {
    it('shows preview when both fields are filled', async () => {
      render(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      await userEvent.type(screen.getByLabelText(/institution name/i), 'Chase');
      await userEvent.type(screen.getByLabelText(/account name/i), 'Savings');

      expect(screen.getByText('Chase - Savings')).toBeInTheDocument();
    });
  });

  describe('Cancel Behavior', () => {
    it('calls onCancel when Cancel button or Escape is pressed', async () => {
      render(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnCancel).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper modal attributes and focuses first input', () => {
      render(
        <AccountFormModal account={null} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByLabelText(/institution name/i)).toHaveFocus();
    });
  });
});
