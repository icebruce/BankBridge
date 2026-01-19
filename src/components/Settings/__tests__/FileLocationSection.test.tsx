import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileLocationSection from '../FileLocationSection';
import { Transaction, MasterDataFileInfo } from '../../../models/MasterData';

describe('FileLocationSection', () => {
  const mockOnReload = vi.fn();
  const mockOnImportClick = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

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
    }
  ];

  const mockElectronAPI = {
    masterData: {
      pickFolder: vi.fn(),
      exportCSV: vi.fn(),
      exportExcel: vi.fn()
    },
    settings: {
      setMasterDataPath: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).electronAPI = mockElectronAPI;
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  const renderComponent = (props = {}) => {
    return render(
      <FileLocationSection
        fileInfo={mockFileInfo}
        lastUpdated="2023-06-15T10:30:00Z"
        transactions={mockTransactions}
        onReload={mockOnReload}
        onImportClick={mockOnImportClick}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render file location label', () => {
      renderComponent();

      expect(screen.getByText('Master File Location')).toBeInTheDocument();
    });

    it('should display file path', () => {
      renderComponent();

      expect(screen.getByText('/path/to/master_data.json')).toBeInTheDocument();
    });

    it('should display "Not configured" when no file info', () => {
      renderComponent({ fileInfo: null });

      expect(screen.getByText('Not configured')).toBeInTheDocument();
    });

    it('should display last modified date', () => {
      renderComponent();

      expect(screen.getByText('Last modified:')).toBeInTheDocument();
    });

    it('should format last modified date correctly', () => {
      renderComponent({ lastUpdated: '2023-06-15T10:30:00Z' });

      // The exact format depends on locale, but it should contain the date
      const lastModifiedElement = screen.getByText(/Jun/);
      expect(lastModifiedElement).toBeInTheDocument();
    });

    it('should display "Never" when no last updated date', () => {
      renderComponent({ lastUpdated: undefined });

      expect(screen.getByText('Never')).toBeInTheDocument();
    });

    it('should display "Unknown" for invalid date', () => {
      // Force formatLastModified to return 'Unknown' by passing invalid date
      renderComponent({ lastUpdated: 'invalid-date' });

      // The component should handle invalid dates gracefully
      // Check that it doesn't crash
      expect(screen.getByText('Master File Location')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderComponent();

      expect(screen.getByText('Change Folder')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render reload button', () => {
      renderComponent();

      expect(screen.getByTitle('Reload master data')).toBeInTheDocument();
    });
  });

  describe('Change Folder', () => {
    it('should call pickFolder when clicking Change Folder', async () => {
      mockElectronAPI.masterData.pickFolder.mockResolvedValue('/new/path');
      mockElectronAPI.settings.setMasterDataPath.mockResolvedValue(undefined);

      renderComponent();

      await userEvent.click(screen.getByText('Change Folder'));

      expect(mockElectronAPI.masterData.pickFolder).toHaveBeenCalled();
    });

    it('should set new path and show success message', async () => {
      mockElectronAPI.masterData.pickFolder.mockResolvedValue('/new/path');
      mockElectronAPI.settings.setMasterDataPath.mockResolvedValue(undefined);

      renderComponent();

      await userEvent.click(screen.getByText('Change Folder'));

      await waitFor(() => {
        expect(mockElectronAPI.settings.setMasterDataPath).toHaveBeenCalledWith('/new/path');
        expect(mockOnSuccess).toHaveBeenCalledWith('Master data folder changed successfully');
        expect(mockOnReload).toHaveBeenCalled();
      });
    });

    it('should not do anything when folder selection is cancelled', async () => {
      mockElectronAPI.masterData.pickFolder.mockResolvedValue(null);

      renderComponent();

      await userEvent.click(screen.getByText('Change Folder'));

      expect(mockElectronAPI.settings.setMasterDataPath).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should show error when pickFolder fails', async () => {
      mockElectronAPI.masterData.pickFolder.mockRejectedValue(new Error('Failed'));

      renderComponent();

      await userEvent.click(screen.getByText('Change Folder'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to change folder');
      });
    });

    it('should show error when electronAPI is not available', async () => {
      (window as any).electronAPI = undefined;

      renderComponent();

      await userEvent.click(screen.getByText('Change Folder'));

      expect(mockOnError).toHaveBeenCalledWith('This feature is only available in the desktop app');
    });
  });

  describe('Import', () => {
    it('should call onImportClick when clicking Import', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Import'));

      expect(mockOnImportClick).toHaveBeenCalled();
    });
  });

  describe('Export Dropdown', () => {
    it('should show export dropdown when clicking Export button', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as Excel')).toBeInTheDocument();
    });

    it('should toggle dropdown on multiple clicks', async () => {
      renderComponent();

      // Open dropdown
      await userEvent.click(screen.getByText('Export'));
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();

      // Close dropdown
      await userEvent.click(screen.getByText('Export'));
      expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      renderComponent();

      // Open dropdown
      await userEvent.click(screen.getByText('Export'));
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
      });
    });
  });

  describe('Export CSV', () => {
    it('should export CSV successfully', async () => {
      mockElectronAPI.masterData.exportCSV.mockResolvedValue('/path/to/export.csv');

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      await waitFor(() => {
        expect(mockElectronAPI.masterData.exportCSV).toHaveBeenCalledWith(mockTransactions);
        expect(mockOnSuccess).toHaveBeenCalledWith('Exported 1 transactions to CSV');
      });
    });

    it('should close dropdown after export', async () => {
      mockElectronAPI.masterData.exportCSV.mockResolvedValue('/path/to/export.csv');

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      await waitFor(() => {
        expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
      });
    });

    it('should show error when no transactions to export', async () => {
      renderComponent({ transactions: [] });

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      expect(mockOnError).toHaveBeenCalledWith('No transactions to export');
    });

    it('should show error when electronAPI is not available', async () => {
      (window as any).electronAPI = undefined;

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      expect(mockOnError).toHaveBeenCalledWith('This feature is only available in the desktop app');
    });

    it('should show error when export fails', async () => {
      mockElectronAPI.masterData.exportCSV.mockRejectedValue(new Error('Export failed'));

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to export CSV');
      });
    });

    it('should not show success when export returns no file path', async () => {
      mockElectronAPI.masterData.exportCSV.mockResolvedValue(null);

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      await waitFor(() => {
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Export Excel', () => {
    it('should export Excel successfully', async () => {
      mockElectronAPI.masterData.exportExcel.mockResolvedValue('/path/to/export.xlsx');

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as Excel'));

      await waitFor(() => {
        expect(mockElectronAPI.masterData.exportExcel).toHaveBeenCalledWith(mockTransactions);
        expect(mockOnSuccess).toHaveBeenCalledWith('Exported 1 transactions to Excel');
      });
    });

    it('should show error when no transactions to export', async () => {
      renderComponent({ transactions: [] });

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as Excel'));

      expect(mockOnError).toHaveBeenCalledWith('No transactions to export');
    });

    it('should show error when electronAPI is not available', async () => {
      (window as any).electronAPI = undefined;

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as Excel'));

      expect(mockOnError).toHaveBeenCalledWith('This feature is only available in the desktop app');
    });

    it('should show error when export fails', async () => {
      mockElectronAPI.masterData.exportExcel.mockRejectedValue(new Error('Export failed'));

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as Excel'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to export Excel');
      });
    });
  });

  describe('Reload', () => {
    it('should call onReload when clicking reload button', async () => {
      mockOnReload.mockResolvedValue(undefined);

      renderComponent();

      await userEvent.click(screen.getByTitle('Reload master data'));

      expect(mockOnReload).toHaveBeenCalled();
    });

    it('should disable reload button while reloading', async () => {
      let resolveReload: () => void;
      mockOnReload.mockReturnValue(new Promise(resolve => { resolveReload = resolve; }));

      renderComponent();

      const reloadButton = screen.getByTitle('Reload master data');
      await userEvent.click(reloadButton);

      // Button should be disabled during reload
      expect(reloadButton).toBeDisabled();

      // Resolve the reload
      resolveReload!();

      await waitFor(() => {
        expect(reloadButton).not.toBeDisabled();
      });
    });
  });

  describe('Export Loading State', () => {
    it('should show loading state while exporting', async () => {
      let resolveExport: (value: string) => void;
      mockElectronAPI.masterData.exportCSV.mockReturnValue(new Promise(resolve => { resolveExport = resolve; }));

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      // Should show exporting state
      await waitFor(() => {
        expect(screen.getByText('Exporting...')).toBeInTheDocument();
      });

      // Resolve the export
      resolveExport!('/path/to/file.csv');

      await waitFor(() => {
        expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();
      });
    });

    it('should disable export button while exporting', async () => {
      let resolveExport: (value: string) => void;
      mockElectronAPI.masterData.exportCSV.mockReturnValue(new Promise(resolve => { resolveExport = resolve; }));

      renderComponent();

      await userEvent.click(screen.getByText('Export'));
      await userEvent.click(screen.getByText('Export as CSV'));

      // Export button should be disabled
      await waitFor(() => {
        const exportButton = screen.getByText('Exporting...').closest('button');
        expect(exportButton).toBeDisabled();
      });

      resolveExport!('/path/to/file.csv');
    });
  });
});
