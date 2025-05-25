import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  fetchTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate, 
  duplicateTemplate,
  setDefaultTemplate,
  getDefaultTemplate,
  getTemplateById
} from '../templateService'
import * as localStorageService from '../localStorageService'
import { Template } from '../../models/Template'

// Mock the localStorage service
vi.mock('../localStorageService')

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

describe('templateService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(localStorageService.loadTemplatesFromStorage).mockReturnValue(mockTemplates)
    vi.mocked(localStorageService.generateTemplateId).mockReturnValue('template_new_123')
    vi.mocked(localStorageService.getCurrentTimestamp).mockReturnValue('2023-01-03T00:00:00Z')
  })

  describe('fetchTemplates', () => {
    it('should return templates from storage', async () => {
      const templates = await fetchTemplates()
      
      expect(templates).toEqual(mockTemplates)
      expect(localStorageService.loadTemplatesFromStorage).toHaveBeenCalled()
    })

    it('should initialize storage with mock data if empty', async () => {
      vi.mocked(localStorageService.loadTemplatesFromStorage)
        .mockReturnValueOnce([]) // First call returns empty
        .mockReturnValueOnce(mockTemplates) // Second call returns mock data
      
      const templates = await fetchTemplates()
      
      expect(localStorageService.saveTemplatesToStorage).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Bank Statement Export' })
        ])
      )
    })
  })

  describe('getTemplateById', () => {
    it('should return template by ID', async () => {
      const template = await getTemplateById('template_1')
      
      expect(template).toEqual(mockTemplates[0])
    })

    it('should return undefined for non-existent ID', async () => {
      const template = await getTemplateById('nonexistent')
      
      expect(template).toBeUndefined()
    })
  })

  describe('createTemplate', () => {
    const validTemplateData = {
      name: 'New Template',
      description: 'New description',
      fieldMappings: [
        { sourceField: 'newField', targetField: 'New Field' }
      ]
    }

    it('should create a new template successfully', async () => {
      const template = await createTemplate(validTemplateData)
      
      expect(template).toEqual({
        id: 'template_new_123',
        name: 'New Template',
        description: 'New description',
        createdAt: '2023-01-03T00:00:00Z',
        updatedAt: '2023-01-03T00:00:00Z',
        schemaVersion: '1.0.0',
        fieldMappings: validTemplateData.fieldMappings
      })
      
      expect(localStorageService.saveTemplatesToStorage).toHaveBeenCalledWith([
        template,
        ...mockTemplates
      ])
    })

    it('should validate template data before creation', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'Test',
        fieldMappings: []
      }
      
      await expect(createTemplate(invalidData)).rejects.toThrow('Validation failed')
    })

    it('should trim whitespace from name and description', async () => {
      const dataWithWhitespace = {
        name: '  Trimmed Name  ',
        description: '  Trimmed Description  ',
        fieldMappings: validTemplateData.fieldMappings
      }
      
      const template = await createTemplate(dataWithWhitespace)
      
      expect(template.name).toBe('Trimmed Name')
      expect(template.description).toBe('Trimmed Description')
    })
  })

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description'
      }
      
      const updatedTemplate = await updateTemplate('template_1', updates)
      
      expect(updatedTemplate).toEqual({
        ...mockTemplates[0],
        ...updates,
        updatedAt: '2023-01-03T00:00:00Z',
        schemaVersion: '1.0.0'
      })
      
      expect(localStorageService.saveTemplatesToStorage).toHaveBeenCalled()
    })

    it('should throw error for non-existent template', async () => {
      await expect(updateTemplate('nonexistent', { name: 'Test' }))
        .rejects.toThrow('Template with id nonexistent not found')
    })

    it('should validate updates before applying', async () => {
      const invalidUpdates = {
        name: '' // Invalid: empty name
      }
      
      await expect(updateTemplate('template_1', invalidUpdates))
        .rejects.toThrow('Validation failed')
    })

    it('should trim whitespace from updated fields', async () => {
      const updates = {
        name: '  Trimmed Updated Name  ',
        description: '  Trimmed Updated Description  '
      }
      
      const updatedTemplate = await updateTemplate('template_1', updates)
      
      expect(updatedTemplate.name).toBe('Trimmed Updated Name')
      expect(updatedTemplate.description).toBe('Trimmed Updated Description')
    })
  })

  describe('deleteTemplate', () => {
    it('should delete an existing template', async () => {
      const result = await deleteTemplate('template_1')
      
      expect(result).toBe(true)
      expect(localStorageService.saveTemplatesToStorage).toHaveBeenCalledWith([
        mockTemplates[1] // Only template_2 should remain
      ])
    })

    it('should throw error for non-existent template', async () => {
      await expect(deleteTemplate('nonexistent'))
        .rejects.toThrow('Template with id nonexistent not found')
    })
  })

  describe('duplicateTemplate', () => {
    it('should duplicate an existing template', async () => {
      const duplicatedTemplate = await duplicateTemplate('template_1')
      
      expect(duplicatedTemplate).toEqual({
        ...mockTemplates[0],
        id: 'template_new_123',
        name: 'Test Template 1 (Copy)',
        createdAt: '2023-01-03T00:00:00Z',
        updatedAt: '2023-01-03T00:00:00Z',
        schemaVersion: '1.0.0',
        isDefault: false
      })
      
      expect(localStorageService.saveTemplatesToStorage).toHaveBeenCalledWith([
        duplicatedTemplate,
        ...mockTemplates
      ])
    })

    it('should throw error for non-existent template', async () => {
      await expect(duplicateTemplate('nonexistent'))
        .rejects.toThrow('Template with id nonexistent not found')
    })

    it('should ensure duplicated template is not default', async () => {
      const duplicatedTemplate = await duplicateTemplate('template_1')
      
      expect(duplicatedTemplate.isDefault).toBe(false)
    })
  })

  describe('setDefaultTemplate', () => {
    it('should set a template as default and unset others', async () => {
      const updatedTemplate = await setDefaultTemplate('template_2')
      
      expect(updatedTemplate.isDefault).toBe(true)
      
      const expectedTemplates = [
        { ...mockTemplates[0], isDefault: false },
        { ...mockTemplates[1], isDefault: true, updatedAt: '2023-01-03T00:00:00Z' }
      ]
      
      expect(localStorageService.saveTemplatesToStorage).toHaveBeenCalledWith(expectedTemplates)
    })

    it('should throw error for non-existent template', async () => {
      await expect(setDefaultTemplate('nonexistent'))
        .rejects.toThrow('Template with id nonexistent not found')
    })

    it('should update timestamp only for the template being set as default', async () => {
      await setDefaultTemplate('template_2')
      
      const savedTemplates = vi.mocked(localStorageService.saveTemplatesToStorage).mock.calls[0][0]
      
      // Template 1 should keep original timestamp
      expect(savedTemplates[0].updatedAt).toBe('2023-01-01T00:00:00Z')
      // Template 2 should have new timestamp
      expect(savedTemplates[1].updatedAt).toBe('2023-01-03T00:00:00Z')
    })
  })

  describe('getDefaultTemplate', () => {
    it('should return the default template', async () => {
      const defaultTemplate = await getDefaultTemplate()
      
      expect(defaultTemplate).toEqual(mockTemplates[0])
    })

    it('should return undefined if no default template exists', async () => {
      const templatesWithoutDefault = mockTemplates.map(t => ({ ...t, isDefault: false }))
      vi.mocked(localStorageService.loadTemplatesFromStorage).mockReturnValue(templatesWithoutDefault)
      
      const defaultTemplate = await getDefaultTemplate()
      
      expect(defaultTemplate).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      vi.mocked(localStorageService.loadTemplatesFromStorage).mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      await expect(deleteTemplate('template_1')).rejects.toThrow('Storage error')
    })

    it('should handle save errors gracefully', async () => {
      vi.mocked(localStorageService.saveTemplatesToStorage).mockImplementation(() => {
        throw new Error('Save error')
      })
      
      const validTemplateData = {
        name: 'Test Template',
        description: 'Test Description',
        fieldMappings: [{ sourceField: 'test', targetField: 'Test' }]
      }
      
      await expect(createTemplate(validTemplateData)).rejects.toThrow('Save error')
    })
  })

  describe('Schema Version Management', () => {
    it('should set current schema version on new templates', async () => {
      const validTemplateData = {
        name: 'Test Template',
        description: 'Test Description',
        fieldMappings: [{ sourceField: 'test', targetField: 'Test' }]
      }
      
      const template = await createTemplate(validTemplateData)
      
      expect(template.schemaVersion).toBe('1.0.0')
    })

    it('should update schema version on template updates', async () => {
      const updatedTemplate = await updateTemplate('template_1', { name: 'Updated' })
      
      expect(updatedTemplate.schemaVersion).toBe('1.0.0')
    })

    it('should set current schema version on duplicated templates', async () => {
      const duplicatedTemplate = await duplicateTemplate('template_1')
      
      expect(duplicatedTemplate.schemaVersion).toBe('1.0.0')
    })
  })
}) 