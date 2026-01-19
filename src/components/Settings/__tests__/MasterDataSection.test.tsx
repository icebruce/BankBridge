import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MasterDataSection from '../MasterDataSection';
import * as masterDataService from '../../../services/masterDataService';
import * as fileParserService from '../../../services/fileParserService';
import { MasterDataFile, MasterDataFileInfo, Transaction } from '../../../models/MasterData';

// Mock the services
vi.mock('../../../services/masterDataService');
vi.mock('../../../services/fileParserService');

// Mock window.electronAPI
const mockElectronAPI = {
  masterData: {
    importFile: vi.fn(),
    pickFolder: vi.fn(),
    exportCSV: vi.fn(),
    exportExcel: vi.fn()
  },
  settings: {
    setMasterDataPath: vi.fn()
  }
};

const mockFileInfo: MasterDataFileInfo = {
  exists: true,
  path: '/path/to/master_data.json',
  lastModified: '2023-06-15T10:30:00Z'
};

const mockTransactions: Transaction[] = [
  {
    id: 'txn_1',
    date: '2023-06-01',
    merchant: 'Amazon',
    amount: -50.00,
    institutionName: 'TD Bank',
    accountName: 'Checking',
    category: 'Shopping',
    originalStatement: 'AMAZON PURCHASE',
    notes: '',
    tags: [],
    sourceFile: 'test.csv',
    importedAt: '2023-06-15T10:00:00Z'
  },
  {
    id: 'txn_2',
    date: '2023-06-05',
    merchant: 'Starbucks',
    amount: -5.50,
    institutionName: 'TD Bank',
    accountName: 'Checking',
    category: 'Food & Drink',
    originalStatement: 'STARBUCKS COFFEE',
    notes: 'Morning coffee',
    tags: ['coffee'],
    sourceFile: 'test.csv',
    importedAt: '2023-06-15T10:00:00Z'
  }
];

const mockMasterData: MasterDataFile = {
  version: '1.0.0',
  lastUpdated: '2023-06-15T10:30:00Z',
  metadata: {
    totalTransactions: 2,
    dateRange: { earliest: '2023-06-01', latest: '2023-06-05' },
    accounts: ['TD Bank - Checking']
  },
  transactions: mockTransactions
};

const mockOnSuccess = vi.fn();
const mockOnError = vi.fn();

