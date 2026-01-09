import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadImportTemplatesFromStorage,
  saveImportTemplatesToStorage,
  fetchImportTemplates,
  getImportTemplateById,
  createImportTemplate,
  updateImportTemplate,
  deleteImportTemplate,
  duplicateImportTemplate,
  StoredImportTemplatesData
} from '../importTemplateService'
import { ImportTemplate, ImportFieldMapping, FieldCombination } from '../../models/ImportTemplate'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get store() {
      return store
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const STORAGE_KEY = 'bankbridge_import_templates'

// Helper to create a valid template for testing
const createMockTemplate = (overrides: Partial<ImportTemplate> = {}): ImportTemplate => ({
  id: 'import_template_test_123',
  name: 'Test Template',
  description: 'Test description',
  account: 'TD Bank - Checking',
  accountId: 'acc_1',
  fileType: 'CSV File',
  fieldCount: 2,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  schemaVersion: '1.0.0',
  status: 'Active',
  fieldMappings: [
    { sourceField: 'date', targetField: 'Date', dataType: 'Date', required: false, validation: '' },
    { sourceField: 'amount', targetField: 'Amount', dataType: 'Currency', required: false, validation: '' }
  ],
  fieldCombinations: [],
  sourceFields: ['date', 'amount', 'description', 'category', 'memo'],
  ...overrides
})

const createStoredData = (templates: ImportTemplate[]): StoredImportTemplatesData => ({
  templates,
  lastUpdated: new Date().toISOString(),
  schemaVersion: '1.0.0'
})

describe('importTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('loadImportTemplatesFromStorage', () => {
    it('should return empty array when no data in storage', () => {
      const result = loadImportTemplatesFromStorage()
      expect(result).toEqual([])
    })

    it('should return templates from storage', () => {
      const templates = [createMockTemplate()]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const result = loadImportTemplatesFromStorage()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Template')
    })

    it('should preserve sourceFields when loading', () => {
      const templates = [createMockTemplate({
        sourceFields: ['field1', 'field2', 'field3', 'field4', 'field5']
      })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const result = loadImportTemplatesFromStorage()
      expect(result[0].sourceFields).toEqual(['field1', 'field2', 'field3', 'field4', 'field5'])
    })

    it('should handle corrupted JSON gracefully', () => {
      localStorageMock.setItem(STORAGE_KEY, 'not valid json')

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = loadImportTemplatesFromStorage()

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should warn about schema version mismatch', () => {
      const templates = [createMockTemplate()]
      const storedData = createStoredData(templates)
      storedData.schemaVersion = '0.9.0'
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData))

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      loadImportTemplatesFromStorage()

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('schema version mismatch'))
      consoleSpy.mockRestore()
    })
  })

  describe('saveImportTemplatesToStorage', () => {
    it('should save templates to storage', () => {
      const templates = [createMockTemplate()]
      saveImportTemplatesToStorage(templates)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      )

      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY])
      expect(saved.templates).toHaveLength(1)
      expect(saved.schemaVersion).toBe('1.0.0')
    })

    it('should preserve sourceFields when saving', () => {
      const templates = [createMockTemplate({
        sourceFields: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      })]
      saveImportTemplatesToStorage(templates)

      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY])
      expect(saved.templates[0].sourceFields).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    })
  })

  describe('fetchImportTemplates', () => {
    it('should return templates after delay', async () => {
      const templates = [createMockTemplate()]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = fetchImportTemplates()
      vi.advanceTimersByTime(500)
      const result = await promise

      expect(result).toHaveLength(1)
    })
  })

  describe('getImportTemplateById', () => {
    it('should return template by id', async () => {
      const templates = [
        createMockTemplate({ id: 'template_1', name: 'Template 1' }),
        createMockTemplate({ id: 'template_2', name: 'Template 2' })
      ]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = getImportTemplateById('template_2')
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result?.name).toBe('Template 2')
    })

    it('should return undefined for non-existent id', async () => {
      const templates = [createMockTemplate({ id: 'template_1' })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = getImportTemplateById('non_existent')
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result).toBeUndefined()
    })
  })

  describe('createImportTemplate', () => {
    it('should create a new template with generated id', async () => {
      const templateData = {
        name: 'New Template',
        description: 'Description',
        account: 'TD Bank - Checking',
        accountId: 'acc_1',
        fileType: 'CSV File',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Date', dataType: 'Date', required: false, validation: '' }
        ] as ImportFieldMapping[]
      }

      const promise = createImportTemplate(templateData)
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.id).toMatch(/^import_template_\d+_[a-z0-9]+$/)
      expect(result.name).toBe('New Template')
      expect(result.accountId).toBe('acc_1')
    })

    it('should persist sourceFields when creating template', async () => {
      const sourceFields = ['date', 'amount', 'description', 'category', 'memo', 'reference', 'balance']
      const templateData = {
        name: 'Template With Source Fields',
        account: 'TD Bank - Checking',
        accountId: 'acc_1',
        fileType: 'CSV File',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Date', dataType: 'Date', required: false, validation: '' },
          { sourceField: 'amount', targetField: 'Amount', dataType: 'Currency', required: false, validation: '' }
        ] as ImportFieldMapping[],
        sourceFields
      }

      const promise = createImportTemplate(templateData)
      vi.advanceTimersByTime(300)
      const result = await promise

      // Verify sourceFields is saved in the returned template
      expect(result.sourceFields).toEqual(sourceFields)

      // Verify sourceFields is persisted to storage
      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY])
      expect(saved.templates[0].sourceFields).toEqual(sourceFields)
    })

    it('should persist fieldCombinations when creating template', async () => {
      const fieldCombinations: FieldCombination[] = [
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
      const templateData = {
        name: 'Template With Combinations',
        account: 'TD Bank - Checking',
        accountId: 'acc_1',
        fileType: 'CSV File',
        fieldMappings: [
          { sourceField: 'email', targetField: 'Email', dataType: 'Text', required: false, validation: '' }
        ] as ImportFieldMapping[],
        fieldCombinations
      }

      const promise = createImportTemplate(templateData)
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.fieldCombinations).toEqual(fieldCombinations)
    })

    it('should reject when name is missing', async () => {
      const templateData = {
        name: '',
        account: 'TD Bank - Checking',
        fileType: 'CSV File',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Date', dataType: 'Date', required: false, validation: '' }
        ] as ImportFieldMapping[]
      }

      const promise = createImportTemplate(templateData)
      vi.advanceTimersByTime(300)

      await expect(promise).rejects.toThrow('Template name is required')
    })

    it('should reject when fieldMappings is empty', async () => {
      const templateData = {
        name: 'Test Template',
        account: 'TD Bank - Checking',
        fileType: 'CSV File',
        fieldMappings: [] as ImportFieldMapping[]
      }

      const promise = createImportTemplate(templateData)
      vi.advanceTimersByTime(300)

      await expect(promise).rejects.toThrow('At least one field mapping is required')
    })

    it('should add new template to beginning of list', async () => {
      // Create first template
      const existingTemplate = createMockTemplate({ id: 'existing_1', name: 'Existing' })
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData([existingTemplate])))

      const templateData = {
        name: 'New Template',
        account: 'TD Bank - Checking',
        fileType: 'CSV File',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Date', dataType: 'Date', required: false, validation: '' }
        ] as ImportFieldMapping[]
      }

      const promise = createImportTemplate(templateData)
      vi.advanceTimersByTime(300)
      await promise

      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY])
      expect(saved.templates[0].name).toBe('New Template')
      expect(saved.templates[1].name).toBe('Existing')
    })
  })

  describe('updateImportTemplate', () => {
    it('should update existing template', async () => {
      const templates = [createMockTemplate({ id: 'template_1', name: 'Original Name' })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = updateImportTemplate('template_1', { name: 'Updated Name' })
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.name).toBe('Updated Name')
      expect(result.id).toBe('template_1')
    })

    it('should preserve and update sourceFields', async () => {
      const originalSourceFields = ['a', 'b', 'c', 'd', 'e']
      const templates = [createMockTemplate({
        id: 'template_1',
        sourceFields: originalSourceFields
      })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      // Update with new sourceFields
      const newSourceFields = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      const promise = updateImportTemplate('template_1', { sourceFields: newSourceFields })
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.sourceFields).toEqual(newSourceFields)

      // Verify persisted
      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY])
      expect(saved.templates[0].sourceFields).toEqual(newSourceFields)
    })

    it('should preserve sourceFields when updating other fields', async () => {
      const sourceFields = ['field1', 'field2', 'field3', 'field4', 'field5']
      const templates = [createMockTemplate({
        id: 'template_1',
        name: 'Original',
        sourceFields
      })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      // Update only the name, not sourceFields
      const promise = updateImportTemplate('template_1', { name: 'Updated' })
      vi.advanceTimersByTime(300)
      const result = await promise

      // sourceFields should be preserved
      expect(result.sourceFields).toEqual(sourceFields)
      expect(result.name).toBe('Updated')
    })

    it('should update updatedAt timestamp', async () => {
      const templates = [createMockTemplate({ id: 'template_1' })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      vi.setSystemTime(new Date('2025-06-15T10:00:00.000Z'))

      const promise = updateImportTemplate('template_1', { name: 'Updated' })
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.updatedAt).toBe('2025-06-15T10:00:00.000Z')
    })

    it('should reject when template not found', async () => {
      const templates = [createMockTemplate({ id: 'template_1' })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = updateImportTemplate('non_existent', { name: 'Updated' })
      vi.advanceTimersByTime(300)

      await expect(promise).rejects.toThrow('Import template with id non_existent not found')
    })
  })

  describe('deleteImportTemplate', () => {
    it('should delete template by id', async () => {
      const templates = [
        createMockTemplate({ id: 'template_1', name: 'Template 1' }),
        createMockTemplate({ id: 'template_2', name: 'Template 2' })
      ]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = deleteImportTemplate('template_1')
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result).toBe(true)

      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY])
      expect(saved.templates).toHaveLength(1)
      expect(saved.templates[0].id).toBe('template_2')
    })

    it('should reject when template not found', async () => {
      const templates = [createMockTemplate({ id: 'template_1' })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = deleteImportTemplate('non_existent')
      vi.advanceTimersByTime(300)

      await expect(promise).rejects.toThrow('Import template with id non_existent not found')
    })
  })

  describe('duplicateImportTemplate', () => {
    it('should duplicate template with new id and name', async () => {
      const templates = [createMockTemplate({
        id: 'template_1',
        name: 'Original Template',
        sourceFields: ['a', 'b', 'c', 'd', 'e']
      })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = duplicateImportTemplate('template_1')
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.id).not.toBe('template_1')
      expect(result.name).toBe('Original Template (Copy)')
      expect(result.isDefault).toBe(false)
    })

    it('should preserve sourceFields when duplicating', async () => {
      const sourceFields = ['field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'field7']
      const templates = [createMockTemplate({
        id: 'template_1',
        sourceFields
      })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = duplicateImportTemplate('template_1')
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.sourceFields).toEqual(sourceFields)
    })

    it('should preserve accountId when duplicating', async () => {
      const templates = [createMockTemplate({
        id: 'template_1',
        accountId: 'acc_123'
      })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = duplicateImportTemplate('template_1')
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.accountId).toBe('acc_123')
    })

    it('should preserve fieldCombinations when duplicating', async () => {
      const fieldCombinations: FieldCombination[] = [
        {
          id: 'combo_1',
          targetField: 'Full Name',
          delimiter: 'Space',
          sourceFields: [
            { id: 'sf_1', fieldName: 'first', order: 1 },
            { id: 'sf_2', fieldName: 'last', order: 2 }
          ]
        }
      ]
      const templates = [createMockTemplate({
        id: 'template_1',
        fieldCombinations
      })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = duplicateImportTemplate('template_1')
      vi.advanceTimersByTime(300)
      const result = await promise

      expect(result.fieldCombinations).toEqual(fieldCombinations)
    })

    it('should reject when template not found', async () => {
      const templates = [createMockTemplate({ id: 'template_1' })]
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(createStoredData(templates)))

      const promise = duplicateImportTemplate('non_existent')
      vi.advanceTimersByTime(300)

      await expect(promise).rejects.toThrow('Import template with id non_existent not found')
    })
  })

  describe('Round-trip persistence', () => {
    it('should preserve all fields through create → load → update cycle', async () => {
      const sourceFields = ['date', 'amount', 'description', 'category', 'memo', 'reference', 'balance']
      const fieldCombinations: FieldCombination[] = [
        {
          id: 'combo_1',
          targetField: 'Full Description',
          delimiter: ' - ',
          sourceFields: [
            { id: 'sf_1', fieldName: 'description', order: 1 },
            { id: 'sf_2', fieldName: 'memo', order: 2 }
          ]
        }
      ]

      // Create template with only 2 of 7 fields mapped
      const createData = {
        name: 'Partial Mapping Template',
        account: 'TD Bank - Checking',
        accountId: 'acc_1',
        fileType: 'CSV File',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Date', dataType: 'Date', required: false, validation: '' },
          { sourceField: 'amount', targetField: 'Amount', dataType: 'Currency', required: false, validation: '' }
        ] as ImportFieldMapping[],
        sourceFields,
        fieldCombinations
      }

      // Create
      const createPromise = createImportTemplate(createData)
      vi.advanceTimersByTime(300)
      const created = await createPromise

      expect(created.sourceFields).toEqual(sourceFields)
      expect(created.fieldCombinations).toEqual(fieldCombinations)

      // Load
      const loadPromise = getImportTemplateById(created.id)
      vi.advanceTimersByTime(300)
      const loaded = await loadPromise

      expect(loaded?.sourceFields).toEqual(sourceFields)
      expect(loaded?.fieldCombinations).toEqual(fieldCombinations)

      // Update (add one more field mapping)
      const newFieldMappings = [
        ...createData.fieldMappings,
        { sourceField: 'category', targetField: 'Category', dataType: 'Text', required: false, validation: '' }
      ]

      const updatePromise = updateImportTemplate(created.id, {
        fieldMappings: newFieldMappings as ImportFieldMapping[],
        fieldCount: 3
      })
      vi.advanceTimersByTime(300)
      const updated = await updatePromise

      // sourceFields should still be preserved (all 7 original fields)
      expect(updated.sourceFields).toEqual(sourceFields)
      expect(updated.fieldMappings).toHaveLength(3)
      expect(updated.fieldCombinations).toEqual(fieldCombinations)
    })

    it('should allow adding unmapped fields back after editing', async () => {
      // This simulates the user's bug scenario:
      // 1. Upload file with 7 fields
      // 2. Map only 3 fields
      // 3. Save template
      // 4. Edit template - should still have access to all 7 source fields

      const allSourceFields = ['date', 'amount', 'description', 'category', 'memo', 'reference', 'balance']

      // Create with only 3 mapped
      const createData = {
        name: 'Three Field Template',
        account: 'Chase - Checking',
        accountId: 'acc_2',
        fileType: 'CSV File',
        fieldMappings: [
          { sourceField: 'date', targetField: 'Date', dataType: 'Date', required: false, validation: '' },
          { sourceField: 'amount', targetField: 'Amount', dataType: 'Currency', required: false, validation: '' },
          { sourceField: 'description', targetField: 'Merchant', dataType: 'Text', required: false, validation: '' }
        ] as ImportFieldMapping[],
        sourceFields: allSourceFields
      }

      const createPromise = createImportTemplate(createData)
      vi.advanceTimersByTime(300)
      const created = await createPromise

      // Simulate loading for edit
      const loadPromise = getImportTemplateById(created.id)
      vi.advanceTimersByTime(300)
      const loaded = await loadPromise

      // All 7 source fields should still be available
      expect(loaded?.sourceFields).toHaveLength(7)
      expect(loaded?.sourceFields).toContain('category')
      expect(loaded?.sourceFields).toContain('memo')
      expect(loaded?.sourceFields).toContain('reference')
      expect(loaded?.sourceFields).toContain('balance')

      // Only 3 are mapped
      expect(loaded?.fieldMappings).toHaveLength(3)

      // Calculate unmapped fields (this is what Add Field dropdown should show)
      const mappedFields = loaded?.fieldMappings.map(fm => fm.sourceField) || []
      const unmappedFields = loaded?.sourceFields?.filter(sf => !mappedFields.includes(sf)) || []

      expect(unmappedFields).toHaveLength(4)
      expect(unmappedFields).toContain('category')
      expect(unmappedFields).toContain('memo')
      expect(unmappedFields).toContain('reference')
      expect(unmappedFields).toContain('balance')
    })
  })
})
