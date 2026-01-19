import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateTemplateId,
  getCurrentTimestamp,
  loadTemplatesFromStorage,
  saveTemplatesToStorage,
  clearTemplatesStorage,
  getStorageInfo
} from '../localStorageService';
import { Template } from '../../models/Template';

const STORAGE_KEY = 'bankbridge_export_templates';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const createMockTemplate = (overrides: Partial<Template> = {}): Template => ({
  id: 'template_123',
  name: 'Test Template',
  description: 'Test description',
  fieldMappings: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  schemaVersion: '1.0.0',
  ...overrides
});

describe('localStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('generateTemplateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateTemplateId();
      const id2 = generateTemplateId();

      expect(id1).toMatch(/^template_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^template_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp in ID', () => {
      const before = Date.now();
      const id = generateTemplateId();
      const after = Date.now();

      const timestampPart = id.split('_')[1];
      const timestamp = parseInt(timestampPart, 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return ISO format timestamp', () => {
      const timestamp = getCurrentTimestamp();

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should return current time', () => {
      const before = new Date().toISOString();
      const timestamp = getCurrentTimestamp();
      const after = new Date().toISOString();

      expect(timestamp >= before).toBe(true);
      expect(timestamp <= after).toBe(true);
    });
  });

  describe('loadTemplatesFromStorage', () => {
    it('should return empty array when no data in storage', () => {
      const result = loadTemplatesFromStorage();
      expect(result).toEqual([]);
    });

    it('should return templates from storage', () => {
      const templates = [createMockTemplate()];
      const storedData = {
        templates,
        lastUpdated: new Date().toISOString(),
        schemaVersion: '1.0.0'
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const result = loadTemplatesFromStorage();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Template');
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorageMock.setItem(STORAGE_KEY, 'invalid json {{{');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should warn about schema version mismatch', () => {
      const templates = [createMockTemplate()];
      const storedData = {
        templates,
        lastUpdated: new Date().toISOString(),
        schemaVersion: '0.9.0' // Old version
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      loadTemplatesFromStorage();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Schema version mismatch')
      );
      consoleSpy.mockRestore();
    });

    it('should return empty array if templates is undefined', () => {
      const storedData = {
        templates: undefined,
        lastUpdated: new Date().toISOString(),
        schemaVersion: '1.0.0'
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const result = loadTemplatesFromStorage();

      expect(result).toEqual([]);
    });
  });

  describe('saveTemplatesToStorage', () => {
    it('should save templates to storage', () => {
      const templates = [createMockTemplate()];

      saveTemplatesToStorage(templates);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      );

      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(saved.templates).toHaveLength(1);
      expect(saved.schemaVersion).toBe('1.0.0');
    });

    it('should include lastUpdated timestamp', () => {
      const templates = [createMockTemplate()];
      const before = new Date().toISOString();

      saveTemplatesToStorage(templates);

      const saved = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(saved.lastUpdated >= before).toBe(true);
    });

    it('should format JSON with indentation', () => {
      const templates = [createMockTemplate()];

      saveTemplatesToStorage(templates);

      const savedString = localStorageMock.store[STORAGE_KEY];
      expect(savedString).toContain('\n');
    });

    it('should throw error when storage fails', () => {
      const templates = [createMockTemplate()];
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => saveTemplatesToStorage(templates)).toThrow(
        'Failed to save templates. Storage might be full.'
      );
    });
  });

  describe('clearTemplatesStorage', () => {
    it('should remove templates from storage', () => {
      const templates = [createMockTemplate()];
      const storedData = {
        templates,
        lastUpdated: new Date().toISOString(),
        schemaVersion: '1.0.0'
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));

      clearTemplatesStorage();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => clearTemplatesStorage()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getStorageInfo', () => {
    it('should return zero values when storage is empty', () => {
      const info = getStorageInfo();

      expect(info.sizeInBytes).toBe(0);
      expect(info.sizeInKB).toBe(0);
      expect(info.templateCount).toBe(0);
    });

    it('should return correct template count', () => {
      const templates = [
        createMockTemplate({ id: 'template_1' }),
        createMockTemplate({ id: 'template_2' }),
        createMockTemplate({ id: 'template_3' })
      ];
      const storedData = {
        templates,
        lastUpdated: new Date().toISOString(),
        schemaVersion: '1.0.0'
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const info = getStorageInfo();

      expect(info.templateCount).toBe(3);
    });

    it('should calculate size in bytes', () => {
      const templates = [createMockTemplate()];
      const storedData = {
        templates,
        lastUpdated: new Date().toISOString(),
        schemaVersion: '1.0.0'
      };
      const jsonString = JSON.stringify(storedData);
      localStorageMock.setItem(STORAGE_KEY, jsonString);

      const info = getStorageInfo();

      expect(info.sizeInBytes).toBeGreaterThan(0);
    });

    it('should calculate size in KB', () => {
      const templates = [createMockTemplate()];
      const storedData = {
        templates,
        lastUpdated: new Date().toISOString(),
        schemaVersion: '1.0.0'
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const info = getStorageInfo();

      expect(info.sizeInKB).toBe(Math.round(info.sizeInBytes / 1024 * 100) / 100);
    });

    it('should handle errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const info = getStorageInfo();

      expect(info).toEqual({ sizeInBytes: 0, sizeInKB: 0, templateCount: 0 });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle undefined templates array', () => {
      const storedData = {
        lastUpdated: new Date().toISOString(),
        schemaVersion: '1.0.0'
        // templates is missing
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const info = getStorageInfo();

      expect(info.templateCount).toBe(0);
    });
  });
});