describe('MasterDataSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).electronAPI = mockElectronAPI;

    // Default mocks
    vi.mocked(masterDataService.getFileInfo).mockResolvedValue(mockFileInfo);
    vi.mocked(masterDataService.loadMasterData).mockResolvedValue(mockMasterData);
  });

  describe('Initial Rendering', () => {
    it('should render the section header and description', async () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText('Master Data')).toBeInTheDocument();
      expect(screen.getByText('Manage your transaction database for processing and export')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText('Loading master data...')).toBeInTheDocument();
    });

    it('should display transactions after loading', async () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Transactions')).toBeInTheDocument();
      });
    });
  });

  describe('Initial Setup Wizard', () => {
    it('should show setup wizard when master data does not exist', async () => {
      vi.mocked(masterDataService.getFileInfo).mockResolvedValue({
        exists: false,
        path: '',
        lastModified: ''
      });

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText(/start fresh/i)).toBeInTheDocument();
        expect(screen.getByText(/import existing/i)).toBeInTheDocument();
      });
    });

    it('should show Start Fresh button in wizard', async () => {
      vi.mocked(masterDataService.getFileInfo).mockResolvedValue({
        exists: false,
        path: '',
        lastModified: ''
      });

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText(/start fresh/i)).toBeInTheDocument();
      });

      // Verify the Start Fresh button exists
      const startFreshButton = screen.getByText(/start fresh/i);
      expect(startFreshButton).toBeInTheDocument();
    });

    it('should show Import Existing button in wizard', async () => {
      vi.mocked(masterDataService.getFileInfo).mockResolvedValue({
        exists: false,
        path: '',
        lastModified: ''
      });

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText(/import existing/i)).toBeInTheDocument();
      });

      // Verify the import button exists and is clickable
      const importButton = screen.getByText(/import existing/i);
      expect(importButton).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no transactions exist', async () => {
      vi.mocked(masterDataService.loadMasterData).mockResolvedValue({
        ...mockMasterData,
        transactions: [],
        metadata: { ...mockMasterData.metadata, totalTransactions: 0 }
      });

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('No transactions in master data')).toBeInTheDocument();
      });
    });
  });

  describe('File Location Section', () => {
    it('should display file path', async () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Master File Location')).toBeInTheDocument();
      });
    });

    it('should display last modified date', async () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Last modified:')).toBeInTheDocument();
      });
    });
  });

  describe('Import Functionality', () => {
    it('should handle CSV file import', async () => {
      mockElectronAPI.masterData.importFile.mockResolvedValue({
        type: 'csv',
        content: 'Date,Merchant,Amount\n2023-06-01,Amazon,-50.00'
      });

      vi.mocked(fileParserService.fileParserService.parseCSVContent).mockReturnValue({
        columns: ['Date', 'Merchant', 'Amount'],
        data: [{ Date: '2023-06-01', Merchant: 'Amazon', Amount: '-50.00' }]
      });

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Import'));

      await waitFor(() => {
        expect(mockElectronAPI.masterData.importFile).toHaveBeenCalled();
      });
    });

    it('should handle cancelled file import', async () => {
      mockElectronAPI.masterData.importFile.mockResolvedValue(null);

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Import'));

      // Should not show error for cancelled import
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should show error when no data found in file', async () => {
      mockElectronAPI.masterData.importFile.mockResolvedValue({
        type: 'csv',
        content: ''
      });

      vi.mocked(fileParserService.fileParserService.parseCSVContent).mockReturnValue({
        columns: [],
        data: []
      });

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Import'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('No data found in file');
      });
    });

    it('should handle import error gracefully', async () => {
      mockElectronAPI.masterData.importFile.mockRejectedValue(new Error('Import failed'));

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Import'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to import file');
      });
    });
  });

  describe('Reload Functionality', () => {
    it('should reload master data when reload is clicked', async () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTitle('Reload master data')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTitle('Reload master data'));

      await waitFor(() => {
        expect(masterDataService.loadMasterData).toHaveBeenCalledTimes(2); // Initial + reload
        expect(mockOnSuccess).toHaveBeenCalledWith('Master data reloaded');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when loading master data fails', async () => {
      vi.mocked(masterDataService.loadMasterData).mockRejectedValue(new Error('Load failed'));

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load master data');
      });
    });

    it('should show error when getFileInfo fails', async () => {
      vi.mocked(masterDataService.getFileInfo).mockRejectedValue(new Error('File info failed'));

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load master data');
      });
    });
  });

  describe('Non-Electron Environment', () => {
    it('should show error when trying to import without electronAPI', async () => {
      (window as any).electronAPI = undefined;

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Import'));

      expect(mockOnError).toHaveBeenCalledWith('This feature is only available in the desktop app');
    });
  });

  describe('Excel File Import', () => {
    it('should handle Excel file import', async () => {
      mockElectronAPI.masterData.importFile.mockResolvedValue({
        type: 'excel',
        data: [
          { Date: '2023-06-01', Merchant: 'Amazon', Amount: -50.00 },
          { Date: '2023-06-05', Merchant: 'Starbucks', Amount: -5.50 }
        ]
      });

      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Import'));

      await waitFor(() => {
        expect(mockElectronAPI.masterData.importFile).toHaveBeenCalled();
      });
    });
  });

  describe('Master Data Table Display', () => {
    it('should show transaction count', async () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Total records: 2')).toBeInTheDocument();
      });
    });

    it('should display transactions in table', async () => {
      render(<MasterDataSection onSuccess={mockOnSuccess} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Amazon')).toBeInTheDocument();
        expect(screen.getByText('Starbucks')).toBeInTheDocument();
      });
    });
  });
});
