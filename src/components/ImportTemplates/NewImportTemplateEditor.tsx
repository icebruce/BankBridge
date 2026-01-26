import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faCloudArrowUp,
  faExclamationTriangle,
  faPenToSquare,
  faCode,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate, FieldCombination } from '../../models/ImportTemplate';
import { Template, getInternalField } from '../../models/Template';
import { Account } from '../../models/Settings';
import { INTERNAL_FIELDS, INTERNAL_FIELD_DISPLAY_NAMES } from '../../models/MasterData';
import { fileParserService } from '../../services/fileParserService';
import Button from '../common/Button';

interface ImportFieldType {
  id: string;
  sourceField: string;
  dataType: 'Text' | 'Number' | 'Date' | 'Currency' | 'Boolean';
  sampleData: string;
  targetField: string;
  actions: string;
  confidence?: number;
  detectedDataType?: 'Text' | 'Number' | 'Date' | 'Currency' | 'Boolean';
  isOverridden?: boolean;
}

// Helper function to detect file type from extension
const detectFileTypeFromExtension = (filename: string): string => {
  const extension = filename.toLowerCase().split('.').pop() || '';
  switch (extension) {
    case 'csv':
    case 'txt':
      return 'CSV File';
    case 'xlsx':
    case 'xls':
      return 'Excel File';
    case 'json':
      return 'JSON File';
    case 'xml':
      return 'XML File';
    default:
      return 'CSV File'; // Default fallback
  }
};

// Helper function to check if a field has empty sample data
const isEmptyField = (field: ImportFieldType): boolean => {
  return !field.sampleData || field.sampleData.trim() === '';
};

interface NewImportTemplateEditorProps {
  onSave: (templateData: any) => void;
  onCancel: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  initialTemplate?: ImportTemplate | null;
  onAddFieldCombination?: (templateData: any, uploadedFields: string[]) => void;
  currentTemplateData?: any;
  defaultExportTemplate?: Template | null;
  fieldCombinationsRef?: React.MutableRefObject<{
    updateFieldCombinations: (combinations: FieldCombination[]) => void;
    getFieldCombinations: () => FieldCombination[];
  } | null>;
  existingTemplates?: ImportTemplate[];
  accounts?: Account[];
}

// Simple dropdown for target fields with support for disabled options
const TargetSelect: FC<{
  options: string[];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  disabledReason?: string;
  disabledOptions?: string[];
  isError?: boolean;
  displayNames?: Record<string, string>;
  onChange: (value: string) => void;
  onBlur?: () => void;
}> = ({ options, value, placeholder = 'Select target field', disabled, disabledReason, disabledOptions = [], isError, displayNames = {}, onChange, onBlur }) => (
  <select
    className={`w-full px-3 pr-6 py-1.5 text-sm border rounded-lg electronInput ${
      !value ? 'border-l-4 border-l-red-500' : ''
    } ${
      disabled
        ? 'opacity-60 cursor-not-allowed'
        : isError
          ? 'border-red-600 focus:border-red-600 focus:ring-0 focus:outline-none'
          : 'border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none'
    }`}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    disabled={disabled}
    aria-invalid={isError ? true : undefined}
    style={isError ? { borderColor: '#dc2626' } : undefined}
    title={disabled ? (disabledReason || 'Disabled') : undefined}
  >
    <option value="">{placeholder}</option>
    {options.map(opt => {
      const isOptionDisabled = disabledOptions.includes(opt) && opt !== value;
      const displayName = displayNames[opt] || opt;
      return (
        <option key={opt} value={opt} disabled={isOptionDisabled}>
          {displayName}{isOptionDisabled ? ' (already mapped)' : ''}
        </option>
      );
    })}
  </select>
);

