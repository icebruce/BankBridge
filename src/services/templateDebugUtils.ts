import { loadTemplatesFromStorage, saveTemplatesToStorage, clearTemplatesStorage, getStorageInfo } from './localStorageService';
import { Template } from '../models/Template';

/**
 * Debug utilities for template storage
 * These functions are useful during development for inspecting and managing stored data
 */

/**
 * Log all stored templates to console
 */
export const logStoredTemplates = (): void => {
  const templates = loadTemplatesFromStorage();
  console.group('📋 Stored Export Templates');
  console.log(`Found ${templates.length} templates:`);
  templates.forEach((template, index) => {
    console.group(`${index + 1}. ${template.name}`);
    console.log('ID:', template.id);
    console.log('Description:', template.description);
    console.log('File Type:', template.fileType);
    console.log('Created:', template.createdAt);
    console.log('Updated:', template.updatedAt);
    console.log('Schema Version:', template.schemaVersion);
    console.log('Field Mappings:', template.fieldMappings);
    console.groupEnd();
  });
  console.groupEnd();
};

/**
 * Get storage statistics
 */
export const logStorageStats = (): void => {
  const stats = getStorageInfo();
  console.group('💾 Template Storage Statistics');
  console.log('Template Count:', stats.templateCount);
  console.log('Storage Size:', `${stats.sizeInKB} KB (${stats.sizeInBytes} bytes)`);
  console.groupEnd();
};

/**
 * Export templates as JSON string (for backup/sharing)
 */
export const exportTemplatesAsJSON = (): string => {
  const templates = loadTemplatesFromStorage();
  return JSON.stringify(templates, null, 2);
};

/**
 * Import templates from JSON string
 */
export const importTemplatesFromJSON = (jsonString: string): boolean => {
  try {
    const templates: Template[] = JSON.parse(jsonString);
    
    // Basic validation
    if (!Array.isArray(templates)) {
      throw new Error('Invalid format: expected array of templates');
    }
    
    // Validate each template has required fields
    templates.forEach((template, index) => {
      if (!template.id || !template.name || !template.createdAt || !template.updatedAt) {
        throw new Error(`Invalid template at index ${index}: missing required fields`);
      }
    });
    
    saveTemplatesToStorage(templates);
    console.log(`✅ Successfully imported ${templates.length} templates`);
    return true;
  } catch (error) {
    console.error('❌ Failed to import templates:', error);
    return false;
  }
};

/**
 * Reset templates to initial state (clear all and reload defaults)
 */
export const resetTemplates = (): void => {
  clearTemplatesStorage();
  console.log('🔄 Templates reset. Reload the page to see default templates.');
};

/**
 * Add these functions to window object for easy access in browser console
 */
export const attachDebugToWindow = (): void => {
  if (typeof window !== 'undefined') {
    (window as any).templateDebug = {
      logTemplates: logStoredTemplates,
      logStats: logStorageStats,
      exportJSON: exportTemplatesAsJSON,
      importJSON: importTemplatesFromJSON,
      reset: resetTemplates,
      logStorageInfo: () => {
        console.group('📁 Storage Location Information');
        console.log('Current storage: localStorage (browser)');
        console.log('Storage key: bankbridge_export_templates');
        console.log('In production Electron app, templates will be stored in:');
        console.log('  Windows: %APPDATA%\\BankBridge\\templates.json');
        console.log('  macOS: ~/Library/Application Support/BankBridge/templates.json');
        console.log('  Linux: ~/.config/BankBridge/templates.json');
        console.groupEnd();
      },
      help: () => {
        console.log(`
🛠️  Template Debug Utilities:

templateDebug.logTemplates()     - Show all stored templates
templateDebug.logStats()         - Show storage statistics  
templateDebug.logStorageInfo()   - Show storage location info
templateDebug.exportJSON()       - Export templates as JSON string
templateDebug.importJSON(json)   - Import templates from JSON string
templateDebug.reset()            - Clear all templates
templateDebug.help()             - Show this help message
        `);
      }
    };
    console.log('🛠️  Template debug utilities attached to window.templateDebug');
  }
}; 