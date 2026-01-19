import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InitialSetupWizard from '../InitialSetupWizard';

describe('InitialSetupWizard', () => {
  const mockOnStartFresh = vi.fn();
  const mockOnImportExisting = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnStartFresh.mockResolvedValue(undefined);
  });

  const renderComponent = () => {
    return render(
      <InitialSetupWizard
        onStartFresh={mockOnStartFresh}
        onImportExisting={mockOnImportExisting}
      />
    );
  };

  describe('Rendering', () => {
    it('should render welcome header', () => {
      renderComponent();

      expect(screen.getByText('Welcome to Master Data')).toBeInTheDocument();
      expect(screen.getByText(/No master data file found/)).toBeInTheDocument();
    });

    it('should render Start Fresh option', () => {
      renderComponent();

      expect(screen.getByText('Start Fresh')).toBeInTheDocument();
      expect(screen.getByText('Begin with an empty master data file')).toBeInTheDocument();
    });

    it('should render Import Existing option', () => {
      renderComponent();

      expect(screen.getByText('Import Existing Data')).toBeInTheDocument();
      expect(screen.getByText('Import transactions from a CSV or Excel file')).toBeInTheDocument();
    });

    it('should render Continue button', () => {
      renderComponent();

      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should have Continue button disabled initially', () => {
      renderComponent();

      const continueButton = screen.getByText('Continue').closest('button');
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Option Selection', () => {
    it('should select Start Fresh option when clicked', async () => {
      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);

      // Button should have selected styling
      expect(startFreshButton?.className).toContain('border-blue-500');
      expect(startFreshButton?.className).toContain('bg-blue-50');
    });

    it('should select Import Existing option when clicked', async () => {
      renderComponent();

      const importButton = screen.getByText('Import Existing Data').closest('button');
      await userEvent.click(importButton!);

      // Button should have selected styling
      expect(importButton?.className).toContain('border-blue-500');
      expect(importButton?.className).toContain('bg-blue-50');
    });

    it('should enable Continue button after selection', async () => {
      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);

      const continueButton = screen.getByText('Continue').closest('button');
      expect(continueButton).not.toBeDisabled();
    });

    it('should switch selection between options', async () => {
      renderComponent();

      // Select Start Fresh
      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);
      expect(startFreshButton?.className).toContain('border-blue-500');

      // Select Import Existing
      const importButton = screen.getByText('Import Existing Data').closest('button');
      await userEvent.click(importButton!);
      expect(importButton?.className).toContain('border-blue-500');
      expect(startFreshButton?.className).not.toContain('border-blue-500');
    });
  });

  describe('Continue Action', () => {
    it('should call onStartFresh when Start Fresh is selected and Continue clicked', async () => {
      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);

      const continueButton = screen.getByText('Continue').closest('button');
      await userEvent.click(continueButton!);

      expect(mockOnStartFresh).toHaveBeenCalled();
    });

    it('should call onImportExisting when Import is selected and Continue clicked', async () => {
      renderComponent();

      const importButton = screen.getByText('Import Existing Data').closest('button');
      await userEvent.click(importButton!);

      const continueButton = screen.getByText('Continue').closest('button');
      await userEvent.click(continueButton!);

      expect(mockOnImportExisting).toHaveBeenCalled();
    });

    it('should not call any callback when Continue clicked without selection', async () => {
      renderComponent();

      // Try to click Continue without selection (should be disabled)
      const continueButton = screen.getByText('Continue').closest('button');

      // Button is disabled, so click won't fire
      expect(continueButton).toBeDisabled();
      expect(mockOnStartFresh).not.toHaveBeenCalled();
      expect(mockOnImportExisting).not.toHaveBeenCalled();
    });
  });

  describe('Processing State', () => {
    it('should show processing state while Start Fresh is executing', async () => {
      let resolveStartFresh: () => void;
      mockOnStartFresh.mockReturnValue(new Promise(resolve => { resolveStartFresh = resolve; }));

      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);

      const continueButton = screen.getByText('Continue').closest('button');
      await userEvent.click(continueButton!);

      // Should show processing state
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(continueButton).toBeDisabled();

      // Resolve and verify state returns to normal
      resolveStartFresh!();

      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });
    });

    it('should disable Continue button while processing', async () => {
      let resolveStartFresh: () => void;
      mockOnStartFresh.mockReturnValue(new Promise(resolve => { resolveStartFresh = resolve; }));

      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);

      const continueButton = screen.getByText('Continue').closest('button');
      await userEvent.click(continueButton!);

      expect(continueButton).toBeDisabled();

      resolveStartFresh!();
    });

    it('should reset processing state after completion', async () => {
      renderComponent();

      const importButton = screen.getByText('Import Existing Data').closest('button');
      await userEvent.click(importButton!);

      const continueButton = screen.getByText('Continue').closest('button');
      await userEvent.click(continueButton!);

      // For import, it's synchronous so processing state should be reset immediately
      await waitFor(() => {
        expect(screen.getByText('Continue')).toBeInTheDocument();
      });
    });
  });

  describe('Radio Button Indicators', () => {
    it('should show selected indicator for Start Fresh when selected', async () => {
      const { container } = renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);

      // Check for the inner filled circle
      const filledCircle = startFreshButton?.querySelector('.bg-blue-500.rounded-full');
      expect(filledCircle).toBeInTheDocument();
    });

    it('should show selected indicator for Import when selected', async () => {
      renderComponent();

      const importButton = screen.getByText('Import Existing Data').closest('button');
      await userEvent.click(importButton!);

      // Check for the inner filled circle
      const filledCircle = importButton?.querySelector('.bg-blue-500.rounded-full');
      expect(filledCircle).toBeInTheDocument();
    });

    it('should not show selected indicator when not selected', () => {
      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      const importButton = screen.getByText('Import Existing Data').closest('button');

      // Neither should have the filled indicator initially
      const startFreshCircle = startFreshButton?.querySelector('.bg-blue-500.rounded-full.w-2\\.5');
      const importCircle = importButton?.querySelector('.bg-blue-500.rounded-full.w-2\\.5');

      expect(startFreshCircle).not.toBeInTheDocument();
      expect(importCircle).not.toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('should have correct styling for disabled Continue button', () => {
      renderComponent();

      const continueButton = screen.getByText('Continue').closest('button');
      expect(continueButton?.className).toContain('bg-neutral-200');
      expect(continueButton?.className).toContain('text-neutral-400');
      expect(continueButton?.className).toContain('cursor-not-allowed');
    });

    it('should have correct styling for enabled Continue button', async () => {
      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      await userEvent.click(startFreshButton!);

      const continueButton = screen.getByText('Continue').closest('button');
      expect(continueButton?.className).toContain('bg-neutral-900');
      expect(continueButton?.className).toContain('text-white');
    });

    it('should have hover styling on unselected option', () => {
      renderComponent();

      const startFreshButton = screen.getByText('Start Fresh').closest('button');
      expect(startFreshButton?.className).toContain('hover:border-neutral-300');
    });
  });
});
