import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import NewImportTemplateEditor from '../NewImportTemplateEditor'
import { ImportTemplate, FieldCombination } from '../../../models/ImportTemplate'
import { Template } from '../../../models/Template'
import { fileParserService } from '../../../services/fileParserService'

// Mock the file parser service
vi.mock('../../../services/fileParserService')

const mockOnSave = vi.fn()
const mockOnCancel = vi.fn()
const mockOnAddFieldCombination = vi.fn()
const mockSaveRef = { current: null }

const mockDefaultExportTemplate: Template = {
  id: 'export_template_1',
  name: 'Default Export Template',
  description: 'Default template for export',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  schemaVersion: '1.0.0',
  isDefault: true,
  fieldMappings: [
    { sourceField: 'full_name', targetField: 'Full Name' },
    { sourceField: 'email', targetField: 'Email Address' },
    { sourceField: 'phone', targetField: 'Phone Number' }
  ]
}

const mockInitialTemplate: ImportTemplate = {
  id: 'import_template_1',
  name: 'Test Import Template',
  description: 'Test description',
  fileType: 'CSV File',
  fieldCount: 2,
  account: 'Default Account',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  schemaVersion: '1.0.0',
  status: 'Active',
  fieldMappings: [
    { sourceField: 'first_name', targetField: 'Full Name', dataType: 'Text', required: false, validation: '' },
    { sourceField: 'email', targetField: 'Email Address', dataType: 'Text', required: false, validation: '' }
  ],
  fieldCombinations: [
    {
      id: 'combo_1',
      targetField: 'Full Name',
      delimiter: 'Space',
      sourceFields: [
        { id: 'sf_1', fieldName: 'first_name', order: 1 },
        { id: 'sf_2', fieldName: 'last_name', order: 2 }
      ]
    }
  ]
}

const mockCurrentTemplateData = {
  name: 'Updated Template',
  sourceFileType: 'JSON File',
  fields: [
    { id: '1', sourceField: 'name', dataType: 'Text', sampleData: 'John Doe', targetField: 'Full Name', actions: '' }
  ],
  fieldCombinations: [
    {
      id: 'combo_2',
      targetField: 'Contact Info',
      delimiter: 'Comma',
      sourceFields: [
        { id: 'sf_3', fieldName: 'email', order: 1 },
        { id: 'sf_4', fieldName: 'phone', order: 2 }
      ]
    }
  ]
}

