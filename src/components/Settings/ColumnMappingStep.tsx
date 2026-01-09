import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface ColumnMappingStepProps {
  sourceColumns: string[];
  sampleData: Record<string, string>[];
  onImport: (mappings: ColumnMapping[]) => Promise<void>;
  onCancel: () => void;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: InternalField | null;
}

export type InternalField =
  | 'date'
  | 'merchant'
  | 'category'
  | 'institutionName'
  | 'accountName'
  | 'amount'
  | 'originalStatement'
  | 'notes'
  | 'tags';

interface FieldConfig {
  field: InternalField;
  label: string;
  required: boolean;
  description: string;
}

const INTERNAL_FIELDS: FieldConfig[] = [
  { field: 'date', label: 'Date', required: true, description: 'Transaction date' },
  { field: 'merchant', label: 'Merchant', required: true, description: 'Merchant or payee name' },
  { field: 'amount', label: 'Amount', required: true, description: 'Transaction amount' },
  { field: 'category', label: 'Category', required: false, description: 'Transaction category' },
  { field: 'institutionName', label: 'Institution', required: false, description: 'Financial institution name' },
  { field: 'accountName', label: 'Account', required: false, description: 'Account name' },
  { field: 'originalStatement', label: 'Original Statement', required: false, description: 'Bank\'s original description' },
  { field: 'notes', label: 'Notes', required: false, description: 'Additional notes' },
  { field: 'tags', label: 'Tags', required: false, description: 'Tags (comma-separated)' },
];

// Auto-detection patterns for common column names
const AUTO_DETECT_PATTERNS: Record<InternalField, RegExp> = {
  date: /^(date|trans.*date|posted|posting.*date|transaction.*date)$/i,
  merchant: /^(merchant|payee|description|vendor|name|memo)$/i,
  amount: /^(amount|value|sum|total|debit|credit)$/i,
  category: /^(category|type|class)$/i,
  institutionName: /^(bank|institution|financial.*inst|bank.*name)$/i,
  accountName: /^(account|account.*name|acct)$/i,
  originalStatement: /^(statement|original|orig.*desc|bank.*desc)$/i,
  notes: /^(notes?|comment|remarks?)$/i,
  tags: /^(tags?|labels?)$/i,
};

const autoDetectMappings = (columns: string[]): ColumnMapping[] => {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<InternalField>();

  for (const column of columns) {
    let matchedField: InternalField | null = null;

    for (const [field, pattern] of Object.entries(AUTO_DETECT_PATTERNS)) {
      if (pattern.test(column) && !usedFields.has(field as InternalField)) {
        matchedField = field as InternalField;
        usedFields.add(matchedField);
        break;
      }
    }

    mappings.push({
      sourceColumn: column,
      targetField: matchedField,
    });
  }

  return mappings;
};

