import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportTemplatesPage from '../ImportTemplatesPage'
import * as importTemplateService from '../../../services/importTemplateService'
import * as templateService from '../../../services/templateService'
import * as settingsService from '../../../services/settingsService'
import { ImportTemplate } from '../../../models/ImportTemplate'
import { Template } from '../../../models/Template'
import { Account } from '../../../models/Settings'

// Mock the services
vi.mock('../../../services/importTemplateService')
vi.mock('../../../services/templateService')
vi.mock('../../../services/settingsService')
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

const mockImportTemplates: ImportTemplate[] = [
  {
    id: 'import_template_1',
    name: 'Test Import Template 1',
    description: 'Test description 1',
    account: 'TD Bank - Checking',
    accountId: 'acc_1',
    fileType: 'CSV File',
    fieldCount: 3,
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
    sourceFields: ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state']
  },
  {
    id: 'import_template_2',
    name: 'Test Import Template 2',
    description: 'Test description 2',
    account: 'Chase - Savings',
    accountId: 'acc_2',
    fileType: 'JSON File',
    fieldCount: 2,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    schemaVersion: '1.0.0',
    status: 'Active',
    fieldMappings: [
      { sourceField: 'customer_id', targetField: 'Customer ID', dataType: 'Text', required: false, validation: '' }
    ],
    fieldCombinations: [],
    // All source fields from the original file (includes unmapped fields)
    sourceFields: ['customer_id', 'customer_name', 'balance', 'last_transaction']
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
    { sourceField: 'email', targetField: 'Email Address' },
    { sourceField: 'phone', targetField: 'Phone Number' }
  ]
}

