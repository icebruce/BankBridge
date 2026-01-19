import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewImportTemplateEditor from '../NewImportTemplateEditor'
import { ImportTemplate, FieldCombination } from '../../../models/ImportTemplate'
import { Template } from '../../../models/Template'
import { Account } from '../../../models/Settings'
import { fileParserService } from '../../../services/fileParserService'

vi.mock('../../../services/fileParserService')

const mockAccounts: Account[] = [
  {
    id: 'acc_1',
    institutionName: 'TD Bank',
    accountName: 'Checking',
    exportDisplayName: 'TD Bank - Checking',
    accountType: 'checking',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
]

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
    { sourceField: 'email', targetField: 'Email Address' }
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
  sourceFields: ['first_name', 'last_name', 'email', 'phone', 'address']
}

const mockOnSave = vi.fn()
const mockOnCancel = vi.fn()
const mockOnAddFieldCombination = vi.fn()

describe('NewImportTemplateEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    it('renders form with template name input and field mapping section', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument()
      expect(screen.getByText('Field Mapping')).toBeInTheDocument()
    })

    it('shows warning when no default export template exists', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={null}
        />
      )

      expect(screen.getByText(/no default export template found/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add field combination/i })).toBeDisabled()
    })
  })

  describe('Edit Template Mode', () => {
    it('pre-populates form with existing template data', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={mockInitialTemplate}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      expect(screen.getByDisplayValue('Test Import Template')).toBeInTheDocument()
      expect(screen.getByText('CSV File')).toBeInTheDocument()
      expect(screen.getAllByText('Combined').length).toBeGreaterThan(0)
    })

    it('allows editing existing field combinations', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialTemplate={mockInitialTemplate}
          defaultExportTemplate={mockDefaultExportTemplate}
          onAddFieldCombination={mockOnAddFieldCombination}
        />
      )

      const editButtons = screen.getAllByTitle(/edit combination/i)
      fireEvent.click(editButtons[0])

      expect(mockOnAddFieldCombination).toHaveBeenCalledWith(
        expect.objectContaining({ editingCombination: expect.objectContaining({ id: 'combo_1' }) }),
        expect.any(Array)
      )
    })
  })

  describe('File Upload and Parsing', () => {
    it('parses uploaded file and displays fields', async () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
        />
      )

      const file = new File(['name,email\nJohn,john@example.com'], 'test.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/browse files/i)
      await userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(fileParserService.parseFile).toHaveBeenCalled()
        expect(screen.getByText('first_name')).toBeInTheDocument()
      })
    })

    it('handles file parsing errors', async () => {
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

      const file = new File(['invalid'], 'test.csv', { type: 'text/csv' })
      await userEvent.upload(screen.getByLabelText(/browse files/i), file)

      await waitFor(() => {
        expect(screen.getByText(/parse error/i)).toBeInTheDocument()
        expect(screen.getByText('Invalid file format')).toBeInTheDocument()
      })
    })
  })

  describe('Field Combination Management', () => {
    it('calls onAddFieldCombination with current template data', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          onAddFieldCombination={mockOnAddFieldCombination}
          initialTemplate={mockInitialTemplate}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /add field combination/i }))

      expect(mockOnAddFieldCombination).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Import Template' }),
        expect.any(Array)
      )
    })

    it('removes field combination when delete button is clicked', () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          currentTemplateData={{
            name: 'Test',
            sourceFileType: 'CSV File',
            fields: [{ id: '1', sourceField: 'email', dataType: 'Text', sampleData: '', targetField: '', actions: '' }],
            fieldCombinations: [{
              id: 'combo_2',
              targetField: 'Contact Info',
              delimiter: 'Comma',
              sourceFields: [
                { id: 'sf_3', fieldName: 'email', order: 1 },
                { id: 'sf_4', fieldName: 'phone', order: 2 }
              ]
            }]
          }}
        />
      )

      expect(screen.getByText('Combined')).toBeInTheDocument()
      fireEvent.click(screen.getAllByTitle(/delete combination/i)[0])
      expect(screen.queryByText('Combined')).not.toBeInTheDocument()
    })

    it('exposes field combination methods via ref', () => {
      const fieldCombinationsRef: { current: { updateFieldCombinations: (c: FieldCombination[]) => void; getFieldCombinations: () => FieldCombination[] } | null } = { current: null }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          fieldCombinationsRef={fieldCombinationsRef}
        />
      )

      expect(fieldCombinationsRef.current?.updateFieldCombinations).toBeInstanceOf(Function)
      expect(fieldCombinationsRef.current?.getFieldCombinations).toBeInstanceOf(Function)
    })
  })

  describe('Form Validation and Saving', () => {
    it('does not save without template name', () => {
      const saveRef: { current: (() => void) | null } = { current: null }
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          saveRef={saveRef}
        />
      )

      saveRef.current?.()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('saves template with valid data', async () => {
      const saveRef: { current: (() => void) | null } = { current: null }
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          saveRef={saveRef}
          accounts={mockAccounts}
          currentTemplateData={{
            name: 'Valid Template',
            accountId: 'acc_1',
            sourceFileType: 'CSV File',
            fields: [
              { id: '1', sourceField: 'first_name', dataType: 'Text', sampleData: 'John', targetField: 'Full Name', actions: '' }
            ],
            fieldCombinations: []
          }}
        />
      )

      await waitFor(() => expect(screen.getByDisplayValue('Valid Template')).toBeInTheDocument())
      saveRef.current?.()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Valid Template', sourceFileType: 'CSV File' })
        )
      })
    })
  })

  describe('Partial Mapping (sourceFields persistence)', () => {
    it('shows Add Field button with unmapped sourceFields available', async () => {
      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={mockInitialTemplate}
          accounts={mockAccounts}
        />
      )

      const addFieldButton = screen.getByTitle('Add a field from original source file')
      expect(addFieldButton).not.toBeDisabled()

      fireEvent.click(addFieldButton)

      await waitFor(() => {
        expect(screen.getByText('phone')).toBeInTheDocument()
        expect(screen.getByText('address')).toBeInTheDocument()
      })
    })

    it('preserves all sourceFields in saved template data', async () => {
      const saveRef: { current: (() => void) | null } = { current: null }
      const templateWithSourceFields: ImportTemplate = {
        ...mockInitialTemplate,
        sourceFields: ['field1', 'field2', 'field3'],
        fieldMappings: [
          { sourceField: 'field1', targetField: 'Full Name', dataType: 'Text', required: false, validation: '' }
        ],
        fieldCombinations: []
      }

      render(
        <NewImportTemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          defaultExportTemplate={mockDefaultExportTemplate}
          initialTemplate={templateWithSourceFields}
          saveRef={saveRef}
          accounts={mockAccounts}
        />
      )

      await waitFor(() => expect(screen.getByDisplayValue('Test Import Template')).toBeInTheDocument())
      saveRef.current?.()

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ sourceFields: ['field1', 'field2', 'field3'] })
        )
      })
    })
  })
})