const ColumnMappingStep: FC<ColumnMappingStepProps> = ({
  sourceColumns,
  sampleData,
  onImport,
  onCancel
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [hasAttemptedImport, setHasAttemptedImport] = useState(false);

  // Auto-detect mappings on mount
  useEffect(() => {
    setMappings(autoDetectMappings(sourceColumns));
  }, [sourceColumns]);

  const handleMappingChange = (sourceColumn: string, targetField: InternalField | null) => {
    setMappings(prev => prev.map(m =>
      m.sourceColumn === sourceColumn
        ? { ...m, targetField }
        : m
    ));
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, sourceColumn]));
  };

  const getUsedFields = (): Set<InternalField> => {
    const used = new Set<InternalField>();
    for (const mapping of mappings) {
      if (mapping.targetField) {
        used.add(mapping.targetField);
      }
    }
    return used;
  };

  const getMissingRequiredFields = (): string[] => {
    const usedFields = getUsedFields();
    return INTERNAL_FIELDS
      .filter(f => f.required && !usedFields.has(f.field))
      .map(f => f.label);
  };

  const handleImport = async () => {
    setHasAttemptedImport(true);

    const missingRequired = getMissingRequiredFields();
    if (missingRequired.length > 0) {
      return; // Button should be disabled anyway
    }

    setIsImporting(true);
    try {
      await onImport(mappings);
    } finally {
      setIsImporting(false);
    }
  };

  const usedFields = getUsedFields();
  const missingRequired = getMissingRequiredFields();
  const canImport = missingRequired.length === 0;
  const isInstitutionMapped = usedFields.has('institutionName');
  const isAccountMapped = usedFields.has('accountName');

  // Get sample value for a column
  const getSampleValue = (column: string): string => {
    if (sampleData.length === 0) return '-';
    const value = sampleData[0][column];
    if (!value) return '-';
    return value.length > 30 ? value.substring(0, 30) + '...' : value;
  };

  // Check if a dropdown should show the error state (red left border)
  const shouldShowError = (mapping: ColumnMapping): boolean => {
    // Only show error if there are missing required fields
    if (missingRequired.length === 0) return false;
    // Only show error if field has been touched or user attempted import
    if (!touchedFields.has(mapping.sourceColumn) && !hasAttemptedImport) return false;
    // Only show error if this field is not mapped
    return !mapping.targetField;
  };

  return (
    <div className="py-6 px-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Map Your Columns
        </h3>
        <p className="text-sm text-neutral-500">
          Match your file columns to the internal data fields. Date, Merchant, and Amount are required.
        </p>
      </div>

      {/* Missing Required Fields Warning */}
      {missingRequired.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">Missing required fields:</span>{' '}
            {missingRequired.join(', ')}
          </div>
        </div>
      )}

      {/* Institution/Account Not Mapped Info */}
      {missingRequired.length === 0 && (!isInstitutionMapped || !isAccountMapped) && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            {!isInstitutionMapped && !isAccountMapped
              ? 'Institution and Account not mapped - transaction duplicate detection will rely only on date, amount, and merchant.'
              : !isInstitutionMapped
                ? 'Institution not mapped - transaction duplicate detection will rely only on date, amount, account, and merchant.'
                : 'Account not mapped - transaction duplicate detection will rely only on date, amount, institution, and merchant.'}
            {' '}Proceed if your file lacks these, or <span className="font-medium">Cancel</span> to update it.
          </div>
        </div>
      )}

      {/* Mapping Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-600">
                Source Column
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-neutral-600 w-12">

              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-600">
                Target Field
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-600">
                Sample Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {mappings.map((mapping) => (
              <tr key={mapping.sourceColumn} className="hover:bg-neutral-50/50">
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-900">{mapping.sourceColumn}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 text-neutral-400" />
                </td>
                <td className="px-4 py-3">
                  <select
                    className={`w-full px-3 py-1.5 rounded-lg text-sm electronInput focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      shouldShowError(mapping)
                        ? 'border-l-4 border-l-red-500 border border-red-300'
                        : 'border border-neutral-300'
                    }`}
                    value={mapping.targetField || ''}
                    onChange={(e) => handleMappingChange(
                      mapping.sourceColumn,
                      e.target.value ? e.target.value as InternalField : null
                    )}
                  >
                    <option value="">-- Do not map --</option>
                    {INTERNAL_FIELDS.map((field) => {
                      const isUsedElsewhere = usedFields.has(field.field) && mapping.targetField !== field.field;
                      return (
                        <option
                          key={field.field}
                          value={field.field}
                          disabled={isUsedElsewhere}
                        >
                          {field.label}{field.required ? ' (Required)' : ''}{isUsedElsewhere ? ' (already mapped)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {getSampleValue(mapping.sourceColumn)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mb-6 text-sm text-neutral-600">
        <span className="font-medium">{sampleData.length}</span> rows will be imported
        {usedFields.size > 0 && (
          <span> with <span className="font-medium">{usedFields.size}</span> mapped fields</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
          onClick={onCancel}
          disabled={isImporting}
        >
          Cancel
        </button>
        <button
          className={`px-4 py-2.5 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            canImport
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
          onClick={handleImport}
          disabled={!canImport || isImporting}
        >
          {isImporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
              Import Data
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ColumnMappingStep;
