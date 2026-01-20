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

    const header = container.querySelector('#header');
    expect(header?.textContent).toContain('Process Files');
    expect(screen.getByText('Import and export your bank statements')).toBeInTheDocument();
  });

  it('should render stepper with all 4 steps', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Configure')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should start on Upload step', () => {
    render(<ProcessFilesPage />);

    // Upload step should have drop zone visible
    expect(screen.getByText('Drag and drop your bank CSV files here')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
  });

  it('should not show Back button on first step', () => {
    render(<ProcessFilesPage />);

    // Back button should not be present on step 1
    expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
  });

  it('should have Next button disabled when no files are uploaded', () => {
    render(<ProcessFilesPage />);

    // Next button has the text "Next →"
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeDisabled();
  });

  it('should show helpful message when Next is disabled', () => {
    render(<ProcessFilesPage />);

    expect(screen.getByText(/Upload at least one file to continue/i)).toBeInTheDocument();
  });

  it('should have correct page structure', () => {
    const { container } = render(<ProcessFilesPage />);

    expect(container.querySelector('#header')).toBeInTheDocument();
    // Stepper should be visible
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });
});
