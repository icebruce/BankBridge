import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import TableActions, { TableActionPresets, TableAction } from '../TableActions';

describe('TableActions', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const basicActions: TableAction[] = [
    { icon: faEdit, label: 'Edit', onClick: mockOnEdit },
    { icon: faTrash, label: 'Delete', onClick: mockOnDelete, variant: 'danger' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders action buttons with labels', () => {
    render(<TableActions actions={basicActions} />);

    expect(screen.getByLabelText('Edit')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('calls onClick when action is clicked', async () => {
    render(<TableActions actions={basicActions} />);

    await userEvent.click(screen.getByLabelText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByLabelText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const disabledActions: TableAction[] = [
      { icon: faEdit, label: 'Edit', onClick: mockOnEdit, disabled: true }
    ];

    render(<TableActions actions={disabledActions} />);

    const button = screen.getByLabelText('Edit');
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });
});

describe('TableActionPresets', () => {
  it('crud creates edit and delete actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const actions = TableActionPresets.crud(onEdit, onDelete);

    expect(actions).toHaveLength(2);
    expect(actions[0].label).toBe('Edit');
    expect(actions[1].label).toBe('Delete');

    actions[0].onClick();
    expect(onEdit).toHaveBeenCalled();

    actions[1].onClick();
    expect(onDelete).toHaveBeenCalled();
  });

  it('crudWithDuplicate creates three actions', () => {
    const onEdit = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();

    const actions = TableActionPresets.crudWithDuplicate(onEdit, onDuplicate, onDelete);

    expect(actions).toHaveLength(3);
    expect(actions.map(a => a.label)).toEqual(['Edit', 'Duplicate', 'Delete']);

    actions[1].onClick();
    expect(onDuplicate).toHaveBeenCalled();
  });

  it('archiveRestore shows archive or restore based on state', () => {
    const onArchive = vi.fn();
    const onRestore = vi.fn();

    const archiveAction = TableActionPresets.archiveRestore(onArchive, onRestore, false);
    expect(archiveAction[0].label).toBe('Archive');
    archiveAction[0].onClick();
    expect(onArchive).toHaveBeenCalled();

    const restoreAction = TableActionPresets.archiveRestore(onArchive, onRestore, true);
    expect(restoreAction[0].label).toBe('Restore');
    restoreAction[0].onClick();
    expect(onRestore).toHaveBeenCalled();
  });
});