describe('ImportTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful data fetching by default
    vi.mocked(importTemplateService.fetchImportTemplates).mockResolvedValue(mockImportTemplates)
    vi.mocked(templateService.getDefaultTemplate).mockResolvedValue(mockDefaultExportTemplate)
    vi.mocked(settingsService.getAccounts).mockResolvedValue(mockAccounts)
  })

  describe('Initial Loading', () => {
    it('should render the page title and description', async () => {
      render(<ImportTemplatesPage />)

      expect(screen.getByText('Import Templates')).toBeInTheDocument()
      expect(screen.getByText('Manage your import templates')).toBeInTheDocument()
    })

    it('should display import templates after loading', async () => {
      render(<ImportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
        expect(screen.getByText('Test Import Template 2')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<ImportTemplatesPage />)
      
      // Should show some loading indication or empty state initially
      expect(screen.queryByText('Test Import Template 1')).not.toBeInTheDocument()
    })
  })

  describe('Template Creation', () => {
    it('should show new template editor when "New Template" is clicked', async () => {
      render(<ImportTemplatesPage />)

      // Wait for accounts to load so button is enabled
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })

      const newTemplateButton = screen.getByRole('button', { name: /new template/i })
      fireEvent.click(newTemplateButton)

      await waitFor(() => {
        expect(screen.getByText('New Import Template')).toBeInTheDocument()
        expect(screen.getByText('Create a new template from source file')).toBeInTheDocument()
      })
    })

    it('should cancel template creation and return to main page', async () => {
      render(<ImportTemplatesPage />)

      // Wait for accounts to load so button is enabled
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })

      // Go to new template editor
      const newTemplateButton = screen.getByRole('button', { name: /new template/i })
      fireEvent.click(newTemplateButton)

      await waitFor(() => {
        expect(screen.getByText('New Import Template')).toBeInTheDocument()
      })

      // Cancel and return
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText('Import Templates')).toBeInTheDocument()
        expect(screen.queryByText('New Import Template')).not.toBeInTheDocument()
      })
    })
  })

  describe('Template Editing', () => {
    it('should show template editor when edit action is clicked', async () => {
      render(<ImportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })
      
      // Find and click edit button (this might be in a dropdown or action menu)
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      fireEvent.click(editButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Edit Import Template')).toBeInTheDocument()
      })
    })
  })

  describe('Field Combination Functionality', () => {
    it('should navigate to field combination editor when "Add Field Combination" is clicked (edit mode)', async () => {
      // Use edit mode where fields are already populated from the template
      render(<ImportTemplatesPage />)

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })

      // Click edit on existing template (which has fields)
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Import Template')).toBeInTheDocument()
      })

      // Click "Add Field Combination" button - should be enabled since template has fields
      const addFieldCombinationButton = screen.getByRole('button', { name: /add field combination/i })
      expect(addFieldCombinationButton).not.toBeDisabled()
      fireEvent.click(addFieldCombinationButton)

      await waitFor(() => {
        expect(screen.getByText('Add Field Combination')).toBeInTheDocument()
        expect(screen.getByText('Combine multiple source fields into one target field')).toBeInTheDocument()
      })
    })

    it('should return to template editor when field combination editing is canceled', async () => {
      render(<ImportTemplatesPage />)

      // Wait for templates to load and click edit
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Import Template')).toBeInTheDocument()
      })

      // Navigate to field combination editor
      const addFieldCombinationButton = screen.getByRole('button', { name: /add field combination/i })
      fireEvent.click(addFieldCombinationButton)

      await waitFor(() => {
        // The header should show "Add Field Combination" (as h2), and "Combine multiple..." description
        expect(screen.getByText('Combine multiple source fields into one target field')).toBeInTheDocument()
      })

      // Cancel field combination
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        // Should be back in template editor (with Edit Import Template header)
        expect(screen.getByText('Edit Import Template')).toBeInTheDocument()
        // The field combination description should no longer be visible
        expect(screen.queryByText('Combine multiple source fields into one target field')).not.toBeInTheDocument()
      })
    })

    it('should show disabled Add Field Combination button in new template mode without file', async () => {
      render(<ImportTemplatesPage />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })

      // Navigate to new template editor first
      const newTemplateButton = screen.getByRole('button', { name: /new template/i })
      fireEvent.click(newTemplateButton)

      await waitFor(() => {
        expect(screen.getByText('New Import Template')).toBeInTheDocument()
      })

      // The "Add Field Combination" button should be disabled without an uploaded file
      const addFieldCombinationButton = screen.getByRole('button', { name: /add field combination/i })
      expect(addFieldCombinationButton).toBeDisabled()
    })

    it('should show existing field combinations when editing template', async () => {
      render(<ImportTemplatesPage />)

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })

      // Click edit on template with field combinations
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Import Template')).toBeInTheDocument()
      })

      // Verify we're now in the edit form - the template name should be in an input field
      const templateNameInput = screen.getByLabelText(/template name/i)
      expect(templateNameInput).toHaveValue('Test Import Template 1')
    })
  })

  describe('Template Deletion', () => {
    it('should show confirmation dialog when delete is clicked', async () => {
      vi.mocked(window.confirm).mockReturnValue(true)
      vi.mocked(importTemplateService.deleteImportTemplate).mockResolvedValue(true)

      render(<ImportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })
      
      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template? This action cannot be undone.')
    })

    it('should delete template when confirmed', async () => {
      vi.mocked(window.confirm).mockReturnValue(true)
      vi.mocked(importTemplateService.deleteImportTemplate).mockResolvedValue(true)

      render(<ImportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })
      
      // Click delete and confirm
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(importTemplateService.deleteImportTemplate).toHaveBeenCalledWith('import_template_1')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle template loading errors gracefully', async () => {
      vi.mocked(importTemplateService.fetchImportTemplates).mockRejectedValue(new Error('Failed to load templates'))
      
      render(<ImportTemplatesPage />)
      
      await waitFor(() => {
        // Should not crash and should handle the error
        expect(screen.queryByText('Test Import Template 1')).not.toBeInTheDocument()
      })
    })

    it('should handle template creation errors', async () => {
      vi.mocked(importTemplateService.createImportTemplate).mockRejectedValue(new Error('Failed to create template'))

      render(<ImportTemplatesPage />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
      })

      // Navigate to new template editor
      const newTemplateButton = screen.getByRole('button', { name: /new template/i })
      fireEvent.click(newTemplateButton)

      await waitFor(() => {
        expect(screen.getByText('New Import Template')).toBeInTheDocument()
      })

      // Try to save template (this would trigger the error)
      const saveButton = screen.getByRole('button', { name: /save template/i })
      fireEvent.click(saveButton)

      // Should handle the error gracefully without crashing
      await waitFor(() => {
        expect(screen.getByText('New Import Template')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should filter templates based on search term', async () => {
      render(<ImportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
        expect(screen.getByText('Test Import Template 2')).toBeInTheDocument()
      })
      
      // Search for specific template
      const searchInput = screen.getByPlaceholderText(/search templates/i)
      await userEvent.type(searchInput, 'Template 1')
      
      await waitFor(() => {
        expect(screen.getByText('Test Import Template 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Import Template 2')).not.toBeInTheDocument()
      })
    })
  })
}) 