// TruncatedText component with tooltip
const TruncatedText: FC<{ 
  text: string; 
  maxLength?: number; 
  className?: string;
}> = ({ text, maxLength = 20, className = "" }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate ? `${text.substring(0, maxLength)}...` : text;
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (shouldTruncate) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      });
      setShowTooltip(true);
    }
  };
  
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };
  
  const handleClick = () => {
    if (shouldTruncate) {
      setShowTooltip(!showTooltip);
    }
  };
  
  return (
    <>
      <span 
        className={`${className} ${shouldTruncate ? 'cursor-pointer hover:text-neutral-900 transition-colors' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        title={shouldTruncate ? "Click or hover to view full text" : undefined}
      >
        {displayText}
      </span>
      
      {showTooltip && shouldTruncate && (
        <div 
          className="fixed z-50 px-3 py-2 text-sm text-white bg-neutral-800 rounded-lg shadow-lg max-w-xs break-words"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          {text}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"
          />
        </div>
      )}
    </>
  );
};

// FieldRow component for field mapping - Updated for proper combined field display
const FieldRow = React.memo(({
  field,
  index,
  fields,
  onChangeField,
  onDeleteField,
  onEditCombination,
  availableTargetFields,
  usedTargetFields,
  hasDefaultExportTemplate,
  onTargetBlur,
  isTargetError,
  targetFieldDisplayNames
}: {
  field: ImportFieldType;
  index: number;
  fields: ImportFieldType[];
  onChangeField: (id: string, property: keyof ImportFieldType, value: string) => void;
  onDeleteField: (id: string) => void;
  onEditCombination?: (targetField: string) => void;
  availableTargetFields: string[];
  usedTargetFields: string[];
  hasDefaultExportTemplate: boolean;
  onTargetBlur?: (id: string) => void;
  isTargetError?: boolean;
  targetFieldDisplayNames?: Record<string, string>;
}) => {
  // Check if this field is part of a combined group
  const isCombined = field.actions === 'Combined';
  const isFirstInCombinedGroup = isCombined && (
    index === 0 || 
    fields[index - 1].targetField !== field.targetField || 
    fields[index - 1].actions !== 'Combined'
  );
  
  // Calculate rowspan for combined fields
  let rowSpan = 1;
  if (isCombined && isFirstInCombinedGroup) {
    // Count how many consecutive fields have the same target field and are combined
    for (let i = index + 1; i < fields.length; i++) {
      if (fields[i].targetField === field.targetField && fields[i].actions === 'Combined') {
        rowSpan++;
      } else {
        break;
      }
    }
  }
  
  // Note: isLastInCombinedGroup is calculated but not currently used
  // const isLastInCombinedGroup = isCombined && (
  //   index === fields.length - 1 || 
  //   fields[index + 1].targetField !== field.targetField || 
  //   fields[index + 1].actions !== 'Combined'
  // );
  
  return (
    <tr className={isCombined ? "bg-neutral-100" : "bg-white hover:bg-neutral-50/30"}>
      <td className="px-4 py-4 text-sm font-medium text-neutral-900">
        <TruncatedText 
          text={field.sourceField} 
          maxLength={18} 
          className="font-medium text-neutral-900"
        />
      </td>
      <td className="px-4 py-4 text-sm text-neutral-600">
        <div className="flex items-center gap-2">
          <select
            aria-label="Data type"
            className="w-auto min-w-[110px] px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            value={field.dataType}
            onChange={(e) => onChangeField(field.id, 'dataType', e.target.value)}
          >
            {['Text','Number','Date','Currency','Boolean'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {field.confidence !== undefined && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                field.confidence >= 0.85 ? 'bg-green-100 text-green-800' :
                field.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}
              title={`Detected: ${field.detectedDataType || field.dataType} • Confidence: ${(field.confidence*100).toFixed(0)}%`}
            >
              {(field.confidence*100).toFixed(0)}%
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-neutral-600">
        <TruncatedText 
          text={field.sampleData} 
          maxLength={22} 
          className="text-neutral-600"
        />
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <TargetSelect
              options={availableTargetFields}
              value={field.targetField}
              onChange={(v) => onChangeField(field.id, 'targetField', v)}
              onBlur={() => onTargetBlur && onTargetBlur(field.id)}
              isError={!!isTargetError}
              disabled={!hasDefaultExportTemplate}
              disabledReason={!hasDefaultExportTemplate ? 'Select a default export template to enable mapping' : undefined}
              disabledOptions={usedTargetFields}
              displayNames={targetFieldDisplayNames}
              placeholder="Select target field"
            />
          </div>
        </div>
        {isCombined && (
          <div className="mt-2 text-sm text-neutral-500 flex items-center">
            <FontAwesomeIcon icon={faCode} className="text-neutral-400 mr-2" />
            <span className="italic">
              {fields
                .filter(f => f.targetField === field.targetField && f.actions === 'Combined')
                .map(f => f.sampleData || 'N/A')
                .join(' ') || 'Combined preview'}
            </span>
          </div>
        )}
      </td>
      <td className="pl-4 pr-0 py-4 text-sm align-middle">
        <div className="flex items-center">
          <div className="flex gap-3 items-center">
            <button
              className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
              title={isCombined ? "Edit combination" : "Edit field"}
              onClick={isCombined && onEditCombination ? () => onEditCombination(field.targetField) : undefined}
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-neutral-600 text-xs" />
            </button>
            <button 
              className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
              title={isCombined ? "Delete combination" : "Delete field"}
              onClick={() => onDeleteField(field.id)}
            >
              <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs" />
            </button>
          </div>
          {field.actions === 'Combined' && (
            <div className="ml-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Combined
              </span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

const NewImportTemplateEditor: FC<NewImportTemplateEditorProps> = ({
  onSave,
  saveRef,
  initialTemplate,
  onAddFieldCombination,
  currentTemplateData,
  defaultExportTemplate,
  fieldCombinationsRef,
  existingTemplates = [],
  accounts = []
}) => {
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [sourceFileType, setSourceFileType] = useState('CSV File');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Draft'>('Active');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseMetadata, setParseMetadata] = useState<{
    encoding: string;
    delimiter: string;
    hasHeader: boolean | undefined;
    hasQuotedFields: boolean | undefined;
    hasBOM: boolean | undefined;
    previewRows: string[][];
  } | null>(null);

  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(true);
  const [fieldCombinations, setFieldCombinations] = useState<any[]>([]);
  const [isDeletingCombination, setIsDeletingCombination] = useState(false);
  const deletedCombinationIds = React.useRef<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const [storedSourceFields, setStoredSourceFields] = useState<string[]>([]);
  const [showAddFieldDropdown, setShowAddFieldDropdown] = useState(false);

  // Fields state - empty by default, populated when file is uploaded
  const [fields, setFields] = useState<ImportFieldType[]>([]);

  // Derive available target fields from the Export Template's internal field names
  // Use getInternalField() to get the actual internal field name (e.g., "date" not "Date")
  // Filter out 'exportDisplayName' as it's computed from Account config, not mapped from source
  // Fallback to INTERNAL_FIELDS if no default export template is set
  const availableTargetFields: string[] = defaultExportTemplate
    ? (defaultExportTemplate.fieldMappings || [])
        .map(m => getInternalField(m))
        .filter(Boolean)
        .filter(f => f !== 'exportDisplayName')
        .filter((v, i, a) => a.indexOf(v) === i)
    : INTERNAL_FIELDS.filter(f => f !== 'exportDisplayName');

  // Use centralized display name mapping for user-friendly labels in dropdowns
  const targetFieldDisplayNames = INTERNAL_FIELD_DISPLAY_NAMES as Record<string, string>;

  // Track touched fields for error border behavior
  const [touchedTargetFields, setTouchedTargetFields] = useState<Record<string, boolean>>({});
  const markTouched = (id: string) => setTouchedTargetFields(prev => ({ ...prev, [id]: true }));

  // Track whether the user has typed the template name to avoid overwriting it from currentTemplateData
  const hasUserTypedTemplateName = React.useRef<boolean>(false);
  const templateNameRef = React.useRef<HTMLInputElement | null>(null);
  const accountRef = React.useRef<HTMLInputElement | null>(null);
  const addFieldDropdownRef = useRef<HTMLDivElement | null>(null);
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const [accountTouched, setAccountTouched] = useState<boolean>(false);

  // Initialize form with template data when editing
  useEffect(() => {
    if (initialTemplate) {
      setTemplateName(initialTemplate.name);
      // Use accountId if available, otherwise leave empty (legacy templates)
      setAccountId(initialTemplate.accountId || '');
      setSourceFileType(initialTemplate.fileType);
      setStatus(initialTemplate.status || 'Active');
      setFieldCombinations(initialTemplate.fieldCombinations || []);

      // Convert field mappings to ImportFieldType format
      const convertedFields: ImportFieldType[] = initialTemplate.fieldMappings.map((mapping, index) => ({
        id: `${Date.now()}_${index}`,
        sourceField: mapping.sourceField,
        dataType: (mapping.dataType as any) || 'Text',
        sampleData: `Sample ${index + 1}`,
        targetField: mapping.targetField,
        actions: ''
      }));

      setFields(convertedFields.length > 0 ? convertedFields : []);

      // Initialize stored source fields for edit mode
      // Use stored sourceFields if available, otherwise extract from field mappings
      if (initialTemplate.sourceFields && initialTemplate.sourceFields.length > 0) {
        setStoredSourceFields(initialTemplate.sourceFields);
      } else {
        // Backwards compatibility: extract from field mappings
        const extractedFields = initialTemplate.fieldMappings.map(m => m.sourceField);
        setStoredSourceFields(extractedFields);
      }
    } else {
      // Reset form for new template
      setTemplateName('');
      setAccountId('');
      setSourceFileType('CSV File');
      setStatus('Active');
      setUploadedFile(null);
      setParseError(null);
      setParseWarnings([]);
      setParseMetadata(null);
      setIsPreviewCollapsed(true);
      setFieldCombinations([]);
      setFields([]);
      setStoredSourceFields([]);
    }
  }, [initialTemplate]);

  // Expose field combination methods to parent
  useEffect(() => {
    if (fieldCombinationsRef) {
      fieldCombinationsRef.current = {
        updateFieldCombinations: (combinations: FieldCombination[]) => {
          // Don't update if we're in the middle of deleting a combination
          if (!isDeletingCombination) {
            // Filter out any combinations that were deleted
            const filteredCombinations = combinations.filter(
              (combination: any) => !deletedCombinationIds.current.has(combination.id)
            );
            setFieldCombinations(filteredCombinations);
          }
        },
        getFieldCombinations: () => fieldCombinations
      };
    }
  }, [fieldCombinationsRef, fieldCombinations, isDeletingCombination]);

  // Sync with currentTemplateData when returning from field combination editor
  useEffect(() => {
    if (currentTemplateData && !isDeletingCombination) {
      // Only overwrite the template name if the user hasn't typed one in this session
      if (!hasUserTypedTemplateName.current && (templateName ?? '').trim() === '' && (currentTemplateData.name ?? '') !== '') {
        setTemplateName(currentTemplateData.name);
      }
      // Sync accountId if provided
      if (currentTemplateData.accountId && accountId.trim() === '') {
        setAccountId(currentTemplateData.accountId);
      }
      // Always keep file type and fields in sync when returning from editor
      setSourceFileType(currentTemplateData.sourceFileType || 'CSV File');
      setFields(currentTemplateData.fields || []);
      // Only update field combinations if they're different AND we're not in the middle of a delete operation
      if (JSON.stringify(currentTemplateData.fieldCombinations) !== JSON.stringify(fieldCombinations)) {
        // Filter out any combinations that were deleted
        const filteredCombinations = (currentTemplateData.fieldCombinations || []).filter(
          (combination: any) => !deletedCombinationIds.current.has(combination.id)
        );
        setFieldCombinations(filteredCombinations);
      }
    }
  }, [currentTemplateData, isDeletingCombination, templateName, accountId]);

  // Click-outside handler for Add Field dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addFieldDropdownRef.current &&
        !addFieldDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAddFieldDropdown(false);
      }
    };

    if (showAddFieldDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddFieldDropdown]);

  // No drag and drop needed for this page
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  // Process uploaded file and parse its structure
  const MAX_FILE_SIZE_MB = 10;
  const processUploadedFile = async (file: File) => {
    setIsParsingFile(true);
    setParseError(null);
    setParseWarnings([]);
    setUploadedFile(file);

    // Auto-detect file type from extension
    const detectedFileType = detectFileTypeFromExtension(file.name);
    setSourceFileType(detectedFileType);

    // Check file size limit
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setParseError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please select a smaller file.`);
      setIsParsingFile(false);
      return;
    }

    try {
             const parseResult = await fileParserService.parseFile(file, {
         maxPreviewRows: 50,
         hasHeader: undefined // Auto-detect
       });
      
      if (parseResult.success) {
        // Convert parsed fields to ImportFieldType format
        const convertedFields: ImportFieldType[] = parseResult.fields.map((field, index) => ({
          id: `parsed_${Date.now()}_${index}`,
          sourceField: field.name,
          dataType: field.dataType,
          sampleData: field.sampleValue,
          targetField: '', // User will map this
          actions: '',
          confidence: field.confidence,
          detectedDataType: field.dataType,
          isOverridden: false
        }));
        
        setFields(convertedFields);
        setFieldCombinations([]); // Clear any existing field combinations
        // Store all source fields for edit mode (allows adding fields back later)
        setStoredSourceFields(convertedFields.map(f => f.sourceField));
        
        // Store parse metadata for display
        setParseMetadata({
          encoding: parseResult.detectedEncoding || 'Unknown',
          delimiter: parseResult.detectedDelimiter || 'Unknown',
          hasHeader: parseResult.hasHeader,
          hasQuotedFields: parseResult.hasQuotedFields,
          hasBOM: parseResult.hasBOM,
          previewRows: parseResult.previewRows || []
        });
        
        if (parseResult.warnings && parseResult.warnings.length > 0) {
          setParseWarnings(parseResult.warnings);
        }
        
      } else {
        setParseError(parseResult.error || 'Failed to parse file');
        console.error('Parse error:', parseResult.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setParseError(errorMessage);
      console.error('File processing error:', error);
    } finally {
      setIsParsingFile(false);
    }
  };

  // Handle drag and drop file upload
  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  // Add a new field combination
  const handleAddFieldCombination = () => {
    if (onAddFieldCombination) {
      // Get current template data
      const templateData = {
        name: templateName,
        sourceFileType,
        fields,
        fieldCombinations: fieldCombinations // Include current field combinations
      };
      
      // Get uploaded file fields (source fields from the uploaded file)
      const uploadedFields = fields.map((field: any) => field.sourceField).filter(Boolean);
      
      onAddFieldCombination(templateData, uploadedFields);
    } else {
      // Fallback to old behavior if no handler provided
      const newField: ImportFieldType = {
        id: Date.now().toString(),
        sourceField: '',
        dataType: 'Text',
        sampleData: '',
        targetField: '',
        actions: 'Combined'
      };
      setFields([...fields, newField]);
    }
  };
  
  // Update field properties
  const handleFieldChange = useCallback((id: string, property: keyof ImportFieldType, value: string) => {
    setFields(prevFields => prevFields.map(field => {
      if (field.id !== id) return field;
      const updated: ImportFieldType = { ...field, [property]: value } as ImportFieldType;
      if (property === 'dataType') {
        updated.isOverridden = value !== field.detectedDataType;
      }
      return updated;
    }));
  }, []);
  
  // Delete a field
  const handleDeleteField = useCallback((id: string) => {
    setFields(prevFields => {
      const fieldToDelete = prevFields.find(field => field.id === id);

      // If this is a combined field, remove all fields in the combination group
      if (fieldToDelete && fieldToDelete.actions === 'Combined') {
        const sameTargetField = fieldToDelete.targetField;
        return prevFields.filter(field =>
          !(field.targetField === sameTargetField && field.actions === 'Combined')
        );
      }

      // For regular fields, just remove the single field
      return prevFields.filter(field => field.id !== id);
    });
  }, []);

  // Handle adding a field from stored source fields (edit mode)
  const handleAddFieldFromSource = useCallback((sourceFieldName: string) => {
    // Check if this field already exists in the fields array (but is hidden)
    const existingField = fields.find(f => f.sourceField === sourceFieldName);

    if (existingField && isEmptyField(existingField)) {
      // Field exists but is hidden - show hidden fields to make it visible
      setShowHiddenFields(true);
    } else if (!existingField) {
      // Field doesn't exist - add it
      const newField: ImportFieldType = {
        id: `added_${Date.now()}`,
        sourceField: sourceFieldName,
        dataType: 'Text',
        sampleData: '',
        targetField: '',
        actions: ''
      };
      setFields(prevFields => [...prevFields, newField]);
    }
    setShowAddFieldDropdown(false);
  }, [fields]);

  // Handle editing a legacy combined field group
  const handleEditLegacyCombination = useCallback((targetField: string) => {
    // Find all fields in this combined group
    const combinedFields = fields.filter(f => f.targetField === targetField && f.actions === 'Combined');
    if (combinedFields.length === 0) return;

    // Convert legacy combined fields to FieldCombination format
    const legacyCombination: FieldCombination = {
      id: `legacy_${Date.now()}`,
      targetField,
      delimiter: 'Space', // Legacy combined fields use space
      sourceFields: combinedFields.map((f, i) => ({
        id: `sf_${Date.now()}_${i}`,
        fieldName: f.sourceField,
        order: i + 1
      }))
    };

    // Remove the legacy combined fields from the fields array
    setFields(prevFields => prevFields.filter(f => !(f.targetField === targetField && f.actions === 'Combined')));

    // Open the FieldCombinationEditor with this combination for editing
    if (onAddFieldCombination) {
      const templateData: any = {
        name: templateName,
        accountId,
        sourceFileType,
        status,
        fields: fields.filter(f => !(f.targetField === targetField && f.actions === 'Combined')),
        fieldCombinations,
        editingCombination: legacyCombination
      };
      const uploadedFields = fields.map(f => f.sourceField).filter(Boolean);
      onAddFieldCombination(templateData, uploadedFields);
    }
  }, [fields, fieldCombinations, templateName, accountId, sourceFileType, status, onAddFieldCombination]);

  // No field reordering needed for this page

  // Save template
  const handleSave = () => {
    // Template name validation
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      setNameTouched(true);
      setFormError('Template name is required');
      setTimeout(() => templateNameRef.current?.focus(), 0);
      return;
    }
    if (trimmedName.length < 2) {
      setNameTouched(true);
      setFormError('Template name must be at least 2 characters');
      setTimeout(() => templateNameRef.current?.focus(), 0);
      return;
    }
    if (trimmedName.length > 100) {
      setNameTouched(true);
      setFormError('Template name cannot exceed 100 characters');
      setTimeout(() => templateNameRef.current?.focus(), 0);
      return;
    }

    // Account validation
    if (!accountId) {
      setAccountTouched(true);
      setFormError('Account is required. Please select an account from the dropdown.');
      setTimeout(() => accountRef.current?.focus(), 0);
      return;
    }

    // Duplicate template validation (accountId + fileType)
    const duplicateTemplate = existingTemplates.find(t =>
      t.accountId === accountId &&
      t.fileType === sourceFileType &&
      t.id !== initialTemplate?.id
    );
    if (duplicateTemplate) {
      setAccountTouched(true);
      setFormError(`An import template for this account and file type already exists: "${duplicateTemplate.name}"`);
      setTimeout(() => accountRef.current?.focus(), 0);
      return;
    }

    if (fields.length === 0) {
      setFormError('At least one field mapping is required');
      return;
    }

    // Required target mapping validation for visible/added fields
    // 1) regular visible fields (exclude fields used in combinations AND hidden empty fields)
    const fieldsInCombinations = fieldCombinations.flatMap((combination: any) =>
      combination.sourceFields.map((sf: { fieldName: string }) => sf.fieldName)
    );
    const regularVisibleFields = fields.filter(f => {
      if (f.actions === 'Combined') return false;
      if (fieldsInCombinations.includes(f.sourceField)) return false;
      // If "show hidden fields" is off, don't require mapping for empty fields
      if (!showHiddenFields && isEmptyField(f)) return false;
      return true;
    });
    const missingRegular = regularVisibleFields.filter(f => !f.targetField);

    // 2) grouped/legacy combined fields (require a target on the group; mark any with empty target)
    const missingCombined = fields.filter(f => f.actions === 'Combined' && !f.targetField);

    const invalidIds = [...missingRegular, ...missingCombined].map(f => f.id);
    if (invalidIds.length > 0) {
      // Mark as touched to show red border and halt save
      setTouchedTargetFields(prev => {
        const next = { ...prev } as Record<string, boolean>;
        invalidIds.forEach(id => { next[id] = true; });
        return next;
      });
      setFormError('Please map all required fields before saving.');
      // Keep UX responsive by focusing the template name if it's empty so user can start there
      if (!templateName.trim()) {
        setNameTouched(true);
        setTimeout(() => templateNameRef.current?.focus(), 0);
      }
      return;
    }
    
    // Build sourceFields array from current fields (to preserve all parsed fields)
    const allSourceFields = storedSourceFields.length > 0
      ? storedSourceFields
      : fields.map(f => f.sourceField);

    // Get account info for legacy account field (backward compatibility)
    const selectedAccount = accounts.find(a => a.id === accountId);
    const legacyAccountName = selectedAccount
      ? `${selectedAccount.institutionName} - ${selectedAccount.accountName}`
      : '';

    const templateData = {
      name: templateName,
      accountId,
      account: legacyAccountName, // Keep for backward compatibility
      sourceFileType,
      status,
      fields,
      fieldCombinations,
      sourceFields: allSourceFields
    };
    setFormError(null);
    onSave(templateData);
  };

  // Expose handleSave to parent component via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  }, [templateName, accountId, sourceFileType, status, fields, fieldCombinations, storedSourceFields, saveRef, accounts, showHiddenFields]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 overflow-hidden">
      {/* Top-level Status Messages */}
      {(formError || !defaultExportTemplate || defaultExportTemplate) && (
        <div className="space-y-3">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
          )}
          {!defaultExportTemplate && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600 mr-3" />
              <p className="text-sm text-amber-800">No default export template found. Please create and set a default export template to enable field combinations.</p>
            </div>
          )}
          {defaultExportTemplate && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center">
              <span className="mr-2 text-blue-600">ℹ</span>
              <p className="text-sm text-blue-800">Using default export template: <strong>{defaultExportTemplate.name}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* Template Configuration */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="template-name" className="block mb-2 text-sm font-semibold">Template Name</label>
          <input
            id="template-name"
            type="text"
            className={`w-full px-3 py-2 border rounded-lg electronInput ${
              nameTouched && !templateName.trim()
                ? 'border-l-4 border-l-red-500 border-red-600'
                : 'border-neutral-200'
            }`}
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => { hasUserTypedTemplateName.current = true; setTemplateName(e.target.value); }}
            onBlur={() => setNameTouched(true)}
            aria-invalid={nameTouched && !templateName.trim() ? true : undefined}
            ref={templateNameRef}
          />
        </div>
        <div>
          <label htmlFor="account" className="block mb-2 text-sm font-semibold">Account</label>
          {accounts.length === 0 ? (
            <div className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg text-amber-700 text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="text-amber-500" />
              No accounts configured. Please add accounts in Settings first.
            </div>
          ) : (
            <select
              id="account"
              className={`w-full px-3 py-2 border rounded-lg electronInput ${
                accountTouched && !accountId
                  ? 'border-l-4 border-l-red-500 border-red-600'
                  : 'border-neutral-200'
              }`}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              onBlur={() => setAccountTouched(true)}
              aria-invalid={accountTouched && !accountId ? true : undefined}
              ref={accountRef as React.RefObject<HTMLSelectElement>}
            >
              <option value="">Select an account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.institutionName} - {acc.accountName}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">Source File Type</label>
          <div className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-700">
            {sourceFileType || <span className="text-neutral-400 italic">Auto-detected from file</span>}
          </div>
        </div>
      </div>

      {/* File Upload Section - Hidden in edit mode */}
      {initialTemplate ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <FontAwesomeIcon icon={faCloudArrowUp} className="text-xl text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700">Source File Configuration</p>
              <p className="text-sm text-neutral-500">
                {sourceFileType} • {fields.length} field{fields.length !== 1 ? 's' : ''} mapped
              </p>
            </div>
          </div>
        </div>
      ) : (
      <div
        className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center overflow-hidden"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        <FontAwesomeIcon icon={faCloudArrowUp} className="text-4xl text-neutral-400 mb-3" />
        <p className="mb-2">Drag and drop your file here, or click to browse</p>
                 <p className="text-sm text-neutral-500 mb-4">Supported formats: .csv, .txt, .json</p>



         <input
           type="file"
           accept=".csv,.txt,.json"
           onChange={handleFileUpload}
           className="hidden"
           id="file-upload"
           disabled={isParsingFile}
         />
        <label
          htmlFor="file-upload"
          className={`px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 hover:shadow-sm transition-all duration-200 cursor-pointer inline-block ${
            isParsingFile ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isParsingFile ? 'Parsing...' : 'Browse Files'}
        </label>
        
        {/* Consolidated status messages - ordered by severity */}
        {(uploadedFile || parseError || parseWarnings.length > 0 || isParsingFile) && !isParsingFile && (
          <div className="mt-4 space-y-3 w-full overflow-hidden">
            {/* Error messages first */}
            {parseError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <span className="mr-2 text-red-500" aria-hidden="true">❌</span>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Parse Error</h4>
                    <p className="text-sm text-red-700 mt-1">{parseError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings second */}
            {parseWarnings.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <div className="flex items-center mb-1">
                  <span className="mr-2" aria-hidden="true">⚠️</span>
                  <h4 className="text-sm font-medium text-yellow-800">Parse Warnings ({parseWarnings.length})</h4>
                </div>
                <div className="ml-8 mt-1 space-y-1">
                  {parseWarnings.map((warning, index) => (
                    <p key={index} className="text-sm text-yellow-700">• {warning}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Success info (only when no error) */}
            {uploadedFile && !parseError && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <div className="flex items-center mb-2">
                  <span className="mr-2" aria-hidden="true">✅</span>
                  <p className="text-sm font-medium text-green-800">File uploaded successfully</p>
                </div>
                <div className="ml-8 mb-3">
                  <p className="text-sm text-green-700">{uploadedFile.name}</p>
                </div>

                {/* Parse metadata */}
                {parseMetadata && (
                  <div className="ml-8">
                    <div className="grid grid-cols-2 w-fit gap-x-6 gap-y-0.5 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-medium">Encoding:</span>
                        <span className="text-green-700">{parseMetadata.encoding}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-medium">Delimiter:</span>
                        <span className="text-green-700">{parseMetadata.delimiter}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-medium">Header Row:</span>
                        <span className="text-green-700">
                          {parseMetadata.hasHeader === undefined ? 'Auto-detected' : parseMetadata.hasHeader ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-medium">Quoted Fields:</span>
                        <span className="text-green-700">{parseMetadata.hasQuotedFields ? 'Yes' : 'No'}</span>
                      </div>
                      {parseMetadata.hasBOM && (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 font-medium">BOM:</span>
                            <span className="text-green-700">Detected</span>
                          </div>
                          <div></div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data preview (only when no error) */}
            {!parseError && parseMetadata?.previewRows && parseMetadata.previewRows.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-lg text-left" style={{ contain: 'inline-size' }}>
                <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
                  <h4 className="text-sm font-medium text-neutral-700">Data Preview (First 50 rows)</h4>
                  <button
                    onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                    className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-800 transition-colors"
                  >
                    <span>{isPreviewCollapsed ? 'Show Preview' : 'Hide Preview'}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isPreviewCollapsed ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {!isPreviewCollapsed && (
                  <div style={{ width: '0', minWidth: '100%', overflowX: 'auto', overflowY: 'auto', maxHeight: '256px' }}>
                    <table className="text-xs border-collapse" style={{ tableLayout: 'fixed', width: `${(parseMetadata.previewRows[0]?.length || 1) * 150}px` }}>
                      <thead className="bg-neutral-50 sticky top-0">
                        <tr>
                          {parseMetadata.previewRows[0]?.map((header, index) => (
                            <th
                              key={index}
                              className="px-3 py-2 text-left text-neutral-600 font-medium border-b border-neutral-200 bg-neutral-50"
                              style={{ width: '150px', minWidth: '150px', maxWidth: '150px' }}
                              title={header}
                            >
                              <div className="truncate">
                                {header}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {parseMetadata.previewRows.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-neutral-50">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-3 py-2 text-left text-neutral-700 border-b border-neutral-100"
                                style={{ width: '150px', minWidth: '150px', maxWidth: '150px' }}
                                title={cell}
                              >
                                <div className="truncate">
                                  {cell}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isParsingFile && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-sm text-blue-700">Parsing file structure...</p>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Field Mapping Section */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <div className="flex items-end gap-4">
            <h3 className="text-lg font-semibold text-neutral-900 leading-none">Field Mapping</h3>
            {/* Empty fields toggle - inline with title */}
            {(() => {
              const emptyFieldCount = fields.filter(field =>
                field.actions !== 'Combined' && isEmptyField(field)
              ).length;
              if (emptyFieldCount === 0) return null;
              return (
                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer leading-none">
                  <input
                    type="checkbox"
                    checked={showHiddenFields}
                    onChange={(e) => setShowHiddenFields(e.target.checked)}
                    className="rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
                  />
                  Show {emptyFieldCount} empty field{emptyFieldCount !== 1 ? 's' : ''}
                </label>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            {/* Add Field button - only show if there are available source fields */}
            {(() => {
              // A field is "available" if it's either:
              // 1. Not in the fields array at all (was deleted)
              // 2. In the fields array but hidden (empty field when showHiddenFields is false)
              const currentVisibleFieldNames = fields
                .filter(f => showHiddenFields || !isEmptyField(f))
                .map(f => f.sourceField);
              const availableSourceFields = storedSourceFields.filter(sf => !currentVisibleFieldNames.includes(sf));
              if (availableSourceFields.length === 0) return null;
              return (
                <div className="relative" ref={addFieldDropdownRef}>
                  <Button
                    variant="tertiary"
                    icon={faPlus}
                    onClick={() => setShowAddFieldDropdown(!showAddFieldDropdown)}
                    title="Add a field from original source file"
                  >
                    Add Field ({availableSourceFields.length})
                  </Button>
                  {showAddFieldDropdown && (
                    <div className="absolute right-0 mt-1 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {availableSourceFields.map(sf => (
                        <button
                          key={sf}
                          className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                          onClick={() => handleAddFieldFromSource(sf)}
                        >
                          {sf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <Button
              variant="tertiary"
              icon={faPlus}
              onClick={handleAddFieldCombination}
              disabled={!uploadedFile && fields.length === 0}
              title={(!uploadedFile && fields.length === 0) ? "Upload a file to enable field combinations" : "Add field combination"}
            >
              Add Field Combination
            </Button>
          </div>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[800px]">
            <colgroup>
              <col className="w-[140px]" />
              <col className="w-[100px]" />
              <col className="w-[160px]" />
              <col className="w-[200px]" />
              <col className="w-[96px]" />
            </colgroup>
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 bg-neutral-50 border-b border-neutral-200">Source Field</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 bg-neutral-50 border-b border-neutral-200">Data Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 bg-neutral-50 border-b border-neutral-200">Sample Data</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 bg-neutral-50 border-b border-neutral-200">Target Field</th>
                <th className="pl-4 pr-0 py-3 text-left text-sm font-semibold text-neutral-600 bg-neutral-50 border-b border-neutral-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {/* Regular field mappings - exclude combined fields and fields used in combinations */}
              {(() => {
                // Get all field names that are used in field combinations
                const fieldsInCombinations = fieldCombinations.flatMap((combination: any) =>
                  combination.sourceFields.map((sf: { fieldName: string }) => sf.fieldName)
                );

                // Filter out combined fields, fields in combinations, and optionally empty fields
                const filteredFields = fields.filter(field => {
                  if (field.actions === 'Combined') return false;
                  if (fieldsInCombinations.includes(field.sourceField)) return false;
                  if (!showHiddenFields && isEmptyField(field)) return false;
                  return true;
                });

                // Calculate used target fields (targets already selected by other fields or combinations)
                const usedByRegularFields = filteredFields.map(f => f.targetField).filter(Boolean);
                const usedByCombinations = fieldCombinations.map((c: any) => c.targetField).filter(Boolean);
                const usedByManualCombined = fields.filter(f => f.actions === 'Combined').map(f => f.targetField).filter(Boolean);
                const usedTargetFields = [...new Set([...usedByRegularFields, ...usedByCombinations, ...usedByManualCombined])];

                return filteredFields.map((field, index) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    index={index}
                    fields={filteredFields}
                    onChangeField={handleFieldChange}
                    onDeleteField={handleDeleteField}
                    onEditCombination={handleEditLegacyCombination}
                    availableTargetFields={availableTargetFields}
                    usedTargetFields={usedTargetFields}
                    hasDefaultExportTemplate={true}
                    onTargetBlur={markTouched}
                    isTargetError={touchedTargetFields[field.id] && !field.targetField}
                    targetFieldDisplayNames={targetFieldDisplayNames}
                  />
                ));
              })()}
              
              {/* Combined field groups from fields array */}
              {(() => {
                const combinedFields = fields.filter(field => field.actions === 'Combined');
                const groupedCombined = combinedFields.reduce((groups: any, field) => {
                  const key = field.targetField;
                  if (!groups[key]) {
                    groups[key] = [];
                  }
                  groups[key].push(field);
                  return groups;
                }, {});
                
                return Object.entries(groupedCombined).map(([, groupFields]: [string, any]) => 
                  groupFields.map((field: any, index: number) => (
                    <tr key={field.id} className="bg-neutral-100">
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                        <TruncatedText
                          text={field.sourceField}
                          maxLength={18}
                          className="font-medium text-neutral-900"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label="Data type"
                            className="w-auto min-w-[110px] px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            value={field.dataType}
                            onChange={(e) => handleFieldChange(field.id, 'dataType', e.target.value)}
                          >
                            {['Text','Number','Date','Currency','Boolean'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          {typeof field.confidence === 'number' && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                field.confidence >= 0.85 ? 'bg-green-100 text-green-800' :
                                field.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                              title={`Detected: ${field.detectedDataType || field.dataType} • Confidence: ${(field.confidence*100).toFixed(0)}%`}
                            >
                              {(field.confidence*100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        <TruncatedText
                          text={field.sampleData}
                          maxLength={22}
                          className="text-neutral-600"
                        />
                      </td>
                      {/* Target Field column - only render for first field in group */}
                      {index === 0 && (
                        <td className="px-4 py-4 align-middle border-0" rowSpan={groupFields.length}>
                          <div className="h-full flex flex-col justify-center">
                            <div style={{transform: 'translateY(20px)'}} className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <TargetSelect
                                  options={availableTargetFields}
                                  value={field.targetField}
                                  onChange={(v) => handleFieldChange(field.id, 'targetField', v)}
                                  onBlur={() => markTouched(field.id)}
                                  isError={touchedTargetFields[field.id] && !field.targetField}
                                  disabled={false}
                                  displayNames={targetFieldDisplayNames}
                                  placeholder="Select target field"
                                />
                              </div>
                            </div>
                            <div className="mt-6 text-sm text-neutral-500 flex items-center">
                              <FontAwesomeIcon icon={faCode} className="text-neutral-400 mr-2" />
                              <span className="italic">
                                {groupFields.map((gf: any) => gf.sampleData || 'N/A').join(' ') || 'Combined preview'}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* Actions column - only render for first field in group */}
                      {index === 0 && (
                        <td className="pl-4 pr-0 py-4 text-sm align-middle border-0" rowSpan={groupFields.length}>
                          <div className="flex items-center">
                            <div className="flex gap-3 items-center">
                              <button
                                className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                                title="Edit combination"
                                onClick={() => handleEditLegacyCombination(groupFields[0]?.targetField)}
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="text-neutral-600 text-xs" />
                              </button>
                              <button
                                className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                                title="Delete combination"
                                onClick={() => {
                                  // Restore individual fields by resetting their actions
                                  const fieldIdsToUpdate = groupFields.map((f: any) => f.id);
                                  setFields(prevFields => prevFields.map(field =>
                                    fieldIdsToUpdate.includes(field.id)
                                      ? { ...field, actions: '', targetField: '' }
                                      : field
                                  ));
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs" />
                              </button>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Combined
                              </span>
                              {(() => {
                                const confidences = groupFields
                                  .map((gf: any) => typeof gf.confidence === 'number' ? gf.confidence : undefined)
                                  .filter((c: number | undefined) => c !== undefined) as number[];
                                if (confidences.length === 0) return null;
                                const combined = Math.min(...confidences);
                                const tooltip = `Field confidences: ` + groupFields
                                  .map((gf: any) => `${gf.sourceField}: ${Math.round((gf.confidence ?? 0) * 100)}%`)
                                  .join(', ');
                                return (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700 border border-neutral-200"
                                    title={`${tooltip} • Combined: ${Math.round(combined * 100)}%`}
                                  >
                                    {Math.round(combined * 100)}%
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                );
              })()}
              
              {/* Field combinations created through Field Combination Editor */}
              {fieldCombinations.map((combination) => 
                combination.sourceFields.map((sourceField: any, index: number) => (
                  <tr key={`${combination.id}-${sourceField.fieldName}`} className="bg-neutral-100">
                    <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                      <TruncatedText
                        text={sourceField.fieldName}
                        maxLength={18}
                        className="font-medium text-neutral-900"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600">
                      {(() => {
                        const actualField = fields.find(f => f.sourceField === sourceField.fieldName);
                        if (!actualField) return <span>Text</span>;
                        return (
                          <div className="flex items-center gap-2">
                            <select
                              aria-label="Data type"
                              className="w-auto min-w-[110px] px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              value={actualField.dataType}
                              onChange={(e) => handleFieldChange(actualField.id, 'dataType', e.target.value)}
                            >
                              {['Text','Number','Date','Currency','Boolean'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            {typeof actualField.confidence === 'number' && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                  actualField.confidence >= 0.85 ? 'bg-green-100 text-green-800' :
                                  actualField.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}
                                title={`Detected: ${actualField.detectedDataType || actualField.dataType} • Confidence: ${(actualField.confidence*100).toFixed(0)}%`}
                              >
                                {(actualField.confidence*100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600">
                      <TruncatedText
                        text={(() => {
                          // Try to find the actual field data from the parsed file
                          const actualField = fields.find(f => f.sourceField === sourceField.fieldName);
                          if (actualField && actualField.sampleData) {
                            return actualField.sampleData;
                          }
                          // If no actual field found, just use the field name itself
                          return sourceField.fieldName;
                        })()}
                        maxLength={22}
                        className="text-neutral-600"
                      />
                    </td>
                    {/* Target Field column - only render for first field in combination */}
                    {index === 0 && (
                      <td className="px-4 py-4 align-middle border-0" rowSpan={combination.sourceFields.length}>
                        <div className="h-full flex flex-col justify-center">
                          <div style={{transform: 'translateY(20px)'}}>
                            <select
                              className={`w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput ${
                                !combination.targetField ? 'border-l-4 border-l-red-500' : ''
                              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors`}
                              value={combination.targetField}
                              onChange={(e) => {
                                setFieldCombinations(prevCombinations =>
                                  prevCombinations.map(c =>
                                    c.id === combination.id
                                      ? { ...c, targetField: e.target.value }
                                      : c
                                  )
                                );
                              }}
                            >
                              <option value="">Select target field</option>
                              {availableTargetFields.map(field => (
                                <option key={field} value={field}>{targetFieldDisplayNames[field] || field}</option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-6 text-sm text-neutral-500">
                            <span className="text-xs italic">
                              {(() => {
                                const delimiter = combination.delimiter === 'Custom' ? combination.customDelimiter :
                                  combination.delimiter === 'Comma' ? ', ' :
                                  combination.delimiter === 'Semicolon' ? '; ' : ' ';
                                return combination.sourceFields.map((sf: any) => {
                                  const actualField = fields.find(f => f.sourceField === sf.fieldName);
                                  return actualField?.sampleData || sf.fieldName;
                                }).join(delimiter) || 'Combined preview';
                              })()}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    
                    {/* Actions column - only render for first field in combination */}
                    {index === 0 && (
                      <td className="pl-4 pr-0 py-4 text-sm align-middle border-0" rowSpan={combination.sourceFields.length}>
                        <div className="flex items-center">
                          <div className="flex gap-3 items-center">
                            <button 
                              className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                              title="Edit combination"
                              onClick={() => {
                                if (onAddFieldCombination) {
                                  // Get current template data
                                  const templateData: any = {
                                    name: templateName,
                                    sourceFileType,
                                    fields,
                                    fieldCombinations: fieldCombinations.filter(c => c.id !== combination.id), // Remove the one being edited
                                    editingCombination: combination // Add the combination being edited
                                  };
                                  
                                  // Get uploaded file fields (source fields from the uploaded file)
                                  const uploadedFields = fields.map((field: any) => field.sourceField).filter(Boolean);
                                  
                                  onAddFieldCombination(templateData, uploadedFields);
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="text-neutral-600 text-xs" />
                            </button>
                                                         <button 
                               className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                               title="Delete combination"
                               data-testid="delete-combination-button"
                                                               onClick={() => {
                                  // Set the deleting flag to prevent the useEffect from re-adding the combination
                                  setIsDeletingCombination(true);

                                  // Track this combination as deleted to prevent it from being re-added
                                  deletedCombinationIds.current.add(combination.id);

                                  // When deleting a field combination, restore the individual source fields
                                  // back to the fields array so they "explode" back into single lines
                                  // But only if they don't already exist in the fields array
                                  const existingFieldNames = fields.map(f => f.sourceField);

                                  const sourceFieldsToRestore = combination.sourceFields
                                    .filter((sourceField: any) => !existingFieldNames.includes(sourceField.fieldName))
                                    .map((sourceField: any) => {
                                      // Try to find the actual field data from the parsed file
                                      const actualField = fields.find(f => f.sourceField === sourceField.fieldName);
                                      const sampleData = actualField && actualField.sampleData
                                        ? actualField.sampleData
                                        : sourceField.fieldName; // Use the actual field name as fallback

                                      return {
                                        id: `restored_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                                        sourceField: sourceField.fieldName,
                                        dataType: actualField?.dataType || 'Text' as const,
                                        sampleData,
                                        targetField: '', // User will need to map this again
                                        actions: '' // No longer combined
                                      };
                                    });

                                  // Add the restored fields to the fields array (only if there are any to add)
                                  if (sourceFieldsToRestore.length > 0) {
                                    setFields(prevFields => [...prevFields, ...sourceFieldsToRestore]);
                                  }

                                  // Remove the field combination from the state
                                  setFieldCombinations(prevCombinations =>
                                    prevCombinations.filter(c => c.id !== combination.id)
                                  );

                                  // Reset the deleting flag after a short delay to allow state updates to complete
                                  setTimeout(() => {
                                    setIsDeletingCombination(false);
                                  }, 100);
                                }}
                             >
                              <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs" />
                            </button>
                          </div>
                          <div className="ml-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Combined
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
              
              {fields.length === 0 && fieldCombinations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    <div className="flex flex-col items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl text-neutral-400 mb-2" />
                      <p>No fields mapped yet</p>
                      <p className="text-sm">Upload a file or add field combinations to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NewImportTemplateEditor; 