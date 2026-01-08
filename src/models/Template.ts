import { InternalField } from './MasterData';

/**
 * Export Template
 * Defines how internal transaction data is mapped to output file columns
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  fieldMappings: FieldMapping[];
  isDefault?: boolean;
}

/**
 * Field mapping for export templates
 *
 * Maps an internal database field to an output column name.
 * - internalField: The database field name (read-only, from INTERNAL_FIELDS)
 * - exportField: The output column name (user editable, freeform)
 *
 * Legacy fields (sourceField, targetField) are kept for backward compatibility
 * but new code should use internalField and exportField.
 */
export interface FieldMapping {
  /** @deprecated Use internalField instead */
  sourceField: string;

  /** @deprecated Use exportField instead */
  targetField: string;

  /** Internal database field name (e.g., 'date', 'merchant', 'exportDisplayName') */
  internalField?: InternalField;

  /** Output column name in the export file (freeform, user editable) */
  exportField?: string;

  /** Data type for formatting */
  dataType?: 'Text' | 'Date' | 'Currency';

  /** Optional transformation (for future use) */
  transform?: string;
}

/**
 * Gets the internal field from a FieldMapping (handles legacy format)
 */
export function getInternalField(mapping: FieldMapping): string {
  return mapping.internalField || mapping.sourceField;
}

/**
 * Gets the export field from a FieldMapping (handles legacy format)
 */
export function getExportField(mapping: FieldMapping): string {
  return mapping.exportField || mapping.targetField;
}

/**
 * Creates a FieldMapping with the new format
 */
export function createFieldMapping(
  internalField: InternalField,
  exportField: string,
  dataType: 'Text' | 'Date' | 'Currency' = 'Text'
): FieldMapping {
  return {
    // New fields
    internalField,
    exportField,
    dataType,
    // Legacy fields for backward compatibility
    sourceField: internalField,
    targetField: exportField
  };
}

/**
 * Default Monarch Money field mappings
 */
export const DEFAULT_MONARCH_MAPPINGS: FieldMapping[] = [
  createFieldMapping('date', 'Date', 'Date'),
  createFieldMapping('merchant', 'Merchant', 'Text'),
  createFieldMapping('category', 'Category', 'Text'),
  createFieldMapping('exportDisplayName', 'Account', 'Text'),
  createFieldMapping('originalStatement', 'Original Statement', 'Text'),
  createFieldMapping('notes', 'Notes', 'Text'),
  createFieldMapping('amount', 'Amount', 'Currency'),
  createFieldMapping('tags', 'Tags', 'Text')
]; 