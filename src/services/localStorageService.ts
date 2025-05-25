import { Template } from '../models/Template';

const TEMPLATES_STORAGE_KEY = 'bankbridge_export_templates';
const CURRENT_SCHEMA_VERSION = '1.0.0';

export interface StoredTemplatesData {
  templates: Template[];
  lastUpdated: string;
  schemaVersion: string;
}

/**
 * Generate a unique ID for templates
 */
export const generateTemplateId = (): string => {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Load templates from local storage
 */
export const loadTemplatesFromStorage = (): Template[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const data: StoredTemplatesData = JSON.parse(stored);
    
    // Check schema version compatibility
    if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      console.warn(`Schema version mismatch. Expected ${CURRENT_SCHEMA_VERSION}, found ${data.schemaVersion}`);
      // In a real app, you might want to migrate data here
    }

    return data.templates || [];
  } catch (error) {
    console.error('Error loading templates from storage:', error);
    return [];
  }
};

/**
 * Save templates to local storage
 */
export const saveTemplatesToStorage = (templates: Template[]): void => {
  try {
    const data: StoredTemplatesData = {
      templates,
      lastUpdated: getCurrentTimestamp(),
      schemaVersion: CURRENT_SCHEMA_VERSION
    };

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving templates to storage:', error);
    throw new Error('Failed to save templates. Storage might be full.');
  }
};

/**
 * Clear all templates from storage
 */
export const clearTemplatesStorage = (): void => {
  try {
    localStorage.removeItem(TEMPLATES_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing templates storage:', error);
  }
};

/**
 * Get storage usage info
 */
export const getStorageInfo = () => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    const sizeInBytes = stored ? new Blob([stored]).size : 0;
    const sizeInKB = Math.round(sizeInBytes / 1024 * 100) / 100;
    
    return {
      sizeInBytes,
      sizeInKB,
      templateCount: stored ? JSON.parse(stored).templates?.length || 0 : 0
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { sizeInBytes: 0, sizeInKB: 0, templateCount: 0 };
  }
}; 