import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBanner from '../ErrorBanner';
import FileTable from '../FileTable';
import FileUploader from '../FileUploader';
import ProcessFilesPage from '../ProcessFilesPage';

describe('ErrorBanner', () => {
  it('should render error message', () => {
    render(<ErrorBanner message="Test error message" />);

    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('should render warning emoji', () => {
    render(<ErrorBanner message="Error" />);

    // The emoji is part of the text content
    const banner = screen.getByText(/Error/).closest('div');
    expect(banner?.textContent).toContain('⚠️');
  });

  it('should have correct styling', () => {
    const { container } = render(<ErrorBanner message="Error" />);

    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain('bg-red-100');
    expect(banner.className).toContain('border-l-4');
    expect(banner.className).toContain('border-red-500');
    expect(banner.className).toContain('text-red-700');
  });
});

describe('FileTable', () => {
  const mockRows = [
    { name: 'file1.csv', status: 'Processed' },
    { name: 'file2.csv', status: 'Pending' },
    { name: 'file3.csv', status: 'Error' }
  ];

  it('should render table headers', () => {
    render(<FileTable rows={mockRows} />);

    expect(screen.getByText('Filename')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should render all file rows', () => {
    render(<FileTable rows={mockRows} />);

    expect(screen.getByText('file1.csv')).toBeInTheDocument();
    expect(screen.getByText('file2.csv')).toBeInTheDocument();
    expect(screen.getByText('file3.csv')).toBeInTheDocument();
  });

  it('should render status for each row', () => {
    render(<FileTable rows={mockRows} />);

    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render correct number of rows', () => {
    render(<FileTable rows={mockRows} />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it('should render empty table when no rows', () => {
    render(<FileTable rows={[]} />);

    const rows = screen.getAllByRole('row');
    // Only header row
    expect(rows).toHaveLength(1);
  });

  it('should have correct table styling', () => {
    const { container } = render(<FileTable rows={mockRows} />);

    const table = container.querySelector('table');
    expect(table?.className).toContain('w-full');
    expect(table?.className).toContain('bg-white');
    expect(table?.className).toContain('rounded');
    expect(table?.className).toContain('shadow');
  });

  it('should have hover styling on rows', () => {
    render(<FileTable rows={mockRows} />);

    const dataRows = screen.getAllByRole('row').slice(1); // Skip header
    dataRows.forEach(row => {
      expect(row.className).toContain('hover:bg-gray-100');
    });
  });
});

describe('FileUploader', () => {
  it('should render uploader with title', () => {
    render(<FileUploader onFiles={vi.fn()} />);

    expect(screen.getByText('Upload Your Bank Files')).toBeInTheDocument();
  });

  it('should render instructions', () => {
    render(<FileUploader onFiles={vi.fn()} />);

    expect(screen.getByText(/Drag & drop CSV\/JSON here/)).toBeInTheDocument();
  });

  it('should render file input', () => {
    render(<FileUploader onFiles={vi.fn()} />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('multiple');
  });

  it('should call onFiles when files are dropped', () => {
    const onFiles = vi.fn();
    const { container } = render(<FileUploader onFiles={onFiles} />);

    const file1 = new File(['content1'], 'file1.csv', { type: 'text/csv' });
    const file2 = new File(['content2'], 'file2.csv', { type: 'text/csv' });

    const dropZone = container.firstChild as HTMLElement;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file1, file2] }
    });

    expect(onFiles).toHaveBeenCalledWith([file1, file2]);
  });

  it('should call onFiles when files are selected via input', async () => {
    const onFiles = vi.fn();
    render(<FileUploader onFiles={onFiles} />);

    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('should call onFiles with multiple files from input', async () => {
    const onFiles = vi.fn();
    render(<FileUploader onFiles={onFiles} />);

    const file1 = new File(['content1'], 'file1.csv', { type: 'text/csv' });
    const file2 = new File(['content2'], 'file2.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, [file1, file2]);

    expect(onFiles).toHaveBeenCalledWith([file1, file2]);
  });

  it('should prevent default on drag over', () => {
    const { container } = render(<FileUploader onFiles={vi.fn()} />);

    const dropZone = container.firstChild as HTMLElement;
    const event = new Event('dragover', { bubbles: true, cancelable: true });

    dropZone.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('should have correct container styling', () => {
    const { container } = render(<FileUploader onFiles={vi.fn()} />);

    const uploaderDiv = container.firstChild as HTMLElement;
    expect(uploaderDiv.className).toContain('bg-white');
    expect(uploaderDiv.className).toContain('border-2');
    expect(uploaderDiv.className).toContain('border-dashed');
    expect(uploaderDiv.className).toContain('rounded-lg');
  });
});

describe('ProcessFilesPage', () => {
  it('should render page header', () => {
    const { container } = render(<ProcessFilesPage />);

    // "Process Files" appears multiple times - check header section specifically
    const header = container.querySelector('#header');
    expect(header?.textContent).toContain('Process Files');
    expect(screen.getByText('Upload and process your CSV files')).toBeInTheDocument();
  });

  it('should render upload section', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText(/Drag and drop your CSV file here/)).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
  });

  it('should render file processing configuration', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText(/Process Files \(3 files ready\)/)).toBeInTheDocument();
    expect(screen.getByText('3 files ready for processing')).toBeInTheDocument();
    expect(screen.getByText('Estimated processing time: 2 minutes')).toBeInTheDocument();
  });

  it('should render Process Files button', () => {
    render(<ProcessFilesPage />);

    // There are multiple "Process Files" texts - look for the button
    const buttons = screen.getAllByRole('button');
    const processButton = buttons.find(btn => btn.textContent === 'Process Files');
    expect(processButton).toBeInTheDocument();
  });

  it('should render duplicate warning', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText(/Warning: 2 duplicate files detected/)).toBeInTheDocument();
  });

  it('should render file cards', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText('sales_data.csv')).toBeInTheDocument();
    expect(screen.getByText('q1_transactions.csv')).toBeInTheDocument();
    expect(screen.getByText('q2_sales.csv')).toBeInTheDocument();
  });

  it('should render account dropdowns', () => {
    render(<ProcessFilesPage />);

    const accountLabels = screen.getAllByText('Account');
    expect(accountLabels.length).toBe(3);
  });

  it('should render file type dropdowns', () => {
    render(<ProcessFilesPage />);

    const fileTypeLabels = screen.getAllByText('File Type');
    expect(fileTypeLabels.length).toBe(3);
  });

  it('should render processing status for each file', () => {
    render(<ProcessFilesPage />);

    const statusLabels = screen.getAllByText('Processing Status');
    expect(statusLabels.length).toBe(3);
  });

  it('should render record counts', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText('Records: 1,234')).toBeInTheDocument();
    expect(screen.getByText('Records: 2,456')).toBeInTheDocument();
    expect(screen.getByText('Records: 1,890')).toBeInTheDocument();
  });

  it('should render parsing errors information', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText('3 parsing errors found')).toBeInTheDocument();
    expect(screen.getByText('2 parsing errors found')).toBeInTheDocument();
    expect(screen.getByText('1 parsing error found')).toBeInTheDocument();
  });

  it('should render duplicate records information', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText('5 duplicate records found')).toBeInTheDocument();
    expect(screen.getByText('3 duplicate records found')).toBeInTheDocument();
    expect(screen.getByText('0 duplicate records found')).toBeInTheDocument();
  });

  it('should render processing summary section', () => {
    const { container } = render(<ProcessFilesPage />);

    expect(screen.getByText('Processing Summary')).toBeInTheDocument();
    // Account 1 and Account 2 appear in dropdowns and summary sections
    const summarySection = container.querySelector('#processing-summary');
    expect(summarySection?.textContent).toContain('Account 1');
    expect(summarySection?.textContent).toContain('Account 2');
  });

  it('should render original and processed file sections', () => {
    render(<ProcessFilesPage />);

    const originalLabels = screen.getAllByText('Original Files');
    const processedLabels = screen.getAllByText('Processed Files');
    expect(originalLabels.length).toBe(2);
    expect(processedLabels.length).toBe(2);
  });

  it('should render total records in summary', () => {
    const { container } = render(<ProcessFilesPage />);

    // Check that the processing summary section contains these values
    const summarySection = container.querySelector('#processing-summary');
    expect(summarySection?.textContent).toContain('3,690');
    expect(summarySection?.textContent).toContain('2,345');
  });

  it('should render total amounts in summary', () => {
    const { container } = render(<ProcessFilesPage />);

    // Check that the processing summary section contains these values
    const summarySection = container.querySelector('#processing-summary');
    expect(summarySection?.textContent).toContain('$234,567.00');
    expect(summarySection?.textContent).toContain('$123,456.00');
  });

  it('should render date ranges in summary', () => {
    render(<ProcessFilesPage />);

    // Date ranges appear twice each (original and processed)
    const janDateRanges = screen.getAllByText('Jan 1 - Mar 31, 2025');
    const aprDateRanges = screen.getAllByText('Apr 1 - Jun 30, 2025');
    expect(janDateRanges.length).toBe(2);
    expect(aprDateRanges.length).toBe(2);
  });

  it('should render recent files section', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText('Recent Files')).toBeInTheDocument();
    expect(screen.getByText('march_sales.csv')).toBeInTheDocument();
    expect(screen.getByText('Processed on Apr 26, 2025')).toBeInTheDocument();
  });

  it('should render remove buttons on file cards', () => {
    const { container } = render(<ProcessFilesPage />);

    // X buttons for removing files
    const fileCards = container.querySelectorAll('[class*="bg-white border border-neutral-200 rounded-lg p-4"]');
    expect(fileCards.length).toBeGreaterThan(0);
  });

  it('should render view buttons for parsing errors', () => {
    render(<ProcessFilesPage />);

    const viewButtons = screen.getAllByText('View');
    expect(viewButtons.length).toBe(3);
  });

  it('should render review buttons for duplicates', () => {
    render(<ProcessFilesPage />);

    const reviewButtons = screen.getAllByText('Review');
    expect(reviewButtons.length).toBe(3);
  });

  it('should have correct page structure', () => {
    const { container } = render(<ProcessFilesPage />);

    expect(container.querySelector('#header')).toBeInTheDocument();
    expect(container.querySelector('#upload-section')).toBeInTheDocument();
    expect(container.querySelector('#file-config')).toBeInTheDocument();
    expect(container.querySelector('#processing-summary')).toBeInTheDocument();
    expect(container.querySelector('#recent-files')).toBeInTheDocument();
  });

  it('should have progress bars for each file', () => {
    const { container } = render(<ProcessFilesPage />);

    // Progress bars are nested divs with specific classes
    const progressBars = container.querySelectorAll('.h-2.bg-neutral-700.rounded-full');
    expect(progressBars.length).toBe(3);
  });
});
