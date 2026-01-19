import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportPreviewStep from '../ImportPreviewStep';
import * as masterDataService from '../../../services/masterDataService';
import { CreateTransactionInput, Transaction } from '../../../models/MasterData';

vi.mock('../../../services/masterDataService');

const mockTransactions: CreateTransactionInput[] = [
  {
    date: '2023-06-01',
    merchant: 'Amazon',
    amount: -50.00,
    institutionName: 'TD Bank',
    accountName: 'Checking',
    category: 'Shopping',
    originalStatement: 'AMAZON PURCHASE',
    notes: '',
    tags: [],
    sourceFile: 'test.csv'
  },
  {
    date: '2023-06-05',
    merchant: 'Starbucks',
    amount: -5.50,
    institutionName: 'TD Bank',
    accountName: 'Checking',
    category: 'Food & Drink',
    originalStatement: 'STARBUCKS COFFEE',
    notes: '',
    tags: [],
    sourceFile: 'test.csv'
  },
  {
    date: '2023-06-10',
    merchant: 'Salary',
    amount: 3000.00,
    institutionName: 'TD Bank',
    accountName: 'Checking',
    category: 'Income',
    originalStatement: 'PAYROLL DEPOSIT',
    notes: '',
    tags: [],
    sourceFile: 'test.csv'
  }
];

const mockExistingTransaction: Transaction = {
  id: 'existing_1',
  date: '2023-06-01',
  merchant: 'Amazon',
  amount: -50.00,
  institutionName: 'TD Bank',
  accountName: 'Checking',
  category: 'Shopping',
  originalStatement: 'AMAZON PURCHASE',
  notes: '',
  tags: [],
  sourceFile: 'old.csv',
  importedAt: '2023-06-01T10:00:00Z'
};

const mockOnImport = vi.fn();
const mockOnCancel = vi.fn();
const mockOnBack = vi.fn();

describe('ImportPreviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(masterDataService.findDuplicates).mockResolvedValue(new Map());
  });

  describe('Rendering', () => {
    it('shows loading state while checking duplicates', async () => {
      vi.mocked(masterDataService.findDuplicates).mockReturnValue(new Promise(() => {}));

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Checking for duplicates...')).toBeInTheDocument();
    });

    it('displays transactions with all data columns', async () => {
      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Table headers
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Merchant')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();

        // Transaction data
        expect(screen.getByText('Amazon')).toBeInTheDocument();
        expect(screen.getByText('Starbucks')).toBeInTheDocument();
        expect(screen.getByText('-$50.00')).toBeInTheDocument();
        expect(screen.getByText('$3,000.00')).toBeInTheDocument();
      });
    });

    it('shows summary counts and "No duplicates detected" when none exist', async () => {
      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Total in File')).toBeInTheDocument();
        expect(screen.getByText('Selected for Import')).toBeInTheDocument();
        expect(screen.getByText('No duplicates detected')).toBeInTheDocument();
      });
    });
  });

  describe('Duplicate Detection', () => {
    it('marks duplicates and shows count when duplicates exist', async () => {
      const duplicatesMap = new Map<number, Transaction>();
      duplicatesMap.set(0, mockExistingTransaction);

      vi.mocked(masterDataService.findDuplicates).mockResolvedValue(duplicatesMap);

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
        expect(screen.getByText('2 new, 1 duplicate')).toBeInTheDocument();
      });
    });

    it('deselects duplicates by default and shows "Include duplicates" button', async () => {
      const duplicatesMap = new Map<number, Transaction>();
      duplicatesMap.set(0, mockExistingTransaction);

      vi.mocked(masterDataService.findDuplicates).mockResolvedValue(duplicatesMap);

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Include duplicates')).toBeInTheDocument();
        expect(screen.getByText(/Import 2 Transaction/)).toBeInTheDocument();
      });
    });

    it('shows warning when duplicates are selected', async () => {
      const user = userEvent.setup();
      const duplicatesMap = new Map<number, Transaction>();
      duplicatesMap.set(0, mockExistingTransaction);

      vi.mocked(masterDataService.findDuplicates).mockResolvedValue(duplicatesMap);

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => expect(screen.getByText('Include duplicates')).toBeInTheDocument());
      await user.click(screen.getByText('Include duplicates'));

      await waitFor(() => {
        expect(screen.getByText(/Warning:/)).toBeInTheDocument();
        expect(screen.getByText(/Import 3 Transaction/)).toBeInTheDocument();
      });
    });
  });

  describe('Selection Controls', () => {
    it('toggles individual transaction selection', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => expect(screen.getByText('Amazon')).toBeInTheDocument());

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First transaction checkbox

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Transactions/)).toBeInTheDocument();
      });
    });

    it('select all / deselect all work correctly', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => expect(screen.getByText('Deselect all')).toBeInTheDocument());

      await user.click(screen.getByText('Deselect all'));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Import 0 Transaction/ })).toBeDisabled();
      });

      await user.click(screen.getByText('Select all'));
      await waitFor(() => {
        expect(screen.getByText(/Import 3 Transaction/)).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('calls onBack and onCancel when respective buttons clicked', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => expect(screen.getByText('Back to Mapping')).toBeInTheDocument());

      await user.click(screen.getByText('Back to Mapping'));
      expect(mockOnBack).toHaveBeenCalledOnce();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    it('calls onImport with selected transactions and shows importing state', async () => {
      const user = userEvent.setup();
      mockOnImport.mockImplementation(() => new Promise(() => {}));

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => expect(screen.getByText(/Import 3 Transaction/)).toBeInTheDocument());

      await user.click(screen.getByText(/Import 3 Transaction/));

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(mockTransactions);
        expect(screen.getByText('Importing...')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error when duplicate check fails', async () => {
      vi.mocked(masterDataService.findDuplicates).mockRejectedValue(new Error('Network error'));

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to check for duplicates')).toBeInTheDocument();
      });
    });

    it('shows error when import fails', async () => {
      const user = userEvent.setup();
      mockOnImport.mockRejectedValue(new Error('Import failed'));

      render(
        <ImportPreviewStep
          transactions={mockTransactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => expect(screen.getByText(/Import 3 Transaction/)).toBeInTheDocument());
      await user.click(screen.getByText(/Import 3 Transaction/));

      await waitFor(() => {
        expect(screen.getByText('Failed to import transactions')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing category and partial account info', async () => {
      const transactions: CreateTransactionInput[] = [{
        ...mockTransactions[0],
        category: undefined,
        institutionName: '',
        accountName: 'Checking'
      }];

      render(
        <ImportPreviewStep
          transactions={transactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Checking')).toBeInTheDocument();
        const dashes = screen.getAllByText('-');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });

    it.each([
      [1, 'Transaction'],
      [3, 'Transactions']
    ])('shows correct pluralization for %i item(s)', async (count, expected) => {
      const transactions = mockTransactions.slice(0, count);

      render(
        <ImportPreviewStep
          transactions={transactions}
          onImport={mockOnImport}
          onCancel={mockOnCancel}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Import ${count} ${expected}`))).toBeInTheDocument();
      });
    });
  });
});
