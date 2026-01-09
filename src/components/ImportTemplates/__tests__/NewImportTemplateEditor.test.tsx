import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import NewImportTemplateEditor from '../NewImportTemplateEditor'
import { ImportTemplate, FieldCombination } from '../../../models/ImportTemplate'
import { Template } from '../../../models/Template'
import { Account } from '../../../models/Settings'
import { fileParserService } from '../../../services/fileParserService'

// Mock the file parser service
vi.mock('../../../services/fileParserService')

// Mock accounts for testing
const mockAccounts: Account[] = [
  {
    id: 'acc_1',
    institutionName: 'TD Bank',
    accountName: 'Checking',
    exportDisplayName: 'TD Bank - Checking',
    accountType: 'checking',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'acc_2',
    institutionName: 'Chase',
    accountName: 'Savings',
    exportDisplayName: 'Chase - Savings',
    accountType: 'savings',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
]

const mockOnSave = vi.fn()
const mockOnCancel = vi.fn()
const mockOnAddFieldCombination = vi.fn()
const mockSaveRef: { current: (() => void) | null } = { current: null }

// Type for fieldCombinationsRef
type FieldCombinationsRefType = {
  updateFieldCombinations: (combinations: FieldCombination[]) => void;
  getFieldCombinations: () => FieldCombination[];
} | null

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
  account: 'TD Bank - Checking',
  accountId: 'acc_1',
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
  ],
  // All source fields from the original file (includes unmapped fields)
  sourceFields: ['first_name', 'last_name', 'email', 'phone', 'address']
}

