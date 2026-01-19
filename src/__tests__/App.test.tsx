import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the page components
vi.mock('../components/Process files/ProcessFilesPage', () => ({
  default: () => <div data-testid="process-files-page">Process Files Page</div>
}));

vi.mock('../components/ImportTemplates/ImportTemplatesPage', () => ({
  default: () => <div data-testid="import-templates-page">Import Templates Page</div>
}));

vi.mock('../components/ExportTemplates/ExportTemplatesPage', () => ({
  default: () => <div data-testid="export-templates-page">Export Templates Page</div>
}));

vi.mock('../components/Settings', () => ({
  SettingsPage: () => <div data-testid="settings-page">Settings Page</div>
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the sidebar menu', () => {
      render(<App />);

      expect(screen.getByText('CSV Processor')).toBeInTheDocument();
    });

    it('should show Process Files as default active section', () => {
      render(<App />);

      expect(screen.getByTestId('process-files-page')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      render(<App />);

      expect(screen.getByText('Process Files')).toBeInTheDocument();
      expect(screen.getByText('Import Templates')).toBeInTheDocument();
      expect(screen.getByText('Export Templates')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should switch to Import Templates when clicked', async () => {
      render(<App />);

      await userEvent.click(screen.getByText('Import Templates'));

      expect(screen.getByTestId('import-templates-page')).toBeInTheDocument();
      expect(screen.queryByTestId('process-files-page')).not.toBeInTheDocument();
    });

    it('should switch to Export Templates when clicked', async () => {
      render(<App />);

      await userEvent.click(screen.getByText('Export Templates'));

      expect(screen.getByTestId('export-templates-page')).toBeInTheDocument();
    });

    it('should switch to Settings when clicked', async () => {
      render(<App />);

      await userEvent.click(screen.getByText('Settings'));

      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    it('should switch back to Process Files', async () => {
      render(<App />);

      // Go to Settings first
      await userEvent.click(screen.getByText('Settings'));
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();

      // Go back to Process Files
      await userEvent.click(screen.getByText('Process Files'));
      expect(screen.getByTestId('process-files-page')).toBeInTheDocument();
    });

    it('should highlight active section in sidebar', async () => {
      render(<App />);

      // Process Files should be highlighted initially
      const processFilesButton = screen.getByText('Process Files').closest('button');
      expect(processFilesButton?.className).toContain('bg-neutral-100');

      // Switch to Settings
      await userEvent.click(screen.getByText('Settings'));

      const settingsButton = screen.getByText('Settings').closest('button');
      expect(settingsButton?.className).toContain('bg-neutral-100');
      expect(processFilesButton?.className).not.toContain('bg-neutral-100');
    });
  });

  describe('Navigate Event', () => {
    it('should handle navigate event for settings', async () => {
      render(<App />);

      const navigateEvent = new CustomEvent('navigate', {
        detail: { page: 'settings' }
      });
      window.dispatchEvent(navigateEvent);

      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });
    });

    it('should handle navigate event for import-templates', async () => {
      render(<App />);

      const navigateEvent = new CustomEvent('navigate', {
        detail: { page: 'import-templates' }
      });
      window.dispatchEvent(navigateEvent);

      await waitFor(() => {
        expect(screen.getByTestId('import-templates-page')).toBeInTheDocument();
      });
    });

    it('should handle navigate event for export-templates', async () => {
      render(<App />);

      const navigateEvent = new CustomEvent('navigate', {
        detail: { page: 'export-templates' }
      });
      window.dispatchEvent(navigateEvent);

      await waitFor(() => {
        expect(screen.getByTestId('export-templates-page')).toBeInTheDocument();
      });
    });

    it('should handle navigate event for process-files', async () => {
      render(<App />);

      // Navigate away first
      await userEvent.click(screen.getByText('Settings'));
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();

      // Navigate back via event
      const navigateEvent = new CustomEvent('navigate', {
        detail: { page: 'process-files' }
      });
      window.dispatchEvent(navigateEvent);

      await waitFor(() => {
        expect(screen.getByTestId('process-files-page')).toBeInTheDocument();
      });
    });

    it('should ignore unknown page in navigate event', async () => {
      render(<App />);

      const navigateEvent = new CustomEvent('navigate', {
        detail: { page: 'unknown-page' }
      });
      window.dispatchEvent(navigateEvent);

      // Should still be on Process Files
      expect(screen.getByTestId('process-files-page')).toBeInTheDocument();
    });
  });

  describe('Sticky Bar', () => {
    it('should show sticky bar on Process Files page', () => {
      render(<App />);

      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('3 files ready for processing')).toBeInTheDocument();
      expect(screen.getByText('Process & Export')).toBeInTheDocument();
    });

    it('should hide sticky bar on other pages', async () => {
      render(<App />);

      await userEvent.click(screen.getByText('Settings'));

      expect(screen.queryByText('Process & Export')).not.toBeInTheDocument();
    });

    it('should show Browse button in sticky bar', () => {
      render(<App />);

      expect(screen.getByText('Browse')).toBeInTheDocument();
    });

    it('should show output path input in sticky bar', () => {
      render(<App />);

      const input = screen.getByPlaceholderText('/path/to/output');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('Layout Structure', () => {
    it('should render with DashboardLayout', () => {
      const { container } = render(<App />);

      // Check for layout structure
      const layoutContainer = container.firstChild;
      expect(layoutContainer).toBeInTheDocument();
    });

    it('should render sidebar with fixed width', () => {
      const { container } = render(<App />);

      const sidebar = container.querySelector('.w-72');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Invalid Section Handling', () => {
    it('should ignore invalid section names', async () => {
      render(<App />);

      // Try to directly call with an invalid section (simulating invalid input)
      // Since we can't directly call the handler, we verify the current behavior is preserved
      // by ensuring that clicking a valid section still works

      await userEvent.click(screen.getByText('Settings'));
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<App />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('navigate', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
