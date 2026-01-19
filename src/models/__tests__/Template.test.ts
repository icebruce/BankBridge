import { describe, it, expect } from 'vitest';
import {
  getInternalField,
  getExportField,
  createFieldMapping,
  DEFAULT_MONARCH_MAPPINGS,
  FieldMapping
} from '../Template';

describe('Template Model', () => {
  describe('getInternalField', () => {
    it('should return internalField when available', () => {
      const mapping: FieldMapping = {
        internalField: 'date',
        exportField: 'Date',
        sourceField: 'oldDate',
        targetField: 'OldDate'
      };

      expect(getInternalField(mapping)).toBe('date');
    });

    it('should fall back to sourceField when internalField is not available', () => {
      const mapping: FieldMapping = {
        sourceField: 'oldDate',
        targetField: 'OldDate'
      };

      expect(getInternalField(mapping)).toBe('oldDate');
    });

    it('should return sourceField when internalField is undefined', () => {
      const mapping: FieldMapping = {
        internalField: undefined,
        sourceField: 'legacyField',
        targetField: 'Target'
      };

      expect(getInternalField(mapping)).toBe('legacyField');
    });
  });

  describe('getExportField', () => {
    it('should return exportField when available', () => {
      const mapping: FieldMapping = {
        internalField: 'merchant',
        exportField: 'Merchant Name',
        sourceField: 'merchant',
        targetField: 'Old Merchant'
      };

      expect(getExportField(mapping)).toBe('Merchant Name');
    });

    it('should fall back to targetField when exportField is not available', () => {
      const mapping: FieldMapping = {
        sourceField: 'merchant',
        targetField: 'Old Merchant'
      };

      expect(getExportField(mapping)).toBe('Old Merchant');
    });

    it('should return targetField when exportField is undefined', () => {
      const mapping: FieldMapping = {
        exportField: undefined,
        sourceField: 'field',
        targetField: 'LegacyTarget'
      };

      expect(getExportField(mapping)).toBe('LegacyTarget');
    });
  });

  describe('createFieldMapping', () => {
    it('should create mapping with default data type', () => {
      const mapping = createFieldMapping('merchant', 'Merchant');

      expect(mapping.internalField).toBe('merchant');
      expect(mapping.exportField).toBe('Merchant');
      expect(mapping.dataType).toBe('Text');
      // Legacy fields should also be set
      expect(mapping.sourceField).toBe('merchant');
      expect(mapping.targetField).toBe('Merchant');
    });

    it('should create mapping with Date data type', () => {
      const mapping = createFieldMapping('date', 'Transaction Date', 'Date');

      expect(mapping.internalField).toBe('date');
      expect(mapping.exportField).toBe('Transaction Date');
      expect(mapping.dataType).toBe('Date');
    });

    it('should create mapping with Currency data type', () => {
      const mapping = createFieldMapping('amount', 'Amount', 'Currency');

      expect(mapping.internalField).toBe('amount');
      expect(mapping.exportField).toBe('Amount');
      expect(mapping.dataType).toBe('Currency');
    });

    it('should set legacy fields for backward compatibility', () => {
      const mapping = createFieldMapping('category', 'Category', 'Text');

      expect(mapping.sourceField).toBe('category');
      expect(mapping.targetField).toBe('Category');
    });
  });

  describe('DEFAULT_MONARCH_MAPPINGS', () => {
    it('should have all required fields', () => {
      expect(DEFAULT_MONARCH_MAPPINGS).toHaveLength(8);

      const fieldNames = DEFAULT_MONARCH_MAPPINGS.map(m => m.internalField);
      expect(fieldNames).toContain('date');
      expect(fieldNames).toContain('merchant');
      expect(fieldNames).toContain('category');
      expect(fieldNames).toContain('exportDisplayName');
      expect(fieldNames).toContain('originalStatement');
      expect(fieldNames).toContain('notes');
      expect(fieldNames).toContain('amount');
      expect(fieldNames).toContain('tags');
    });

    it('should have correct export field names', () => {
      const exportFields = DEFAULT_MONARCH_MAPPINGS.map(m => m.exportField);
      expect(exportFields).toContain('Date');
      expect(exportFields).toContain('Merchant');
      expect(exportFields).toContain('Category');
      expect(exportFields).toContain('Account');
      expect(exportFields).toContain('Original Statement');
      expect(exportFields).toContain('Notes');
      expect(exportFields).toContain('Amount');
      expect(exportFields).toContain('Tags');
    });

    it('should have correct data types', () => {
      const dateMapping = DEFAULT_MONARCH_MAPPINGS.find(m => m.internalField === 'date');
      const amountMapping = DEFAULT_MONARCH_MAPPINGS.find(m => m.internalField === 'amount');
      const merchantMapping = DEFAULT_MONARCH_MAPPINGS.find(m => m.internalField === 'merchant');

      expect(dateMapping?.dataType).toBe('Date');
      expect(amountMapping?.dataType).toBe('Currency');
      expect(merchantMapping?.dataType).toBe('Text');
    });

    it('should have all fields with both new and legacy formats', () => {
      DEFAULT_MONARCH_MAPPINGS.forEach(mapping => {
        // New format
        expect(mapping.internalField).toBeDefined();
        expect(mapping.exportField).toBeDefined();
        // Legacy format
        expect(mapping.sourceField).toBeDefined();
        expect(mapping.targetField).toBeDefined();
        // They should match
        expect(mapping.internalField).toBe(mapping.sourceField);
        expect(mapping.exportField).toBe(mapping.targetField);
      });
    });
  });

  describe('FieldMapping interface compatibility', () => {
    it('should work with legacy-only mapping', () => {
      const legacyMapping: FieldMapping = {
        sourceField: 'oldField',
        targetField: 'Old Output'
      };

      expect(getInternalField(legacyMapping)).toBe('oldField');
      expect(getExportField(legacyMapping)).toBe('Old Output');
    });

    it('should work with mixed format mapping', () => {
      const mixedMapping: FieldMapping = {
        internalField: 'newField',
        sourceField: 'oldField',
        targetField: 'Old Output'
      };

      // New field should take precedence
      expect(getInternalField(mixedMapping)).toBe('newField');
      // But exportField is missing, so should fall back
      expect(getExportField(mixedMapping)).toBe('Old Output');
    });

    it('should work with full new format mapping', () => {
      const newMapping: FieldMapping = {
        internalField: 'merchant',
        exportField: 'Merchant Name',
        sourceField: 'merchant',
        targetField: 'Merchant Name',
        dataType: 'Text'
      };

      expect(getInternalField(newMapping)).toBe('merchant');
      expect(getExportField(newMapping)).toBe('Merchant Name');
    });
  });
});
