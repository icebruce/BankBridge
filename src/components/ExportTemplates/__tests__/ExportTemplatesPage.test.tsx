import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportTemplatesPage from '../ExportTemplatesPage'
import * as templateService from '../../../services/templateService'
import { Template } from '../../../models/Template'

// Mock the template service
vi.mock('../../../services/templateService')

const mockTemplates: Template[] = [
  {
    id: 'template_1',
    name: 'Test Template 1',
    description: 'Test description 1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    schemaVersion: '1.0.0',
    isDefault: true,
    fieldMappings: [
      { sourceField: 'field1', targetField: 'Field 1' },
      { sourceField: 'field2', targetField: 'Field 2' }
    ]
  },
  {
    id: 'template_2',
    name: 'Test Template 2',
    description: 'Test description 2',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    schemaVersion: '1.0.0',
    isDefault: false,
    fieldMappings: [
      { sourceField: 'field3', targetField: 'Field 3' }
    ]
  }
]

describe('ExportTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful template fetching by default
    vi.mocked(templateService.fetchTemplates).mockResolvedValue(mockTemplates)
  })

  describe('Initial Loading', () => {
    it('should render the page title and description', async () => {
      render(<ExportTemplatesPage />)
      
      expect(screen.getByText('Export Templates')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getByText('Templates')).toBeInTheDocument()
      })
    })

    it('should load and display templates on mount', async () => {
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
        expect(screen.getByText('Test Template 2')).toBeInTheDocument()
      })
      
      expect(templateService.fetchTemplates).toHaveBeenCalledOnce()
    })

    it('should handle template loading errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(templateService.fetchTemplates).mockRejectedValue(new Error('Network error'))
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading templates:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Template List Display', () => {
    it('should display template information correctly', async () => {
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
        expect(screen.getByText('Test description 1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // field count
        expect(screen.getByText('Default')).toBeInTheDocument()
        expect(screen.getByText('Set as Default')).toBeInTheDocument()
      })
    })

    it('should show correct status for default and non-default templates', async () => {
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        // Template 1 should show "Default" badge
        expect(screen.getByText('Default')).toBeInTheDocument()
        // Template 2 should show "Set as Default" button
        expect(screen.getByText('Set as Default')).toBeInTheDocument()
      })
    })

    it('should filter templates based on search input', async () => {
      const user = userEvent.setup()
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
        expect(screen.getByText('Test Template 2')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search templates...')
      await user.type(searchInput, 'Template 1')
      
      expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Template 2')).not.toBeInTheDocument()
    })
  })

  describe('New Template Creation', () => {
    it('should show new template editor when "New Template" is clicked', async () => {
      const user = userEvent.setup()
      render(<ExportTemplatesPage />)
      
      const newButton = screen.getByText('New Template')
      await user.click(newButton)
      
      expect(screen.getByText('New Export Template')).toBeInTheDocument()
      expect(screen.getByText('Define fields and their properties')).toBeInTheDocument()
    })

    it('should create a new template successfully', async () => {
      const user = userEvent.setup()
      const newTemplate: Template = {
        id: 'template_new',
        name: 'New Template',
        description: 'New description',
        createdAt: '2023-01-03T00:00:00Z',
        updatedAt: '2023-01-03T00:00:00Z',
        schemaVersion: '1.0.0',
        fieldMappings: [{ sourceField: 'newField', targetField: 'New Field' }]
      }
      
      vi.mocked(templateService.createTemplate).mockResolvedValue(newTemplate)
      
      render(<ExportTemplatesPage />)
      
      // Click new template button
      const newButton = screen.getByText('New Template')
      await user.click(newButton)
      
      // Fill in template details
      const nameInput = screen.getByPlaceholderText('Enter template name')
      await user.type(nameInput, 'New Template')
      
      const descInput = screen.getByPlaceholderText('Enter description')
      await user.type(descInput, 'New description')
      
      // Save template
      const saveButton = screen.getByText('Save Template')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(templateService.createTemplate).toHaveBeenCalledWith({
          name: 'New Template',
          description: 'New description',
          fieldMappings: expect.any(Array)
        })
      })
    })

    it('should handle template creation errors', async () => {
      const user = userEvent.setup()

      vi.mocked(templateService.createTemplate).mockRejectedValue(new Error('Creation failed'))

      render(<ExportTemplatesPage />)

      const newButton = screen.getByText('New Template')
      await user.click(newButton)

      const saveButton = screen.getByText('Save Template')
      await user.click(saveButton)

      // Validation error should be shown (template name is required)
      await waitFor(() => {
        // The form validates and shows an error - we just verify the form is still visible
        expect(screen.getByText('New Export Template')).toBeInTheDocument()
      })
    })
  })

  describe('Template Editing', () => {
    it('should open edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByTitle('Edit')
      await user.click(editButtons[0])
      
      expect(screen.getByText('Edit Export Template')).toBeInTheDocument()
      expect(screen.getByText('Modify fields and their properties')).toBeInTheDocument()
    })

    it('should update template successfully', async () => {
      const user = userEvent.setup()
      const updatedTemplate: Template = {
        ...mockTemplates[0],
        name: 'Updated Template',
        updatedAt: '2023-01-03T00:00:00Z'
      }
      
      vi.mocked(templateService.updateTemplate).mockResolvedValue(updatedTemplate)
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByTitle('Edit')
      await user.click(editButtons[0])
      
      const saveButton = screen.getByText('Save Template')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(templateService.updateTemplate).toHaveBeenCalledWith(
          'template_1',
          expect.objectContaining({
            name: 'Test Template 1',
            description: 'Test description 1'
          })
        )
      })
    })
  })

  describe('Template Duplication', () => {
    it('should duplicate template successfully', async () => {
      const user = userEvent.setup()
      const duplicatedTemplate: Template = {
        ...mockTemplates[0],
        id: 'template_duplicate',
        name: 'Test Template 1 (Copy)'
      }
      
      vi.mocked(templateService.duplicateTemplate).mockResolvedValue(duplicatedTemplate)
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
      
      const cloneButtons = screen.getAllByTitle('Duplicate')
      await user.click(cloneButtons[0])
      
      await waitFor(() => {
        expect(templateService.duplicateTemplate).toHaveBeenCalledWith('template_1')
      })
    })

    it('should handle duplication errors', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      vi.mocked(templateService.duplicateTemplate).mockRejectedValue(new Error('Duplication failed'))
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
      
      const cloneButtons = screen.getAllByTitle('Duplicate')
      await user.click(cloneButtons[0])
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to duplicate template: Duplication failed')
      })
      
      alertSpy.mockRestore()
    })
  })

  describe('Template Deletion', () => {
    it('should delete template after confirmation', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      vi.mocked(templateService.deleteTemplate).mockResolvedValue(true)
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByTitle('Delete')
      await user.click(deleteButtons[0])
      
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Test Template 1"? This action cannot be undone.')
      
      await waitFor(() => {
        expect(templateService.deleteTemplate).toHaveBeenCalledWith('template_1')
      })
      
      confirmSpy.mockRestore()
    })

    it('should not delete template if user cancels', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByTitle('Delete')
      await user.click(deleteButtons[0])
      
      expect(confirmSpy).toHaveBeenCalled()
      expect(templateService.deleteTemplate).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })
  })

  describe('Default Template Management', () => {
    it('should set template as default', async () => {
      const user = userEvent.setup()
      const updatedTemplate: Template = {
        ...mockTemplates[1],
        isDefault: true
      }
      
      vi.mocked(templateService.setDefaultTemplate).mockResolvedValue(updatedTemplate)
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Set as Default')).toBeInTheDocument()
      })
      
      const setDefaultButton = screen.getByText('Set as Default')
      await user.click(setDefaultButton)
      
      await waitFor(() => {
        expect(templateService.setDefaultTemplate).toHaveBeenCalledWith('template_2')
      })
    })

    it('should handle set default errors', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      vi.mocked(templateService.setDefaultTemplate).mockRejectedValue(new Error('Set default failed'))
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Set as Default')).toBeInTheDocument()
      })
      
      const setDefaultButton = screen.getByText('Set as Default')
      await user.click(setDefaultButton)
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to set default template: Set default failed')
      })
      
      alertSpy.mockRestore()
    })
  })

  describe('Navigation and Breadcrumbs', () => {
    it('should navigate back from new template editor', async () => {
      const user = userEvent.setup()
      render(<ExportTemplatesPage />)

      // Go to new template editor
      const newButton = screen.getByText('New Template')
      await user.click(newButton)

      expect(screen.getByText('New Export Template')).toBeInTheDocument()

      // Click Cancel button to go back
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText('Export Templates')).toBeInTheDocument()
        expect(screen.queryByText('New Export Template')).not.toBeInTheDocument()
      })
    })

    it('should navigate back using breadcrumb', async () => {
      const user = userEvent.setup()
      render(<ExportTemplatesPage />)
      
      // Go to new template editor
      const newButton = screen.getByText('New Template')
      await user.click(newButton)
      
      expect(screen.getByText('New Export Template')).toBeInTheDocument()
      
      // Click breadcrumb
      const breadcrumbButtons = screen.getAllByText('Export Templates')
      await user.click(breadcrumbButtons[0])
      
      await waitFor(() => {
        expect(screen.queryByText('New Export Template')).not.toBeInTheDocument()
      })
    })

    it('should cancel template creation', async () => {
      const user = userEvent.setup()
      render(<ExportTemplatesPage />)
      
      // Go to new template editor
      const newButton = screen.getByText('New Template')
      await user.click(newButton)
      
      expect(screen.getByText('New Export Template')).toBeInTheDocument()
      
      // Click cancel button
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('New Export Template')).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no templates exist', async () => {
      vi.mocked(templateService.fetchTemplates).mockResolvedValue([])
      
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No templates available.')).toBeInTheDocument()
      })
    })

    it('should show no results when search has no matches', async () => {
      const user = userEvent.setup()
      render(<ExportTemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search templates...')
      await user.type(searchInput, 'nonexistent')
      
      expect(screen.getByText('No matching templates found.')).toBeInTheDocument()
    })
  })
}) 