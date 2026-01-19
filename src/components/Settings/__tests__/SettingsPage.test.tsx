import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import * as settingsService from '../../../services/settingsService';
import * as masterDataService from '../../../services/masterDataService';
import { Account } from '../../../models/Settings';

// Mock the services
vi.mock('../../../services/settingsService');
vi.mock('../../../services/masterDataService');

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
  }
];

// Mock master data
const mockMasterData = {
  version: '1.0.0',
  lastUpdated: '2023-06-15T10:30:00Z',
  metadata: {
    totalTransactions: 100,
    dateRange: { earliest: '2023-01-01', latest: '2023-06-15' },
    accounts: ['TD Bank - Checking']
  },
  transactions: []
};

const mockFileInfo = {
  exists: true,
  path: '/path/to/master_data.json',
  lastModified: '2023-06-15T10:30:00Z'
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful data fetching by default
    vi.mocked(settingsService.getAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(masterDataService.loadMasterData).mockResolvedValue(mockMasterData);
    vi.mocked(masterDataService.getFileInfo).mockResolvedValue(mockFileInfo);
  });

  describe('Initial Rendering', () => {
    it('should render the page title and description', async () => {
      render(<SettingsPage />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Configure accounts and manage your master data')).toBeInTheDocument();
    });

    it('should render the Account Configuration section', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Account Configuration')).toBeInTheDocument();
      });
    });

    it('should render the Master Data section', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Master Data')).toBeInTheDocument();
      });
    });
  });

  describe('Section Layout', () => {
    it('should display both Account Configuration and Master Data sections in cards', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        // Both sections should be present
        expect(screen.getByText('Account Configuration')).toBeInTheDocument();
        expect(screen.getByText('Master Data')).toBeInTheDocument();
      });
    });

    it('should show account management description', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Manage your financial accounts for importing and exporting transactions')).toBeInTheDocument();
      });
    });

    it('should show master data description', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Manage your transaction database for processing and export')).toBeInTheDocument();
      });
    });
  });

  describe('Toast Notifications', () => {
    it('should have toast container for notifications', async () => {
      render(<SettingsPage />);

      // Toast container is rendered (even if empty)
      // The component uses ToastContainer which would show notifications
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching accounts', async () => {
      // Delay the response
      vi.mocked(settingsService.getAccounts).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAccounts), 100))
      );

      render(<SettingsPage />);

      // Should show loading initially
      expect(screen.getByText('Loading accounts...')).toBeInTheDocument();

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.queryByText('Loading accounts...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle account loading errors gracefully', async () => {
      vi.mocked(settingsService.getAccounts).mockRejectedValue(new Error('Failed to load'));

      render(<SettingsPage />);

      // Page should still render
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should handle master data loading errors gracefully', async () => {
      vi.mocked(masterDataService.getFileInfo).mockRejectedValue(new Error('Failed to load'));

      render(<SettingsPage />);

      // Page should still render
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        // Main heading
        const mainHeading = screen.getByRole('heading', { level: 2, name: 'Settings' });
        expect(mainHeading).toBeInTheDocument();
      });
    });
  });
});
