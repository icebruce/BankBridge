import { ImportTemplate, ImportFieldMapping, FieldCombination } from '../models/ImportTemplate';

const IMPORT_TEMPLATES_STORAGE_KEY = 'bankbridge_import_templates';
const CURRENT_SCHEMA_VERSION = '1.0.0';

export interface StoredImportTemplatesData {
  templates: ImportTemplate[];
  lastUpdated: string;
  schemaVersion: string;
}

/**
 * Generate a unique template ID
 */
const generateImportTemplateId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `import_template_${timestamp}_${random}`;
};

/**
 * Get current timestamp in ISO format
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Load import templates from local storage
 */
export const loadImportTemplatesFromStorage = (): ImportTemplate[] => {
  try {
    const stored = localStorage.getItem(IMPORT_TEMPLATES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const data: StoredImportTemplatesData = JSON.parse(stored);
    
    // Check schema version compatibility
    if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      console.warn(`Import template schema version mismatch. Expected ${CURRENT_SCHEMA_VERSION}, found ${data.schemaVersion}`);
    }

    return data.templates || [];
  } catch (error) {
    console.error('Error loading import templates from storage:', error);
    return [];
  }
};

/**
 * Save import templates to local storage
 */
export const saveImportTemplatesToStorage = (templates: ImportTemplate[]): void => {
  try {
    const data: StoredImportTemplatesData = {
      templates,
      lastUpdated: getCurrentTimestamp(),
      schemaVersion: CURRENT_SCHEMA_VERSION
    };

    localStorage.setItem(IMPORT_TEMPLATES_STORAGE_KEY, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving import templates to storage:', error);
    throw new Error('Failed to save import templates. Storage might be full.');
  }
};

/**
 * Fetch all import templates
 */
export const fetchImportTemplates = (): Promise<ImportTemplate[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const templates = loadImportTemplatesFromStorage();
      resolve(templates);
    }, 500);
  });
};

/**
 * Get import template by ID
 */
export const getImportTemplateById = (id: string): Promise<ImportTemplate | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const templates = loadImportTemplatesFromStorage();
      const template = templates.find(t => t.id === id);
      resolve(template);
    }, 300);
  });
};

/**
 * Create a new import template
 */
