import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplatesList from '../TemplatesList'
import { Template } from '../../../models/Template'

const mockTemplates: Template[] = [
  {
    id: 'template_1',
    name: 'Bank Statement Export',
    description: 'Template for exporting bank statements',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    schemaVersion: '1.0.0',
    isDefault: true,
    fieldMappings: [
      { sourceField: 'date', targetField: 'Transaction Date' },
      { sourceField: 'amount', targetField: 'Amount' }
    ]
  },
  {
    id: 'template_2',
    name: 'Customer Data Export',
    description: 'Export customer information',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    schemaVersion: '1.0.0',
    isDefault: false,
    fieldMappings: [
      { sourceField: 'customerId', targetField: 'ID' },
      { sourceField: 'name', targetField: 'Full Name' },
      { sourceField: 'email', targetField: 'Email Address' }
    ]
  }
]

const defaultProps = {
  templates: mockTemplates,
  filter: '',
  onEdit: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onSetDefault: vi.fn()
}

describe('TemplatesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Template Display', () => {
    it('should render all templates when no filter is applied', () => {
      render(<TemplatesList {...defaultProps} />)
      
      expect(screen.getByText('Bank Statement Export')).toBeInTheDocument()
      expect(screen.getByText('Customer Data Export')).toBeInTheDocument()
      expect(screen.getByText('Template for exporting bank statements')).toBeInTheDocument()
      expect(screen.getByText('Export customer information')).toBeInTheDocument()
    })

    it('should display correct field counts', () => {
      render(<TemplatesList {...defaultProps} />)
      
      const fieldCounts = screen.getAllByText(/^[0-9]+$/)
      expect(fieldCounts[0]).toHaveTextContent('2') // Bank Statement Export has 2 fields
      expect(fieldCounts[1]).toHaveTextContent('3') // Customer Data Export has 3 fields
    })

    it('should format dates correctly', () => {
      render(<TemplatesList {...defaultProps} />)

      // Check that dates are formatted in a readable format (month, year pattern)
      // Use regex to account for timezone differences
      expect(screen.getByText(/Jan \d{1,2}, 2023/)).toBeInTheDocument()
      expect(screen.getAllByText(/Jan \d{1,2}, 2023/).length).toBeGreaterThanOrEqual(1)
    })

    it('should show correct status for default and non-default templates', () => {
      render(<TemplatesList {...defaultProps} />)
      
      expect(screen.getByText('Default')).toBeInTheDocument()
      expect(screen.getByText('Set as Default')).toBeInTheDocument()
    })
  })

  describe('Template Filtering', () => {
    it('should filter templates by name', () => {
      render(<TemplatesList {...defaultProps} filter="Bank" />)
      
      expect(screen.getByText('Bank Statement Export')).toBeInTheDocument()
      expect(screen.queryByText('Customer Data Export')).not.toBeInTheDocument()
    })

    it('should filter templates by description', () => {
      render(<TemplatesList {...defaultProps} filter="customer" />)
      
      expect(screen.getByText('Customer Data Export')).toBeInTheDocument()
      expect(screen.queryByText('Bank Statement Export')).not.toBeInTheDocument()
    })

    it('should be case insensitive when filtering', () => {
      render(<TemplatesList {...defaultProps} filter="BANK" />)
      
      expect(screen.getByText('Bank Statement Export')).toBeInTheDocument()
      expect(screen.queryByText('Customer Data Export')).not.toBeInTheDocument()
    })

    it('should show no results message when filter matches nothing', () => {
      render(<TemplatesList {...defaultProps} filter="nonexistent" />)
      
      expect(screen.getByText('No matching templates found.')).toBeInTheDocument()
      expect(screen.queryByText('Bank Statement Export')).not.toBeInTheDocument()
      expect(screen.queryByText('Customer Data Export')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no templates exist', () => {
      render(<TemplatesList {...defaultProps} templates={[]} />)
      
      expect(screen.getByText('No templates found. Create your first template to get started.')).toBeInTheDocument()
    })

    it('should show correct column headers', () => {
      render(<TemplatesList {...defaultProps} />)
      
      expect(screen.getByText('Template Name')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Last Modified')).toBeInTheDocument()
      expect(screen.getByText('Fields')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<TemplatesList {...defaultProps} />)
      
      const editButtons = screen.getAllByTitle('Edit')
      await user.click(editButtons[0])
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTemplates[0])
    })

    it('should call onDuplicate when clone button is clicked', async () => {
      const user = userEvent.setup()
      render(<TemplatesList {...defaultProps} />)
      
      const cloneButtons = screen.getAllByTitle('Duplicate')
      await user.click(cloneButtons[0])
      
      expect(defaultProps.onDuplicate).toHaveBeenCalledWith(mockTemplates[0])
    })

    it('should call onDelete when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup()

      render(<TemplatesList {...defaultProps} />)

      const deleteButtons = screen.getAllByTitle('Delete')
      await user.click(deleteButtons[0])

      // Wait for confirm dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Find the confirm button within the dialog (has red styling)
      const dialog = screen.getByRole('dialog')
      const confirmButton = dialog.querySelector('button.bg-red-600') as HTMLButtonElement
      await user.click(confirmButton)

      expect(defaultProps.onDelete).toHaveBeenCalledWith('template_1')
    })

    it('should not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup()

      render(<TemplatesList {...defaultProps} />)

      const deleteButtons = screen.getAllByTitle('Delete')
      await user.click(deleteButtons[0])

      // Wait for confirm dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Find and click cancel button
      const dialog = screen.getByRole('dialog')
      const cancelButton = dialog.querySelector('button.border-neutral-300') as HTMLButtonElement
      await user.click(cancelButton)

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      expect(defaultProps.onDelete).not.toHaveBeenCalled()
    })

    it('should call onSetDefault when "Set as Default" button is clicked', async () => {
      const user = userEvent.setup()
      render(<TemplatesList {...defaultProps} />)
      
      const setDefaultButton = screen.getByText('Set as Default')
      await user.click(setDefaultButton)
      
      expect(defaultProps.onSetDefault).toHaveBeenCalledWith('template_2')
    })

    it('should not show "Set as Default" button for default template', () => {
      render(<TemplatesList {...defaultProps} />)
      
      // Should only have one "Set as Default" button (for the non-default template)
      const setDefaultButtons = screen.getAllByText('Set as Default')
      expect(setDefaultButtons).toHaveLength(1)
      
      // Should have one "Default" badge
      const defaultBadges = screen.getAllByText('Default')
      expect(defaultBadges).toHaveLength(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<TemplatesList {...defaultProps} />)
      
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      
      const headers = screen.getAllByRole('columnheader')
      expect(headers).toHaveLength(6) // 6 columns
      
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(3) // 1 header + 2 data rows
    })

    it('should have accessible button labels', () => {
      render(<TemplatesList {...defaultProps} />)
      
      expect(screen.getAllByTitle('Edit')).toHaveLength(2)
      expect(screen.getAllByTitle('Duplicate')).toHaveLength(2)
      expect(screen.getAllByTitle('Delete')).toHaveLength(2)
    })

    it('should have proper button roles', () => {
      render(<TemplatesList {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      // Check that "Set as Default" is clickable (button element or has role)
      const setDefaultButton = screen.getByText('Set as Default')
      expect(setDefaultButton).toBeInTheDocument()
    })
  })

  describe('Template Status Display', () => {
    it('should apply correct CSS classes to default badge', () => {
      render(<TemplatesList {...defaultProps} />)

      const defaultBadge = screen.getByText('Default')
      // Now using Tailwind classes
      expect(defaultBadge).toHaveClass('bg-green-100')
    })

    it('should apply correct CSS classes to set default button', () => {
      render(<TemplatesList {...defaultProps} />)

      const setDefaultButton = screen.getByText('Set as Default')
      // Now using Tailwind classes
      expect(setDefaultButton).toHaveClass('text-blue-600')
    })
  })

  describe('Edge Cases', () => {
    it('should handle templates with empty descriptions', () => {
      const templatesWithEmptyDesc = [
        {
          ...mockTemplates[0],
          description: ''
        }
      ]
      
      render(<TemplatesList {...defaultProps} templates={templatesWithEmptyDesc} />)
      
      expect(screen.getByText('Bank Statement Export')).toBeInTheDocument()
    })

    it('should handle templates with no field mappings', () => {
      const templatesWithNoFields = [
        {
          ...mockTemplates[0],
          fieldMappings: []
        }
      ]
      
      render(<TemplatesList {...defaultProps} templates={templatesWithNoFields} />)
      
      expect(screen.getByText('0')).toBeInTheDocument() // Field count should be 0
    })

    it('should handle invalid date strings gracefully', () => {
      const templatesWithInvalidDate = [
        {
          ...mockTemplates[0],
          updatedAt: 'invalid-date'
        }
      ]
      
      render(<TemplatesList {...defaultProps} templates={templatesWithInvalidDate} />)
      
      // Should not crash and should still render the template
      expect(screen.getByText('Bank Statement Export')).toBeInTheDocument()
    })

    it('should handle very long template names', () => {
      const templatesWithLongName = [
        {
          ...mockTemplates[0],
          name: 'A'.repeat(200) // Very long name
        }
      ]
      
      render(<TemplatesList {...defaultProps} templates={templatesWithLongName} />)
      
      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
    })
  })
}) 