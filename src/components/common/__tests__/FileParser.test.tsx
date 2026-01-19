import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileParser from '../FileParser';

const mockParse = vi.fn();
const mockClearError = vi.fn();
let mockProgress: any = null;
let mockIsLoading = false;
let mockError: string | null = null;

vi.mock('../../../ui/hooks/useParseFile', () => ({
  useParseFile: () => ({
    parse: mockParse,
    progress: mockProgress,
    isLoading: mockIsLoading,
    error: mockError,
    clearError: mockClearError
  })
}));

describe('FileParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgress = null;
    mockIsLoading = false;
    mockError = null;
    mockParse.mockResolvedValue({
      success: true,
      data: [],
      errors: [],
      warnings: [],
      stats: { totalRows: 10, validRows: 10, rejectedRows: 0, processingTime: 1000 }
    });
  });

  describe('Basic Rendering', () => {
    it('renders with title, description and disabled parse button', () => {
      render(<FileParser title="Custom Parser" description="Custom description" />);

      expect(screen.getByText('Custom Parser')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
      expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Parse File/i })).toBeDisabled();
    });
  });

  describe('File Selection', () => {
    it('selects file via input and enables parse button', async () => {
      const onFileSelected = vi.fn();
      render(<FileParser onFileSelected={onFileSelected} />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(onFileSelected).toHaveBeenCalledWith(file);
      expect(screen.getByRole('button', { name: /Parse File/i })).not.toBeDisabled();
    });

    it('handles file drop', async () => {
      const onFileSelected = vi.fn();
      const { container } = render(<FileParser onFileSelected={onFileSelected} />);

      const file = new File(['content'], 'dropped.csv', { type: 'text/csv' });
      const dropZone = container.querySelector('.border-dashed') as HTMLElement;

      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      expect(screen.getByText('dropped.csv')).toBeInTheDocument();
      expect(onFileSelected).toHaveBeenCalledWith(file);
    });
  });

  describe('File Validation', () => {
    it('rejects files exceeding max size', async () => {
      const onParseError = vi.fn();
      render(<FileParser maxFileSizeMB={1} onParseError={onParseError} />);

      const largeContent = 'a'.repeat(2 * 1024 * 1024);
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(onParseError).toHaveBeenCalledWith('File size exceeds 1MB limit');
    });

    it('rejects unsupported file types', async () => {
      const onParseError = vi.fn();
      const { container } = render(<FileParser acceptedTypes=".csv" onParseError={onParseError} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const dropZone = container.querySelector('.border-dashed') as HTMLElement;

      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      expect(onParseError).toHaveBeenCalledWith('File type not supported. Allowed types: .csv');
    });
  });

  describe('Parsing', () => {
    it('calls onParseComplete on success', async () => {
      const onParseComplete = vi.fn();
      const successResult = {
        success: true,
        data: [{ col: 'value' }],
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, rejectedRows: 0, processingTime: 500 }
      };
      mockParse.mockResolvedValue(successResult);

      render(<FileParser onParseComplete={onParseComplete} />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
      await userEvent.click(screen.getByRole('button', { name: /Parse File/i }));

      await waitFor(() => {
        expect(onParseComplete).toHaveBeenCalledWith(successResult);
      });
    });

    it.each([
      ['failure result', { success: false, errors: [{ message: 'Invalid format' }] }, 'Invalid format'],
      ['thrown error', new Error('Network error'), 'Network error'],
      ['unknown error', 'string error', 'Unknown error occurred']
    ])('calls onParseError on %s', async (_, mockValue, expectedError) => {
      const onParseError = vi.fn();
      if (mockValue instanceof Error || typeof mockValue === 'string') {
        mockParse.mockRejectedValue(mockValue);
      } else {
        mockParse.mockResolvedValue({ ...mockValue, data: [], warnings: [], stats: {} });
      }

      render(<FileParser onParseError={onParseError} />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
      await userEvent.click(screen.getByRole('button', { name: /Parse File/i }));

      await waitFor(() => {
        expect(onParseError).toHaveBeenCalledWith(expectedError);
      });
    });
  });

  describe('Progress Display', () => {
    it('shows progress bar when loading', () => {
      mockIsLoading = true;
      mockProgress = { phase: 'reading', processed: 50, total: 100 };

      render(<FileParser />);

      expect(screen.getByText('Reading...')).toBeInTheDocument();
      expect(screen.getByText('50 / 100')).toBeInTheDocument();
    });

    it('shows progress details when enabled', () => {
      mockIsLoading = true;
      mockProgress = {
        phase: 'transforming',
        processed: 75,
        total: 100,
        currentFile: 'test.csv',
        estimatedTimeRemaining: 5000
      };

      render(<FileParser showProgressDetails={true} />);

      expect(screen.getByText('Phase: transforming')).toBeInTheDocument();
      expect(screen.getByText('File: test.csv')).toBeInTheDocument();
      expect(screen.getByText('ETA: 5s')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('shows error message and clears on dismiss', async () => {
      mockError = 'Something went wrong';

      render(<FileParser />);

      expect(screen.getByText('Parsing Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const errorContainer = screen.getByText('Something went wrong').closest('.bg-red-50');
      await userEvent.click(errorContainer?.querySelector('button')!);

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Results Display', () => {
    it('displays successful parse results', async () => {
      mockParse.mockResolvedValue({
        success: true,
        data: [],
        errors: [],
        warnings: [],
        stats: { totalRows: 100, validRows: 100, rejectedRows: 0, processingTime: 2500 }
      });

      render(<FileParser />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
      await userEvent.click(screen.getByRole('button', { name: /Parse File/i }));

      await waitFor(() => {
        expect(screen.getByText('Parsing Completed')).toBeInTheDocument();
        expect(screen.getByText('Total Rows: 100')).toBeInTheDocument();
        expect(screen.getByText('Processing Time: 2.50s')).toBeInTheDocument();
      });
    });

    it('shows download button when reject file exists', async () => {
      mockParse.mockResolvedValue({
        success: true,
        data: [],
        errors: [],
        warnings: [],
        stats: { totalRows: 100, validRows: 90, rejectedRows: 10, processingTime: 1000 },
        rejectFile: '/path/to/rejects.csv'
      });

      render(<FileParser />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
      await userEvent.click(screen.getByRole('button', { name: /Parse File/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Download Reject File/i })).toBeInTheDocument();
      });
    });
  });

  describe('Clear Functionality', () => {
    it('clears selected file and results', async () => {
      mockParse.mockResolvedValue({
        success: true,
        data: [],
        errors: [],
        warnings: [],
        stats: { totalRows: 10, validRows: 10, rejectedRows: 0, processingTime: 500 }
      });

      render(<FileParser />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
      await userEvent.click(screen.getByRole('button', { name: /Parse File/i }));

      await waitFor(() => expect(screen.getByText('Parsing Completed')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /Clear/i }));

      expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
      expect(screen.queryByText('Parsing Completed')).not.toBeInTheDocument();
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Advanced Options', () => {
    it('shows options when enabled and passes to parse', async () => {
      render(<FileParser showAdvancedOptions={true} />);

      expect(screen.getByText('Advanced Options')).toBeInTheDocument();

      const maxRowsInput = screen.getByPlaceholderText('Unlimited');
      await userEvent.type(maxRowsInput, '500');

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
      await userEvent.click(screen.getByRole('button', { name: /Parse File/i }));

      expect(mockParse).toHaveBeenCalledWith('test.csv', expect.objectContaining({
        maxRows: 500,
        enableGarbageCollection: true
      }));
    });
  });

  describe('Disabled State', () => {
    it('disables file input and parse button', () => {
      render(<FileParser disabled />);

      expect(document.querySelector('input[type="file"]')).toBeDisabled();
      expect(screen.getByRole('button', { name: /Parse File/i })).toBeDisabled();
    });

    it('does not accept dropped files', () => {
      const onFileSelected = vi.fn();
      const { container } = render(<FileParser disabled onFileSelected={onFileSelected} />);

      const file = new File(['content'], 'dropped.csv', { type: 'text/csv' });
      fireEvent.drop(container.querySelector('.border-dashed')!, { dataTransfer: { files: [file] } });

      expect(onFileSelected).not.toHaveBeenCalled();
    });
  });
});
