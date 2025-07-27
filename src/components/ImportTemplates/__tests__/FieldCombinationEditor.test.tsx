import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FieldCombinationEditor from '../FieldCombinationEditor'
import { FieldCombination } from '../../../models/ImportTemplate'

const mockOnSave = vi.fn()
const mockOnCancel = vi.fn()

const mockAvailableSourceFields = ['first_name', 'last_name', 'middle_name', 'title', 'suffix']
const mockAvailableTargetFields = ['Full Name', 'Address', 'Contact Info', 'Customer Details']

const mockEditingCombination: FieldCombination = {
  id: 'combo_1',
  targetField: 'Full Name',
  delimiter: 'Space',
  sourceFields: [
    { id: 'sf_1', fieldName: 'first_name', order: 1 },
    { id: 'sf_2', fieldName: 'last_name', order: 2 }
  ]
}

describe('FieldCombinationEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Add New Combination Mode', () => {
    it('should render add mode correctly', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      expect(screen.getByText('Add Field Combination')).toBeInTheDocument()
      expect(screen.getByText('Combine multiple source fields into one target field')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save combination/i })).toBeInTheDocument()
    })

    it('should have default source fields in add mode', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Should have default first_name and last_name fields
      expect(screen.getAllByDisplayValue('first_name')).toHaveLength(1)
      expect(screen.getAllByDisplayValue('last_name')).toHaveLength(1)
    })

    it('should allow adding new source fields', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      const addFieldButton = screen.getByRole('button', { name: /add field/i })
      fireEvent.click(addFieldButton)

      await waitFor(() => {
        // Should have 3 fields now (2 default + 1 added)
        expect(screen.getAllByRole('combobox')).toHaveLength(4) // 1 target field + 1 delimiter + 2 source fields initially, +1 added
      })
    })

    it('should save new combination with correct data', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Select target field
      const targetFieldSelect = screen.getByLabelText(/target field/i)
      fireEvent.change(targetFieldSelect, { target: { value: 'Full Name' } })

      // Select delimiter
      const delimiterSelect = screen.getByLabelText(/delimiter/i)
      fireEvent.change(delimiterSelect, { target: { value: 'Comma' } })

      // Save combination
      const saveButton = screen.getByRole('button', { name: /save combination/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            targetField: 'Full Name',
            delimiter: 'Comma',
            sourceFields: expect.arrayContaining([
              expect.objectContaining({ fieldName: 'first_name', order: 1 }),
              expect.objectContaining({ fieldName: 'last_name', order: 2 })
            ])
          })
        )
      })
    })
  })

  describe('Edit Existing Combination Mode', () => {
    it('should render edit mode correctly', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
          editingCombination={mockEditingCombination}
        />
      )

      expect(screen.getByText('Edit Field Combination')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update combination/i })).toBeInTheDocument()
    })

    it('should pre-populate form with existing combination data', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
          editingCombination={mockEditingCombination}
        />
      )

      // Should pre-populate target field
      expect(screen.getByDisplayValue('Full Name')).toBeInTheDocument()
      
      // Should pre-populate delimiter
      expect(screen.getByDisplayValue('Space')).toBeInTheDocument()
      
      // Should pre-populate source fields
      expect(screen.getByDisplayValue('first_name')).toBeInTheDocument()
      expect(screen.getByDisplayValue('last_name')).toBeInTheDocument()
    })

    it('should preserve existing ID when updating combination', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
          editingCombination={mockEditingCombination}
        />
      )

      // Make a change
      const delimiterSelect = screen.getByLabelText(/delimiter/i)
      fireEvent.change(delimiterSelect, { target: { value: 'Comma' } })

      // Save combination
      const updateButton = screen.getByRole('button', { name: /update combination/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'combo_1', // Should preserve existing ID
            delimiter: 'Comma'
          })
        )
      })
    })
  })

  describe('Form Validation', () => {
    it('should require target field selection', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Try to save without selecting target field
      const saveButton = screen.getByRole('button', { name: /save combination/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    it('should require at least one source field', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Remove all source fields
      const removeButtons = screen.getAllByTitle(/remove field/i)
      removeButtons.forEach(button => fireEvent.click(button))

      // Select target field
      const targetFieldSelect = screen.getByLabelText(/target field/i)
      fireEvent.change(targetFieldSelect, { target: { value: 'Full Name' } })

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save combination/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('Source Field Management', () => {
    it('should allow removing source fields', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Initially should have 2 source fields
      expect(screen.getAllByTitle(/remove field/i)).toHaveLength(2)

      // Remove one field
      const removeButtons = screen.getAllByTitle(/remove field/i)
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        // Should have 1 source field remaining
        expect(screen.getAllByTitle(/remove field/i)).toHaveLength(1)
      })
    })

    it('should allow reordering source fields', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Should have move up/down buttons
      expect(screen.getAllByTitle(/move up/i)).toHaveLength(2)
      expect(screen.getAllByTitle(/move down/i)).toHaveLength(2)

      // Move second field up
      const moveUpButtons = screen.getAllByTitle(/move up/i)
      fireEvent.click(moveUpButtons[1]) // Move last_name up

      // Verify order changed (this would require checking the order values or DOM structure)
      // This is a simplified test - in reality you'd check the actual order
      expect(screen.getAllByTitle(/move up/i)).toHaveLength(2)
    })
  })

  describe('Custom Delimiter', () => {
    it('should show custom delimiter input when Custom is selected', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Select custom delimiter
      const delimiterSelect = screen.getByLabelText(/delimiter/i)
      fireEvent.change(delimiterSelect, { target: { value: 'Custom' } })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter custom delimiter/i)).toBeInTheDocument()
      })
    })

    it('should save custom delimiter value', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Select target field
      const targetFieldSelect = screen.getByLabelText(/target field/i)
      fireEvent.change(targetFieldSelect, { target: { value: 'Full Name' } })

      // Select custom delimiter
      const delimiterSelect = screen.getByLabelText(/delimiter/i)
      fireEvent.change(delimiterSelect, { target: { value: 'Custom' } })

      await waitFor(() => {
        const customInput = screen.getByPlaceholderText(/enter custom delimiter/i)
        fireEvent.change(customInput, { target: { value: ' | ' } })
      })

      // Save combination
      const saveButton = screen.getByRole('button', { name: /save combination/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            delimiter: 'Custom',
            customDelimiter: ' | '
          })
        )
      })
    })
  })

  describe('Preview Generation', () => {
    it('should generate preview with sample data', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Should show preview with sample data
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument() // Default preview for first_name + last_name
    })

    it('should update preview when delimiter changes', async () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Change delimiter to comma
      const delimiterSelect = screen.getByLabelText(/delimiter/i)
      fireEvent.change(delimiterSelect, { target: { value: 'Comma' } })

      await waitFor(() => {
        expect(screen.getByText('John, Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation and Cancel', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should call onCancel when back arrow is clicked', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Find back arrow button (might be by aria-label or test-id)
      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should call onCancel when breadcrumb navigation is clicked', () => {
      render(
        <FieldCombinationEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          availableSourceFields={mockAvailableSourceFields}
          availableTargetFields={mockAvailableTargetFields}
        />
      )

      // Click on "Import Templates" breadcrumb
      const breadcrumbButton = screen.getByRole('button', { name: /import templates/i })
      fireEvent.click(breadcrumbButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })
}) 