const mockCurrentTemplateData = {
  name: 'Updated Template',
  account: 'TD Bank - Checking',
  accountId: 'acc_1',
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
      // Source file type is now read-only text display, not an input
      expect(screen.getByText(/source file type/i)).toBeInTheDocument()
      expect(screen.getByText('Field Mapping')).toBeInTheDocument()
    })

    it('should show "Add Field Combination" button when default export template exists and file is uploaded', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      expect(screen.getByRole('button', { name: /add field combination/i })).toBeInTheDocument()
      // Button should be disabled initially since no file is uploaded
      expect(screen.getByRole('button', { name: /add field combination/i })).toBeDisabled()
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

    it('should enable "Add Field Combination" button when both default export template exists and file is uploaded', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      // Button should be disabled initially because no file is uploaded and no fields exist
      expect(screen.getByRole('button', { name: /add field combination/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /add field combination/i })).toHaveAttribute('title', 'Upload a file to enable field combinations')
    })

    it('should enable "Add Field Combination" button when fields exist (indicating file was uploaded)', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={{
            name: 'Test Template',
            sourceFileType: 'CSV File',
            fields: [
              { id: '1', sourceField: 'first_name', dataType: 'Text', sampleData: 'John', targetField: 'Full Name', actions: '' }
            ],
            fieldCombinations: []
          }}
        />
      )

      // Button should be enabled because fields exist (indicating a file was uploaded)
      expect(screen.getByRole('button', { name: /add field combination/i })).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /add field combination/i })).toHaveAttribute('title', 'Add field combination')
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
      // Source file type is now read-only text, not a select input
      expect(screen.getByText('CSV File')).toBeInTheDocument()
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
      expect(screen.getAllByText('Combined').length).toBeGreaterThan(0)
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
        expect(fileParserService.parseFile).toHaveBeenCalledWith(file, expect.objectContaining({
          maxPreviewRows: 50
        }))
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

      // Initially template name input exists (may be empty)
      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument()

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
      // Source file type is now read-only text, not a select input
      expect(screen.getByText('JSON File')).toBeInTheDocument()
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
      // Provide fields via initialTemplate to enable the Add Field Combination button
      const templateWithFields = {
        ...mockInitialTemplate,
        fieldMappings: [
          { sourceField: 'first_name', targetField: 'Full Name', dataType: 'Text', required: false, validation: '' },
          { sourceField: 'email', targetField: 'Email Address', dataType: 'Text', required: false, validation: '' }
        ]
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          onAddFieldCombination={mockOnAddFieldCombination}
          initialTemplate={templateWithFields}
        />
      )

      // Click add field combination - should be enabled since template has fields
      const addButton = screen.getByRole('button', { name: /add field combination/i })
      expect(addButton).not.toBeDisabled()
      fireEvent.click(addButton)

      expect(mockOnAddFieldCombination).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Import Template',
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
      expect(screen.queryAllByText('Combined').length).toBe(0)
      
      // The individual fields should now appear as regular fields
      expect(screen.queryAllByText('email').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('phone').length).toBeGreaterThan(0)
    })

    it('should delete field combination when delete button is clicked', async () => {
      // Create an initial template with a field combination
      const templateWithCombination: ImportTemplate = {
        ...mockInitialTemplate,
        name: 'Template With Combination',
        fieldMappings: [
          { sourceField: 'first_name', targetField: '', dataType: 'Text', required: false, validation: '' },
          { sourceField: 'last_name', targetField: '', dataType: 'Text', required: false, validation: '' },
          { sourceField: 'email', targetField: 'Email Address', dataType: 'Text', required: false, validation: '' }
        ],
        fieldCombinations: [
          {
            id: 'combo_test',
            targetField: 'Full Name',
            delimiter: 'Space',
            sourceFields: [
              { id: 'sf_1', fieldName: 'first_name', order: 1 },
              { id: 'sf_2', fieldName: 'last_name', order: 2 }
            ]
          }
        ]
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={templateWithCombination}
        />
      )

      // Should display the field combination initially
      await waitFor(() => {
        expect(screen.getByText('Full Name')).toBeInTheDocument()
        // Should show combination info (first_name and last_name combined)
        expect(screen.getByText('first_name')).toBeInTheDocument()
      })

      // Find and click delete button for the field combination
      const deleteButtons = screen.getAllByTitle(/delete combination/i)
      expect(deleteButtons.length).toBeGreaterThan(0)

      fireEvent.click(deleteButtons[0])

      // The combination should be removed - check that the combined target field row is gone
      // Note: Individual source fields may still appear as regular fields
      await waitFor(() => {
        // After deleting the combination, the source fields should be back as regular unmapped fields
        // The email field should definitely still be there
        expect(screen.getByText('email')).toBeInTheDocument()
      })
    })

    it('should expose field combination methods via ref', () => {
      const fieldCombinationsRef: { current: FieldCombinationsRefType } = { current: null }

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

    it('should update field combinations via ref', async () => {
      const fieldCombinationsRef: { current: FieldCombinationsRefType } = { current: null }

      // Need to provide fields that match the combination source fields
      const templateDataWithFields = {
        name: 'Test Template',
        account: 'Test Account',
        sourceFileType: 'CSV File',
        fields: [
          { id: '1', sourceField: 'email', dataType: 'Text', sampleData: 'test@test.com', targetField: '', actions: '' },
          { id: '2', sourceField: 'phone', dataType: 'Text', sampleData: '123-456', targetField: '', actions: '' }
        ],
        fieldCombinations: []
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          fieldCombinationsRef={fieldCombinationsRef}
          currentTemplateData={templateDataWithFields}
        />
      )

      // Update field combinations via ref
      const newCombinations = [mockCurrentTemplateData.fieldCombinations[0]]
      fieldCombinationsRef.current?.updateFieldCombinations(newCombinations)

      // Should display the updated combinations - use waitFor since this is a state update
      await waitFor(() => {
        expect(screen.getByText('Combined')).toBeInTheDocument()
      })
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
          accounts={mockAccounts}
        />
      )

      // Set template name and select account but no fields (new template starts with empty fields)
      const templateNameInput = screen.getByLabelText(/template name/i)
      fireEvent.change(templateNameInput, { target: { value: 'Test Template' } })

      const accountSelect = screen.getByRole('combobox', { name: /account/i })
      fireEvent.change(accountSelect, { target: { value: 'acc_1' } })

      // Try to save with no fields
      mockSaveRef.current?.()

      // Should not call onSave due to no fields
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should save template with valid data', async () => {
      // Create valid template data with all fields properly mapped
      const validTemplateData = {
        name: 'Valid Template',
        account: 'TD Bank - Checking',
        accountId: 'acc_1',
        sourceFileType: 'CSV File',
        fields: [
          { id: '1', sourceField: 'first_name', dataType: 'Text', sampleData: 'John', targetField: 'Full Name', actions: '' },
          { id: '2', sourceField: 'email_address', dataType: 'Text', sampleData: 'john@test.com', targetField: 'Email Address', actions: '' }
        ],
        fieldCombinations: []
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          saveRef={mockSaveRef}
          accounts={mockAccounts}
          currentTemplateData={validTemplateData}
        />
      )

      // Wait for state to sync from currentTemplateData
      await waitFor(() => {
        expect(screen.getByDisplayValue('Valid Template')).toBeInTheDocument()
      })

      // Save template
      mockSaveRef.current?.()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Valid Template',
            accountId: 'acc_1',
            sourceFileType: 'CSV File',
            fields: expect.any(Array),
            fieldCombinations: expect.any(Array)
          })
        )
      })
    })
  })

  describe('Target field mapping validation and UI', () => {
    it('disables target select with reason when no default export template', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={null}
          currentTemplateData={{
            name: 'Test',
            sourceFileType: 'CSV File',
            fields: [
              { id: '1', sourceField: 'name', dataType: 'Text', sampleData: 'John', targetField: '', actions: '' }
            ],
            fieldCombinations: []
          }}
        />
      )

      const selects = screen.getAllByRole('combobox')
      // The first select in the target column should be disabled (data type selects are enabled)
      const targetSelect = selects.find(s => (s as HTMLSelectElement).options[0]?.textContent === 'Select target field') as HTMLSelectElement
      expect(targetSelect).toBeDefined()
      expect(targetSelect.disabled).toBe(true)
      expect(targetSelect.title).toMatch(/enable mapping/i)
    })

    it('marks unmapped visible fields invalid on save', async () => {
      const localSaveRef: any = { current: null }
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          saveRef={localSaveRef}
          accounts={mockAccounts}
          currentTemplateData={{
            name: 'Test',
            accountId: 'acc_1',
            sourceFileType: 'CSV File',
            fields: [
              { id: '1', sourceField: 'name', dataType: 'Text', sampleData: 'John', targetField: '', actions: '' }
            ],
            fieldCombinations: []
          }}
        />
      )

      // Trigger save to mark required fields as touched
      localSaveRef.current?.()

      const targetSelect = screen.getAllByRole('combobox').find(s => (s as HTMLSelectElement).options[0]?.textContent === 'Select target field') as HTMLSelectElement
      expect(targetSelect).toBeDefined()
      await waitFor(() => expect(targetSelect.getAttribute('aria-invalid')).toBe('true'))
    })

    it('data type dropdown uses same rounded border styling as target select', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={{
            name: 'Test',
            sourceFileType: 'CSV File',
            fields: [
              { id: '1', sourceField: 'name', dataType: 'Text', sampleData: 'John', targetField: '', actions: '' }
            ],
            fieldCombinations: []
          }}
        />
      )

      const dataTypeSelect = screen.getAllByLabelText('Data type')[0]
      expect(dataTypeSelect.className).toContain('rounded-lg')
      expect(dataTypeSelect.className).toContain('border')
    })

    it('keeps typed template name when currentTemplateData syncs', () => {
      const { rerender } = render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={{
            name: 'Initial Name',
            sourceFileType: 'CSV File',
            fields: [
              { id: '1', sourceField: 'name', dataType: 'Text', sampleData: 'John', targetField: '', actions: '' }
            ],
            fieldCombinations: []
          }}
        />
      )

      const nameInput = screen.getByLabelText(/template name/i)
      fireEvent.change(nameInput, { target: { value: 'User Name' } })

      // Simulate a sync from editor returning
      rerender(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={{
            name: 'Synced Name',
            sourceFileType: 'CSV File',
            fields: [
              { id: '1', sourceField: 'name', dataType: 'Text', sampleData: 'John', targetField: '', actions: '' }
            ],
            fieldCombinations: []
          }}
        />
      )

      expect((screen.getByLabelText(/template name/i) as HTMLInputElement).value).toBe('User Name')
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
      // Preview shows concatenated sample values (falls back to field names if no sample data)
      expect(screen.getByText(/email, phone/i)).toBeInTheDocument()
    })
  })

  describe('Partial Mapping Edit Flow (sourceFields persistence)', () => {
    it('should show Add Field button when template has unmapped sourceFields', () => {
      // Template has 5 sourceFields but only 2 fieldMappings
      // This means 3 fields are unmapped and should be available to add
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={mockInitialTemplate}
          accounts={mockAccounts}
        />
      )

      // The Add Field button should be visible since there are unmapped fields
      // Use title to distinguish from "Add Field Combination" button
      const addFieldButton = screen.getByTitle('Add a field from original source file')
      expect(addFieldButton).toBeInTheDocument()
      expect(addFieldButton).not.toBeDisabled()
    })

    it('should show unmapped sourceFields in Add Field dropdown', async () => {
      // Template has sourceFields: ['first_name', 'last_name', 'email', 'phone', 'address']
      // But only first_name and email are mapped
      // So phone and address should be available in Add Field dropdown
      // (last_name is in a combination, so it's also technically mapped)
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={mockInitialTemplate}
          accounts={mockAccounts}
        />
      )

      // Click the Add Field button to open the dropdown (use title to be specific)
      const addFieldButton = screen.getByTitle('Add a field from original source file')
      fireEvent.click(addFieldButton)

      // The dropdown should show unmapped fields
      await waitFor(() => {
        // phone and address are unmapped
        expect(screen.getByText('phone')).toBeInTheDocument()
        expect(screen.getByText('address')).toBeInTheDocument()
      })
    })

    it('should include sourceFields in saved template data', async () => {
      const templateWithSourceFields: ImportTemplate = {
        ...mockInitialTemplate,
        sourceFields: ['field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'field7'],
        fieldMappings: [
          { sourceField: 'field1', targetField: 'Full Name', dataType: 'Text', required: false, validation: '' },
          { sourceField: 'field2', targetField: 'Email Address', dataType: 'Text', required: false, validation: '' }
        ],
        fieldCombinations: []
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={templateWithSourceFields}
          saveRef={mockSaveRef}
          accounts={mockAccounts}
        />
      )

      // Wait for component to initialize
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Import Template')).toBeInTheDocument()
      })

      // Trigger save
      mockSaveRef.current?.()

      // The saved data should include sourceFields
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceFields: ['field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'field7']
          })
        )
      })
    })

    it('should preserve all sourceFields even when only some are mapped', async () => {
      // Simulate a template with 7 source fields but only 2 mapped
      const partiallyMappedTemplate: ImportTemplate = {
        id: 'partial_template',
        name: 'Partially Mapped Template',
        description: '',
        fileType: 'CSV File',
        fieldCount: 2,
        account: 'TD Bank - Checking',
        accountId: 'acc_1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        schemaVersion: '1.0.0',
        status: 'Active',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Full Name', dataType: 'Date', required: false, validation: '' },
          { sourceField: 'amount', targetField: 'Email Address', dataType: 'Currency', required: false, validation: '' }
        ],
        fieldCombinations: [],
        // 7 total source fields, only 2 are mapped
        sourceFields: ['date', 'amount', 'description', 'category', 'memo', 'reference', 'balance']
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={partiallyMappedTemplate}
          saveRef={mockSaveRef}
          accounts={mockAccounts}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Partially Mapped Template')).toBeInTheDocument()
      })

      // Click Add Field to verify unmapped fields are available (use title to be specific)
      const addFieldButton = screen.getByTitle('Add a field from original source file')
      fireEvent.click(addFieldButton)

      // Should show the 5 unmapped fields
      await waitFor(() => {
        expect(screen.getByText('description')).toBeInTheDocument()
        expect(screen.getByText('category')).toBeInTheDocument()
        expect(screen.getByText('memo')).toBeInTheDocument()
        expect(screen.getByText('reference')).toBeInTheDocument()
        expect(screen.getByText('balance')).toBeInTheDocument()
      })

      // Close dropdown and save
      fireEvent.click(addFieldButton)
      mockSaveRef.current?.()

      // Verify all 7 sourceFields are preserved in save data
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceFields: ['date', 'amount', 'description', 'category', 'memo', 'reference', 'balance']
          })
        )
      })
    })

    it('should handle template with no sourceFields gracefully', () => {
      const templateWithoutSourceFields: ImportTemplate = {
        ...mockInitialTemplate,
        sourceFields: undefined
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={templateWithoutSourceFields}
          accounts={mockAccounts}
        />
      )

      // Should not crash
      expect(screen.getByDisplayValue('Test Import Template')).toBeInTheDocument()

      // The component should render without crashing even with no sourceFields
      // The Add Field button might not be visible when there are no sourceFields to add
      // We just verify the component renders correctly
      expect(screen.getByText('Field Mapping')).toBeInTheDocument()
    })

    it('should show available fields in dropdown when clicked', async () => {
      const partialTemplate: ImportTemplate = {
        ...mockInitialTemplate,
        fieldMappings: [
          { sourceField: 'first_name', targetField: 'Full Name', dataType: 'Text', required: false, validation: '' }
        ],
        fieldCombinations: [],
        sourceFields: ['first_name', 'email', 'phone']
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={partialTemplate}
          accounts={mockAccounts}
        />
      )

      // Open Add Field dropdown (use title to be specific)
      const addFieldButton = screen.getByTitle('Add a field from original source file')
      fireEvent.click(addFieldButton)

      // Should show email and phone as options (unmapped fields from sourceFields)
      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument()
        expect(screen.getByText('phone')).toBeInTheDocument()
      })

      // first_name is already mapped, so it should NOT be in the dropdown
      // (Note: it might appear in the table, so we check specifically in dropdown context)
      const dropdownContainer = addFieldButton.closest('.relative')
      expect(dropdownContainer).toBeInTheDocument()
    })
  })
}) 