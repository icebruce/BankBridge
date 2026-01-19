import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTemplateEditor from '../NewTemplateEditor';

// Mock DnD kit - these are complex and would require extensive setup
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => [])
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr, from, to) => {
    const newArr = [...arr];
    const [item] = newArr.splice(from, 1);
    newArr.splice(to, 0, item);
    return newArr;
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  })),
  verticalListSortingStrategy: vi.fn()
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => '')
    }
  }
}));

describe('NewTemplateEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with empty template name and description', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByPlaceholderText('Enter template name')).toHaveValue('');
      expect(screen.getByPlaceholderText('Enter description')).toHaveValue('');
    });

    it('should render with default 8 Monarch Money fields', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Check that the default fields are present
      expect(screen.getByText('Field Mapping')).toBeInTheDocument();
      expect(screen.getByText('8 fields configured')).toBeInTheDocument();
    });

    it('should render Add Field button', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('Add Field')).toBeInTheDocument();
    });
  });

  describe('Template Name Input', () => {
    it('should update template name on change', async () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const input = screen.getByPlaceholderText('Enter template name');
      await userEvent.type(input, 'My Template');

      expect(input).toHaveValue('My Template');
    });

    it('should show validation border when touched and empty', async () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const input = screen.getByPlaceholderText('Enter template name');
      fireEvent.blur(input);

      // Check that the input has validation styling
      expect(input.className).toContain('border-l-red-500');
    });
  });

  describe('Description Input', () => {
    it('should update description on change', async () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const input = screen.getByPlaceholderText('Enter description');
      await userEvent.type(input, 'Template description');

      expect(input).toHaveValue('Template description');
    });
  });

  describe('Field Management', () => {
    it('should show all 8 fields are used initially', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // With default 8 fields, all are used - no "(more available)" text
      expect(screen.queryByText(/more available/)).not.toBeInTheDocument();
    });

    it('should allow deleting a field', async () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Find the first delete button and click it
      const deleteButtons = screen.getAllByTitle('Delete');
      await userEvent.click(deleteButtons[0]);

      // Should now show 7 fields
      expect(screen.getByText('7 fields configured')).toBeInTheDocument();
    });

    it('should show fields available after deleting', async () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Delete a field first
      const deleteButtons = screen.getAllByTitle('Delete');
      await userEvent.click(deleteButtons[0]);

      // Add Field button should be enabled now
      const addButton = screen.getByText('Add Field');
      expect(addButton.closest('button')).not.toBeDisabled();

      // Should show 1 more available
      expect(screen.getByText('(1 more available)')).toBeInTheDocument();
    });

    it('should add field after deleting one', async () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Delete a field first
      const deleteButtons = screen.getAllByTitle('Delete');
      await userEvent.click(deleteButtons[0]);

      // Click Add Field
      const addButton = screen.getByText('Add Field');
      await userEvent.click(addButton);

      // Should be back to 8 fields
      expect(screen.getByText('8 fields configured')).toBeInTheDocument();
    });
  });

  describe('Move Field Buttons', () => {
    it('should disable Move Up for first field', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const moveUpButtons = screen.getAllByTitle('Move Up');
      expect(moveUpButtons[0].closest('button')).toBeDisabled();
    });

    it('should disable Move Down for last field', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const moveDownButtons = screen.getAllByTitle('Move Down');
      const lastButton = moveDownButtons[moveDownButtons.length - 1];
      expect(lastButton.closest('button')).toBeDisabled();
    });

    it('should enable Move Down for first field', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const moveDownButtons = screen.getAllByTitle('Move Down');
      expect(moveDownButtons[0].closest('button')).not.toBeDisabled();
    });
  });

  describe('Save Functionality', () => {
    it('should expose save function via saveRef', () => {
      const saveRef = { current: null as (() => void) | null };
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} saveRef={saveRef} />);

      // saveRef should be populated
      expect(saveRef.current).not.toBeNull();
      expect(typeof saveRef.current).toBe('function');
    });

    it('should not call onSave without valid data', async () => {
      const saveRef = { current: null as (() => void) | null };
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} saveRef={saveRef} />);

      // Call save without entering data
      if (saveRef.current) {
        saveRef.current();
      }

      // onSave should not be called since template name is empty
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Editing Existing Template', () => {
    const existingTemplate = {
      id: 'template-1',
      name: 'Existing Template',
      description: 'An existing template',
      fieldMappings: [
        { internalField: 'date', exportField: 'Date', dataType: 'Date' },
        { internalField: 'amount', exportField: 'Amount', dataType: 'Currency' }
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    };

    it('should populate form with existing template data', () => {
      render(
        <NewTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={existingTemplate}
        />
      );

      expect(screen.getByPlaceholderText('Enter template name')).toHaveValue('Existing Template');
      expect(screen.getByPlaceholderText('Enter description')).toHaveValue('An existing template');
    });

    it('should show existing field count', () => {
      render(
        <NewTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={existingTemplate}
        />
      );

      expect(screen.getByText('2 fields configured')).toBeInTheDocument();
    });

    it('should reset form when switching from edit to new', () => {
      const { rerender } = render(
        <NewTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={existingTemplate}
        />
      );

      expect(screen.getByPlaceholderText('Enter template name')).toHaveValue('Existing Template');

      // Re-render without initialTemplate
      rerender(
        <NewTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={null}
        />
      );

      expect(screen.getByPlaceholderText('Enter template name')).toHaveValue('');
    });
  });

  describe('Export Field Input', () => {
    it('should allow editing export field names', async () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Find export field inputs (columns with "Column name in export" placeholder)
      const exportInputs = screen.getAllByPlaceholderText('Column name in export');

      // Change the first one
      await userEvent.clear(exportInputs[0]);
      await userEvent.type(exportInputs[0], 'Custom Date Column');

      expect(exportInputs[0]).toHaveValue('Custom Date Column');
    });

    it('should have export field placeholders', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const exportInputs = screen.getAllByPlaceholderText('Column name in export');
      expect(exportInputs.length).toBe(8); // 8 default fields
    });
  });

  describe('Type Selection', () => {
    it('should render type options for each field', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Each row has a type dropdown with Text/Date/Currency options
      const textOptions = screen.getAllByText('Text');
      expect(textOptions.length).toBeGreaterThan(0);

      const currencyOptions = screen.getAllByText('Currency');
      expect(currencyOptions.length).toBeGreaterThan(0);
    });
  });

  describe('Info Tooltip', () => {
    it('should render Account field with info text about configuration', () => {
      render(<NewTemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Account field (exportDisplayName) should have tooltip text visible (in hover state text)
      expect(screen.getByText(/Account name from Settings/)).toBeInTheDocument();
    });
  });

  describe('Legacy Template Format', () => {
    it('should handle legacy sourceField/targetField format', () => {
      const legacyTemplate = {
        id: 'legacy-1',
        name: 'Legacy Template',
        description: 'Has old format',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Date', dataType: 'Date' },
          { sourceField: 'amount', targetField: 'Amount', dataType: 'Currency' }
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      render(
        <NewTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={legacyTemplate}
        />
      );

      expect(screen.getByPlaceholderText('Enter template name')).toHaveValue('Legacy Template');
      expect(screen.getByText('2 fields configured')).toBeInTheDocument();
    });
  });
});
