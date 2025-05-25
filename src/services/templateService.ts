import { Template, FieldMapping } from '../models/Template';
import { 
  loadTemplatesFromStorage, 
  saveTemplatesToStorage, 
  generateTemplateId, 
  getCurrentTimestamp 
} from './localStorageService';
import { validateTemplate, validateTemplateUpdate } from './templateValidation';

const CURRENT_SCHEMA_VERSION = '1.0.0';

// Mock data for initial templates (will be used if no templates exist in storage)
const initialMockTemplates: Template[] = [
  {
    id: 'template_1690000000000_abc123def',
    name: 'Bank Statement Export',
    description: 'Template for exporting bank statements to JSON',
    createdAt: '2023-07-15T10:30:00Z',
    updatedAt: '2023-08-20T14:15:00Z',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    isDefault: true,
    fieldMappings: [
      { sourceField: 'date', targetField: 'Transaction Date' },
      { sourceField: 'amount', targetField: 'Amount' },
      { sourceField: 'description', targetField: 'Description' },
    ],
  },
  {
    id: 'template_1690000000001_def456ghi',
    name: 'Customer Data Export',
    description: 'Export customer information for CRM',
    createdAt: '2023-06-10T08:45:00Z',
    updatedAt: '2023-06-10T08:45:00Z',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    fieldMappings: [
      { sourceField: 'customerId', targetField: 'ID' },
      { sourceField: 'name', targetField: 'Full Name' },
      { sourceField: 'email', targetField: 'Email Address' },
    ],
  },
  {
    id: 'template_1690000000002_ghi789jkl',
    name: 'Financial Report',
    description: 'Monthly financial report template',
    createdAt: '2023-05-05T16:20:00Z',
    updatedAt: '2023-09-01T11:10:00Z',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    fieldMappings: [
      { sourceField: 'month', targetField: 'Reporting Period' },
      { sourceField: 'revenue', targetField: 'Total Revenue' },
      { sourceField: 'expenses', targetField: 'Total Expenses' },
    ],
  },
];

/**
 * Initialize storage with mock data if empty
 */
const initializeStorageIfEmpty = (): void => {
  const existingTemplates = loadTemplatesFromStorage();
  if (existingTemplates.length === 0) {
    saveTemplatesToStorage(initialMockTemplates);
  }
};

/**
 * Fetch all templates
 */
export const fetchTemplates = (): Promise<Template[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      initializeStorageIfEmpty();
      const templates = loadTemplatesFromStorage();
      resolve(templates);
    }, 500);
  });
};

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): Promise<Template | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const templates = loadTemplatesFromStorage();
      const template = templates.find(t => t.id === id);
      resolve(template);
    }, 300);
  });
};

/**
 * Create a new template
 */
export const createTemplate = (templateData: {
  name: string;
  description: string;
  fieldMappings: FieldMapping[];
}): Promise<Template> => {
  return new Promise((resolve, reject) => {
    try {
      // Validate template data
      const validationData = {
        name: templateData.name,
        description: templateData.description,
        fieldMappings: templateData.fieldMappings,
      };
      
      const validation = validateTemplate(validationData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const now = getCurrentTimestamp();
      const newTemplate: Template = {
        id: generateTemplateId(),
        name: templateData.name.trim(),
        description: templateData.description.trim(),
        createdAt: now,
        updatedAt: now,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        fieldMappings: templateData.fieldMappings,
      };

      const existingTemplates = loadTemplatesFromStorage();
      const updatedTemplates = [newTemplate, ...existingTemplates];
      saveTemplatesToStorage(updatedTemplates);

      setTimeout(() => {
        resolve(newTemplate);
      }, 300);
    } catch (error) {
      setTimeout(() => {
        reject(error);
      }, 300);
    }
  });
};

/**
 * Update an existing template
 */
export const updateTemplate = (id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>): Promise<Template> => {
  return new Promise((resolve, reject) => {
    try {
      const templates = loadTemplatesFromStorage();
      const templateIndex = templates.findIndex(t => t.id === id);
      
      if (templateIndex === -1) {
        throw new Error(`Template with id ${id} not found`);
      }

      // Validate updates
      const validation = validateTemplateUpdate(updates);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Trim string fields if they exist in updates
      const cleanedUpdates = { ...updates };
      if (cleanedUpdates.name) {
        cleanedUpdates.name = cleanedUpdates.name.trim();
      }
      if (cleanedUpdates.description) {
        cleanedUpdates.description = cleanedUpdates.description.trim();
      }

      const updatedTemplate: Template = {
        ...templates[templateIndex],
        ...cleanedUpdates,
        updatedAt: getCurrentTimestamp(),
        schemaVersion: CURRENT_SCHEMA_VERSION, // Always update to current schema version
      };

      templates[templateIndex] = updatedTemplate;
      saveTemplatesToStorage(templates);

      setTimeout(() => {
        resolve(updatedTemplate);
      }, 300);
    } catch (error) {
      setTimeout(() => {
        reject(error);
      }, 300);
    }
  });
};

/**
 * Delete a template
 */
export const deleteTemplate = (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const templates = loadTemplatesFromStorage();
      const filteredTemplates = templates.filter(t => t.id !== id);
      
      if (filteredTemplates.length === templates.length) {
        throw new Error(`Template with id ${id} not found`);
      }

      saveTemplatesToStorage(filteredTemplates);

      setTimeout(() => {
        resolve(true);
      }, 300);
    } catch (error) {
      setTimeout(() => {
        reject(error);
      }, 300);
    }
  });
};

/**
 * Duplicate a template
 */
export const duplicateTemplate = (id: string): Promise<Template> => {
  return new Promise((resolve, reject) => {
    try {
      const templates = loadTemplatesFromStorage();
      const originalTemplate = templates.find(t => t.id === id);
      
      if (!originalTemplate) {
        throw new Error(`Template with id ${id} not found`);
      }

      const now = getCurrentTimestamp();
      const duplicatedTemplate: Template = {
        ...originalTemplate,
        id: generateTemplateId(),
        name: `${originalTemplate.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        isDefault: false, // Duplicated templates are never default
      };

      const updatedTemplates = [duplicatedTemplate, ...templates];
      saveTemplatesToStorage(updatedTemplates);

      setTimeout(() => {
        resolve(duplicatedTemplate);
      }, 300);
    } catch (error) {
      setTimeout(() => {
        reject(error);
      }, 300);
    }
  });
};

/**
 * Set a template as default (and unset all others)
 */
export const setDefaultTemplate = (id: string): Promise<Template> => {
  return new Promise((resolve, reject) => {
    try {
      const templates = loadTemplatesFromStorage();
      const templateIndex = templates.findIndex(t => t.id === id);
      
      if (templateIndex === -1) {
        throw new Error(`Template with id ${id} not found`);
      }

      // Unset all other templates as default
      const updatedTemplates = templates.map(template => ({
        ...template,
        isDefault: template.id === id,
        updatedAt: template.id === id ? getCurrentTimestamp() : template.updatedAt,
      }));

      saveTemplatesToStorage(updatedTemplates);

      setTimeout(() => {
        resolve(updatedTemplates[templateIndex]);
      }, 300);
    } catch (error) {
      setTimeout(() => {
        reject(error);
      }, 300);
    }
  });
};

/**
 * Get the default template
 */
export const getDefaultTemplate = (): Promise<Template | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const templates = loadTemplatesFromStorage();
      const defaultTemplate = templates.find(t => t.isDefault === true);
      resolve(defaultTemplate);
    }, 300);
  });
}; 