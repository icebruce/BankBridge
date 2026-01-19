import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable, { DataTableColumn } from '../DataTable';

interface TestRow {
  id: string;
  name: string;
  value: number;
  status: string;
}

describe('DataTable', () => {
  const mockColumns: DataTableColumn<TestRow>[] = [
    { key: 'name', header: 'Name' },
    { key: 'value', header: 'Value' },
    { key: 'status', header: 'Status' }
  ];

  const mockData: TestRow[] = [
    { id: '1', name: 'Item 1', value: 100, status: 'Active' },
    { id: '2', name: 'Item 2', value: 200, status: 'Inactive' },
    { id: '3', name: 'Item 3', value: 300, status: 'Active' }
  ];

  it('renders column headers and data rows', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    // Headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Data
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={mockColumns} data={[]} emptyMessage="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable columns={mockColumns} data={mockData} loading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('renders title and header actions', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        title="Items List"
        headerActions={<button>Export</button>}
      />
    );

    expect(screen.getByText('Items List')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        footer={<div>Total: 3 items</div>}
      />
    );

    expect(screen.getByText('Total: 3 items')).toBeInTheDocument();
  });

  it('calls onRowClick with row data and index', async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />
    );

    await userEvent.click(screen.getByText('Item 1'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('uses custom render function with row and index', () => {
    const columnsWithRender: DataTableColumn<TestRow>[] = [
      { key: 'name', header: 'Name' },
      {
        key: 'value',
        header: 'Value',
        render: (value, row, index) => <span data-testid="custom">{`#${index}: ${row.name} = $${value}`}</span>
      }
    ];

    render(<DataTable columns={columnsWithRender} data={mockData} />);

    const custom = screen.getAllByTestId('custom')[0];
    expect(custom).toHaveTextContent('#0: Item 1 = $100');
  });

  it('applies dynamic rowClassName function', () => {
    const rowClassFn = (row: TestRow) => row.status === 'Active' ? 'active-row' : 'inactive-row';

    render(
      <DataTable columns={mockColumns} data={mockData} rowClassName={rowClassFn} />
    );

    const rows = screen.getAllByRole('row').slice(1); // Skip header
    expect(rows[0].className).toContain('active-row');
    expect(rows[1].className).toContain('inactive-row');
  });

  it('applies column width and className', () => {
    const columnsWithWidth: DataTableColumn<TestRow>[] = [
      { key: 'name', header: 'Name', width: '200px', className: 'custom-cell' },
      { key: 'value', header: 'Value' }
    ];

    const { container } = render(
      <DataTable columns={columnsWithWidth} data={mockData} />
    );

    const col = container.querySelector('col');
    expect(col?.style.width).toBe('200px');

    const cells = container.querySelectorAll('td');
    expect(cells[0].className).toContain('custom-cell');
  });
});