describe('NewImportTemplateEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock file parser service
    vi.mocked(fileParserService.parseFile).mockResolvedValue({
      success: true,
      fields: [
        { name: 'first_name', dataType: 'Text', sampleValue: 'John', confidence: 0.9 },
        { name: 'last_name', dataType: 'Text', sampleValue: 'Doe', confidence: 0.9 },
        { name: 'email', dataType: 'Text', sampleValue: 'john@example.com', confidence: 0.9 }
      ],
      rowCount: 100,
      warnings: []
    })
  })

  describe('New Template Mode', () => {
    it('should render new template form correctly', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/source file type/i)).toBeInTheDocument()
      expect(screen.getByText('Field Mapping')).toBeInTheDocument()
    })

    it('should show "Add Field Combination" button when default export template exists', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      expect(screen.getByRole('button', { name: /add field combination/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add field combination/i })).not.toBeDisabled()
    })

    it('should disable "Add Field Combination" button when no default export template', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={null}
        />
      )

      expect(screen.getByRole('button', { name: /add field combination/i })).toBeDisabled()
    })

    it('should show warning when no default export template exists', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={null}
        />
      )

      expect(screen.getByText(/no default export template found/i)).toBeInTheDocument()
    })
  })

  describe('Edit Template Mode', () => {
    it('should pre-populate form with initial template data', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={mockInitialTemplate}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      expect(screen.getByDisplayValue('Test Import Template')).toBeInTheDocument()
      expect(screen.getByDisplayValue('CSV File')).toBeInTheDocument()
    })

    it('should display existing field combinations', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={mockInitialTemplate}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      // Should show the combined tag for field combinations
      expect(screen.getByText('Combined')).toBeInTheDocument()
    })

    it('should allow editing existing field combinations', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={mockInitialTemplate}
          defaultExportTemplate={mockDefaultExportTemplate}
          onAddFieldCombination={mockOnAddFieldCombination}
        />
      )

      // Find edit button for field combination
      const editButtons = screen.getAllByTitle(/edit combination/i)
      expect(editButtons.length).toBeGreaterThan(0)

      fireEvent.click(editButtons[0])

      expect(mockOnAddFieldCombination).toHaveBeenCalledWith(
        expect.objectContaining({
          editingCombination: expect.objectContaining({
            id: 'combo_1',
            targetField: 'Full Name'
          })
        }),
        expect.any(Array)
      )
    })
  })

  describe('File Upload and Parsing', () => {
    it('should parse uploaded file and populate fields', async () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      // Create a mock file
      const file = new File(['name,email\nJohn,john@example.com'], 'test.csv', { type: 'text/csv' })
      
      const fileInput = screen.getByLabelText(/browse files/i)
      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(fileParserService.parseFile).toHaveBeenCalledWith(file)
      })

      await waitFor(() => {
        // Should show parsed fields in the table
        expect(screen.getByText('first_name')).toBeInTheDocument()
        expect(screen.getByText('last_name')).toBeInTheDocument()
        expect(screen.getByText('email')).toBeInTheDocument()
      })
    })

    it('should handle file parsing errors', async () => {
      vi.mocked(fileParserService.parseFile).mockResolvedValue({
        success: false,
        error: 'Invalid file format',
        fields: [],
        rowCount: 0,
        warnings: []
      })

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      const file = new File(['invalid data'], 'test.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/browse files/i)
      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText(/parse error/i)).toBeInTheDocument()
        expect(screen.getByText('Invalid file format')).toBeInTheDocument()
      })
    })
  })

  describe('Current Template Data Synchronization', () => {
    it('should update state when currentTemplateData changes', () => {
      const { rerender } = render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      // Initially should have default state
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // empty template name

      // Update with currentTemplateData
      rerender(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={mockCurrentTemplateData}
        />
      )

      // Should update to show currentTemplateData
      expect(screen.getByDisplayValue('Updated Template')).toBeInTheDocument()
      expect(screen.getByDisplayValue('JSON File')).toBeInTheDocument()
    })

    it('should update field combinations when currentTemplateData changes', () => {
      const { rerender } = render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      // Update with currentTemplateData that has field combinations
      rerender(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={mockCurrentTemplateData}
        />
      )

      // Should show the field combination
      expect(screen.getByText('Combined')).toBeInTheDocument()
    })
  })

  describe('Field Combination Management', () => {
    it('should call onAddFieldCombination with current template data', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          onAddFieldCombination={mockOnAddFieldCombination}
        />
      )

      // Fill in template name
      const templateNameInput = screen.getByLabelText(/template name/i)
      fireEvent.change(templateNameInput, { target: { value: 'Test Template' } })

      // Click add field combination
      const addButton = screen.getByRole('button', { name: /add field combination/i })
      fireEvent.click(addButton)

      expect(mockOnAddFieldCombination).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Template',
          sourceFileType: 'CSV File',
          fields: expect.any(Array),
          fieldCombinations: expect.any(Array)
        }),
        expect.any(Array)
      )
    })

    it('should explode field combinations into individual fields when delete button is clicked', () => {
      const fieldCombinationsRef: React.MutableRefObject<{
        updateFieldCombinations: (combinations: FieldCombination[]) => void;
        getFieldCombinations: () => FieldCombination[];
      } | null> = { current: null }
      
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          fieldCombinationsRef={fieldCombinationsRef}
          currentTemplateData={mockCurrentTemplateData}
        />
      )

      // Should display the field combination initially
      expect(screen.getByText('Combined')).toBeInTheDocument()

      // Find and click delete button for field combination
      const deleteButtons = screen.getAllByTitle(/delete combination/i)
      expect(deleteButtons.length).toBeGreaterThan(0)
      
      fireEvent.click(deleteButtons[0])

      // The field combination should be removed
      expect(screen.queryByText('Combined')).not.toBeInTheDocument()
      
      // The individual fields should now appear as regular fields
      expect(screen.getByText('email')).toBeInTheDocument()
      expect(screen.getByText('phone')).toBeInTheDocument()
    })

    it('should delete all fields in a combined field group when delete is clicked', () => {
      // Create a template with old-style combined fields
      const templateWithCombinedFields = {
        ...mockCurrentTemplateData,
        fields: [
          { id: '1', sourceField: 'first_name', dataType: 'Text', sampleData: 'John', targetField: 'Full Name', actions: 'Combined' },
          { id: '2', sourceField: 'last_name', dataType: 'Text', sampleData: 'Doe', targetField: 'Full Name', actions: 'Combined' },
          { id: '3', sourceField: 'email', dataType: 'Text', sampleData: 'john@example.com', targetField: 'Email Address', actions: '' }
        ],
        fieldCombinations: []
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={templateWithCombinedFields}
        />
      )

      // Should display the combined fields initially
      expect(screen.getByText('first_name')).toBeInTheDocument()
      expect(screen.getByText('last_name')).toBeInTheDocument()
      expect(screen.getByText('Combined')).toBeInTheDocument()

      // Find and click delete button for the combined field group
      const deleteButtons = screen.getAllByTitle(/delete combination/i)
      expect(deleteButtons.length).toBeGreaterThan(0)
      
      fireEvent.click(deleteButtons[0])

      // Both fields in the combination should be removed
      expect(screen.queryByText('first_name')).not.toBeInTheDocument()
      expect(screen.queryByText('last_name')).not.toBeInTheDocument()
      expect(screen.queryByText('Combined')).not.toBeInTheDocument()
      
      // The regular field should still be there
      expect(screen.getByText('email')).toBeInTheDocument()
    })

    it('should expose field combination methods via ref', () => {
      const fieldCombinationsRef = { current: null }
      
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          fieldCombinationsRef={fieldCombinationsRef}
        />
      )

      // Ref should be populated with methods
      expect(fieldCombinationsRef.current).toBeTruthy()
      expect(fieldCombinationsRef.current?.updateFieldCombinations).toBeInstanceOf(Function)
      expect(fieldCombinationsRef.current?.getFieldCombinations).toBeInstanceOf(Function)
    })

    it('should update field combinations via ref', () => {
      const fieldCombinationsRef = { current: null }
      
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          fieldCombinationsRef={fieldCombinationsRef}
        />
      )

      // Update field combinations via ref
      const newCombinations = [mockCurrentTemplateData.fieldCombinations[0]]
      fieldCombinationsRef.current?.updateFieldCombinations(newCombinations)

      // Should display the updated combinations
      expect(screen.getByText('Combined')).toBeInTheDocument()
    })
  })

  describe('Form Validation and Saving', () => {
    it('should validate template name before saving', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          saveRef={mockSaveRef}
        />
      )

      // Try to save without template name
      mockSaveRef.current?.()

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should validate fields before saving', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          saveRef={mockSaveRef}
        />
      )

      // Set template name but no fields
      const templateNameInput = screen.getByLabelText(/template name/i)
      fireEvent.change(templateNameInput, { target: { value: 'Test Template' } })

      // Clear any default fields
      const deleteButtons = screen.getAllByTitle(/delete/i)
      deleteButtons.forEach(button => fireEvent.click(button))

      // Try to save
      mockSaveRef.current?.()

      // Should not call onSave due to no fields
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should save template with valid data', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          saveRef={mockSaveRef}
          currentTemplateData={mockCurrentTemplateData}
        />
      )

      // Save template
      mockSaveRef.current?.()

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Template',
          sourceFileType: 'JSON File',
          fields: expect.any(Array),
          fieldCombinations: expect.any(Array)
        })
      )
    })
  })

  describe('Field Management', () => {
    it('should allow deleting field combinations', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={mockCurrentTemplateData}
        />
      )

      // Find delete button for field combination
      const deleteButtons = screen.getAllByTitle(/delete combination/i)
      expect(deleteButtons.length).toBeGreaterThan(0)

      fireEvent.click(deleteButtons[0])

      // Combined tag should be removed
      expect(screen.queryByText('Combined')).not.toBeInTheDocument()
    })

    it('should display field combination details in table', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={mockCurrentTemplateData}
        />
      )

      // Should show combination details
      expect(screen.getByText('Combined')).toBeInTheDocument()
      expect(screen.getByText(/concat with/i)).toBeInTheDocument()
    })
  })
}) 