export const createImportTemplate = (templateData: {
  name: string;
  description?: string;
  account: string;
  accountId?: string;
  fileType: string;
  status?: 'Active' | 'Inactive' | 'Draft';
  fieldMappings: ImportFieldMapping[];
  fieldCombinations?: FieldCombination[];
  sourceFields?: string[];
}): Promise<ImportTemplate> => {
  return new Promise((resolve, reject) => {
    try {
      // Basic validation
      if (!templateData.name || !templateData.name.trim()) {
        throw new Error('Template name is required');
      }

      if (!templateData.fieldMappings || templateData.fieldMappings.length === 0) {
        throw new Error('At least one field mapping is required');
      }

      const now = getCurrentTimestamp();
      const newTemplate: ImportTemplate = {
        id: generateImportTemplateId(),
        name: templateData.name.trim(),
        description: templateData.description?.trim() || '',
        fieldCount: templateData.fieldMappings.length,
        account: templateData.account?.trim() || '',
        accountId: templateData.accountId || '',
        fileType: templateData.fileType,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        status: templateData.status || 'Active',
        fieldMappings: templateData.fieldMappings,
        isDefault: false,
        fieldCombinations: templateData.fieldCombinations || [],
        sourceFields: templateData.sourceFields || []
      };

      const existingTemplates = loadImportTemplatesFromStorage();
      const updatedTemplates = [newTemplate, ...existingTemplates];
      saveImportTemplatesToStorage(updatedTemplates);

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
 * Update an existing import template
 */
export const updateImportTemplate = (id: string, updates: Partial<Omit<ImportTemplate, 'id' | 'createdAt'>>): Promise<ImportTemplate> => {
  return new Promise((resolve, reject) => {
    try {
      const templates = loadImportTemplatesFromStorage();
      const templateIndex = templates.findIndex(t => t.id === id);
      
      if (templateIndex === -1) {
        throw new Error(`Import template with id ${id} not found`);
      }

      // Clean string fields if they exist in updates
      const cleanedUpdates = { ...updates };
      if (cleanedUpdates.name) {
        cleanedUpdates.name = cleanedUpdates.name.trim();
      }
      if (cleanedUpdates.description) {
        cleanedUpdates.description = cleanedUpdates.description.trim();
      }

      const updatedTemplate: ImportTemplate = {
        ...templates[templateIndex],
        ...cleanedUpdates,
        updatedAt: getCurrentTimestamp(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      templates[templateIndex] = updatedTemplate;
      saveImportTemplatesToStorage(templates);

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
 * Delete an import template
 */
export const deleteImportTemplate = (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const templates = loadImportTemplatesFromStorage();
      const filteredTemplates = templates.filter(t => t.id !== id);
      
      if (filteredTemplates.length === templates.length) {
        throw new Error(`Import template with id ${id} not found`);
      }

      saveImportTemplatesToStorage(filteredTemplates);

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
 * Get templates that use a specific account ID
 * Used for checking account dependencies before deletion
 */
export const getTemplatesByAccountId = (accountId: string): string[] => {
  if (!accountId) {
    return [];
  }

  const templates = loadImportTemplatesFromStorage();
  return templates
    .filter(t => t.accountId === accountId)
    .map(t => t.name);
};

/**
 * Duplicate an import template
 */
export const duplicateImportTemplate = (id: string): Promise<ImportTemplate> => {
  return new Promise((resolve, reject) => {
    try {
      const templates = loadImportTemplatesFromStorage();
      const originalTemplate = templates.find(t => t.id === id);

      if (!originalTemplate) {
        throw new Error(`Import template with id ${id} not found`);
      }

      const now = getCurrentTimestamp();
      const duplicatedTemplate: ImportTemplate = {
        ...originalTemplate,
        id: generateImportTemplateId(),
        name: `${originalTemplate.name} (Copy)`,
        // Preserve accountId from original template
        accountId: originalTemplate.accountId,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        isDefault: false,
      };

      const updatedTemplates = [duplicatedTemplate, ...templates];
      saveImportTemplatesToStorage(updatedTemplates);

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
 * Result from template suggestion
 */
export interface TemplateSuggestion {
  templateId: string;
  confidence: number; // 0-100
}

/**
 * Suggest the best matching import template based on detected column headers
 *
 * Algorithm:
 * 1. Normalize both detected columns and template source fields (lowercase, trim)
 * 2. For each template, count how many of its source fields match detected columns
 * 3. Score = matched fields / total template source fields
 * 4. Return best match if confidence >= 70%
 *
 * Matching includes:
 * - Exact match (case-insensitive)
 * - Partial match (one contains the other)
 *
 * @param detectedColumns - Column headers detected from the file
 * @param templates - List of import templates to match against
 * @param minConfidence - Minimum confidence threshold (default: 0.7 = 70%)
 * @returns Best matching template with confidence, or null if no match meets threshold
 */
export const suggestTemplateForColumns = (
  detectedColumns: string[],
  templates: ImportTemplate[],
  minConfidence: number = 0.7
): TemplateSuggestion | null => {
  if (!detectedColumns || detectedColumns.length === 0) {
    return null;
  }

  if (!templates || templates.length === 0) {
    return null;
  }

  const normalizedDetected = detectedColumns.map(c => c.toLowerCase().trim());

  let bestMatch: { template: ImportTemplate | null; score: number } = {
    template: null,
    score: 0,
  };

  for (const template of templates) {
    // Skip templates without source fields
    if (!template.sourceFields || template.sourceFields.length === 0) {
      continue;
    }

    const normalizedSource = template.sourceFields.map(f => f.toLowerCase().trim());

    // Count matching columns
    const matches = normalizedSource.filter(sourceField =>
      normalizedDetected.some(
        detectedCol =>
          detectedCol === sourceField ||
          detectedCol.includes(sourceField) ||
          sourceField.includes(detectedCol)
      )
    );

    const score = matches.length / normalizedSource.length;

    if (score > bestMatch.score) {
      bestMatch = { template, score };
    }
  }

  // Return if confidence meets minimum threshold
  if (bestMatch.score >= minConfidence && bestMatch.template) {
    return {
      templateId: bestMatch.template.id,
      confidence: Math.round(bestMatch.score * 100),
    };
  }

  return null;
}; 