import React, { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash,
  faCloudArrowUp,
  faExclamationTriangle,
  faPenToSquare,
  faCode
} from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate, FieldCombination } from '../../models/ImportTemplate';
import { Template } from '../../models/Template';
import { fileParserService } from '../../services/fileParserService';
import Button from '../common/Button';

interface ImportFieldType {
  id: string;
  sourceField: string;
  dataType: 'Text' | 'Number' | 'Date' | 'Currency' | 'Boolean';
  sampleData: string;
  targetField: string;
  actions: string;
}

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
}

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
  onDeleteField
}: { 
  field: ImportFieldType;
  index: number;
  fields: ImportFieldType[];
  onChangeField: (id: string, property: keyof ImportFieldType, value: string) => void;
  onDeleteField: (id: string) => void;
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
    <tr className={isCombined ? "bg-blue-50 hover:bg-blue-100/50" : "bg-white hover:bg-neutral-50/30"}>
      <td className="px-4 py-4 text-sm font-medium text-neutral-900">
        <TruncatedText 
          text={field.sourceField} 
          maxLength={18} 
          className={isCombined ? "font-medium text-blue-900" : "font-medium text-neutral-900"}
        />
      </td>
      <td className="px-4 py-4 text-sm text-neutral-600">
        <span className={isCombined ? "text-blue-700" : "text-neutral-600"}>
          {field.dataType}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-neutral-600">
        <TruncatedText 
          text={field.sampleData} 
          maxLength={22} 
          className={isCombined ? "text-blue-700" : "text-neutral-600"}
        />
      </td>
      <td className="px-4 py-4 align-middle">
        <select 
          className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          value={field.targetField}
          onChange={(e) => onChangeField(field.id, 'targetField', e.target.value)}
        >
          <option value="">Select target field</option>
          <option value="Full Name">Full Name</option>
          <option value="Email Address">Email Address</option>
          <option value="Phone Number">Phone Number</option>
          <option value="Customer ID">Customer ID</option>
          <option value="Transaction Date">Transaction Date</option>
          <option value="Amount">Amount</option>
        </select>
        {isCombined && (
          <div className="mt-2 text-sm text-neutral-500 flex items-center">
            <FontAwesomeIcon icon={faCode} className="text-neutral-400 mr-2" />
            Concat with space
          </div>
        )}
      </td>
      <td className="pl-4 pr-0 py-4 text-sm align-middle">
        <div className="flex items-center">
          <div className="flex gap-3 items-center">
            <button 
              className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
              title={isCombined ? "Edit combination" : "Edit field"}
              onClick={isCombined ? () => {
                // Handle edit combination logic
                console.log('Edit combination clicked for field:', field.sourceField);
              } : undefined}
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
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
  fieldCombinationsRef
}) => {
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [sourceFileType, setSourceFileType] = useState('CSV File');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [fieldCombinations, setFieldCombinations] = useState<any[]>([]);
  const [isDeletingCombination, setIsDeletingCombination] = useState(false);
  const deletedCombinationIds = React.useRef<Set<string>>(new Set());
  
  // Fields state
  const [fields, setFields] = useState<ImportFieldType[]>([
    { 
      id: '1', 
      sourceField: 'first_name', 
      dataType: 'Text', 
      sampleData: 'John',
      targetField: 'Full Name',
      actions: 'Combined'
    },
    { 
      id: '2', 
      sourceField: 'last_name', 
      dataType: 'Text', 
      sampleData: 'Doe',
      targetField: 'Full Name',
      actions: 'Combined'
    },
    { 
      id: '3', 
      sourceField: 'email', 
      dataType: 'Text', 
      sampleData: 'john@example.com',
      targetField: 'Email Address',
      actions: ''
    },
    { 
      id: '4', 
      sourceField: 'phone', 
      dataType: 'Text', 
      sampleData: '+1234567890',
      targetField: 'Phone Number',
      actions: ''
    }
  ]);

  // Available file types
  const fileTypes = ['CSV File', 'Excel File', 'JSON File', 'XML File'];

  // Initialize form with template data when editing
  useEffect(() => {
    if (initialTemplate) {
      setTemplateName(initialTemplate.name);
      setSourceFileType(initialTemplate.fileType);
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
    } else {
      // Reset form for new template
      setTemplateName('');
      setSourceFileType('CSV File');
      setUploadedFile(null);
      setParseError(null);
      setParseWarnings([]);
      setFieldCombinations([]);
      setFields([]);
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
            console.log('🔄 updateFieldCombinations filtering:', {
              original: combinations.length,
              filtered: filteredCombinations.length,
              deletedIds: Array.from(deletedCombinationIds.current)
            });
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
      setTemplateName(currentTemplateData.name || '');
      setSourceFileType(currentTemplateData.sourceFileType || 'CSV File');
      setFields(currentTemplateData.fields || []);
      // Only update field combinations if they're different AND we're not in the middle of a delete operation
      if (JSON.stringify(currentTemplateData.fieldCombinations) !== JSON.stringify(fieldCombinations)) {
        // Filter out any combinations that were deleted
        const filteredCombinations = (currentTemplateData.fieldCombinations || []).filter(
          (combination: any) => !deletedCombinationIds.current.has(combination.id)
        );
        console.log('🔄 Filtering out deleted combinations:', {
          original: currentTemplateData.fieldCombinations?.length || 0,
          filtered: filteredCombinations.length,
          deletedIds: Array.from(deletedCombinationIds.current)
        });
        setFieldCombinations(filteredCombinations);
      }
    }
  }, [currentTemplateData, isDeletingCombination]); // Add isDeletingCombination dependency

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔄 Fields state changed:', fields.map(f => ({ sourceField: f.sourceField, actions: f.actions })));
  }, [fields]);

  useEffect(() => {
    console.log('🔄 FieldCombinations state changed:', fieldCombinations.map(c => ({ id: c.id, targetField: c.targetField, sourceFields: c.sourceFields.map(sf => sf.fieldName) })));
  }, [fieldCombinations]);
  
  // No drag and drop needed for this page
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  // Process uploaded file and parse its structure
  const processUploadedFile = async (file: File) => {
    setIsParsingFile(true);
    setParseError(null);
    setParseWarnings([]);
    setUploadedFile(file);

    try {
      console.log('Parsing file:', file.name);
      const parseResult = await fileParserService.parseFile(file);
      
      if (parseResult.success) {
        // Convert parsed fields to ImportFieldType format
        const convertedFields: ImportFieldType[] = parseResult.fields.map((field, index) => ({
          id: `parsed_${Date.now()}_${index}`,
          sourceField: field.name,
          dataType: field.dataType,
          sampleData: field.sampleValue,
          targetField: '', // User will map this
          actions: ''
        }));
        
        setFields(convertedFields);
        setFieldCombinations([]); // Clear any existing field combinations
        
        if (parseResult.warnings && parseResult.warnings.length > 0) {
          setParseWarnings(parseResult.warnings);
        }
        
        console.log(`Successfully parsed ${parseResult.rowCount} rows with ${parseResult.fields.length} fields`);
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
      const uploadedFields = fields.map(field => field.sourceField).filter(Boolean);
      
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
    setFields(prevFields => prevFields.map(field => 
      field.id === id ? { ...field, [property]: value } : field
    ));
  }, []);
  
  // Delete a field
  const handleDeleteField = useCallback((id: string) => {
    console.log('🗑️ handleDeleteField called with ID:', id);
    
    setFields(prevFields => {
      const fieldToDelete = prevFields.find(field => field.id === id);
      console.log('📊 Field to delete:', fieldToDelete);
      
      // If this is a combined field, we need to handle it specially
      if (fieldToDelete && fieldToDelete.actions === 'Combined') {
        console.log('🔗 Deleting combined field group with targetField:', fieldToDelete.targetField);
        
        // Find all fields that are part of the same combination group
        const sameTargetField = fieldToDelete.targetField;
        // Note: fieldsInSameGroup is calculated but not currently used
        // const fieldsInSameGroup = prevFields.filter(field => 
        //   field.targetField === sameTargetField && field.actions === 'Combined'
        // );
        
        // Remove all fields in the combination group
        const newFields = prevFields.filter(field => 
          !(field.targetField === sameTargetField && field.actions === 'Combined')
        );
        console.log('📊 Fields after removing combined group:', newFields.map(f => ({ sourceField: f.sourceField, actions: f.actions })));
        return newFields;
      }
      
      // For regular fields, just remove the single field
      console.log('🗑️ Removing single field');
      const newFields = prevFields.filter(field => field.id !== id);
      console.log('📊 Fields after removing single field:', newFields.map(f => ({ sourceField: f.sourceField, actions: f.actions })));
      return newFields;
    });
  }, []);
  
  // No field reordering needed for this page
  
  // Save template
  const handleSave = () => {
    // Basic validation
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }
    
    const templateData = {
      name: templateName,
      sourceFileType,
      fields,
      fieldCombinations
    };
    onSave(templateData);
  };

  // Expose handleSave to parent component via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  }, [templateName, sourceFileType, fields, fieldCombinations, saveRef]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Template Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="template-name" className="block mb-2 text-sm font-semibold">Template Name</label>
          <input 
            id="template-name"
            type="text" 
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput" 
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="source-file-type" className="block mb-2 text-sm font-semibold">Source File Type</label>
          <select 
            id="source-file-type"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput"
            value={sourceFileType}
            onChange={(e) => setSourceFileType(e.target.value)}
          >
            {fileTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* File Upload Section */}
      <div 
        className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        <FontAwesomeIcon icon={faCloudArrowUp} className="text-4xl text-neutral-400 mb-3" />
        <p className="mb-2">Drag and drop your file here, or click to browse</p>
        <p className="text-sm text-neutral-500 mb-4">Supported formats: .csv, .txt</p>
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
        
        {/* File status messages */}
        {uploadedFile && !isParsingFile && !parseError && (
          <p className="mt-2 text-sm text-green-600">
            ✓ File uploaded: {uploadedFile.name}
          </p>
        )}
        
        {isParsingFile && (
          <p className="mt-2 text-sm text-blue-600">
            🔄 Parsing file structure...
          </p>
        )}
        
        {parseError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              ❌ Parse Error: {parseError}
            </p>
          </div>
        )}
        
        {parseWarnings.length > 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Warnings:</p>
            {parseWarnings.map((warning, index) => (
              <p key={index} className="text-sm text-yellow-700">• {warning}</p>
            ))}
          </div>
        )}
      </div>

      {/* Warning Message */}
      {!defaultExportTemplate && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600 mr-3" />
          <p className="text-sm text-amber-800">No default export template found. Please create and set a default export template to enable field combinations.</p>
        </div>
      )}
      
      {defaultExportTemplate && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-green-600 mr-3" />
          <p className="text-sm text-green-800">Using default export template: <strong>{defaultExportTemplate.name}</strong> for field combinations.</p>
        </div>
      )}

      {/* Field Mapping Section */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-900">Field Mapping</h3>
          <Button 
            variant="tertiary"
            icon={faPlus}
            onClick={handleAddFieldCombination}
            disabled={!defaultExportTemplate || (!uploadedFile && fields.length === 0)}
            title={!defaultExportTemplate ? "Set a default export template to enable field combinations" : (!uploadedFile && fields.length === 0) ? "Upload a file to enable field combinations" : "Add field combination"}
          >
            Add Field Combination
          </Button>
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
                const fieldsInCombinations = fieldCombinations.flatMap(combination =>
                  combination.sourceFields.map((sf: any) => sf.fieldName)
                );
                
                // Filter out both manually combined fields and fields used in combinations
                const filteredFields = fields.filter(field => field.actions !== 'Combined' && !fieldsInCombinations.includes(field.sourceField));
                
                return filteredFields.map((field, index) => (
                  <FieldRow 
                    key={field.id} 
                    field={field} 
                    index={index}
                    fields={filteredFields}
                    onChangeField={handleFieldChange}
                    onDeleteField={handleDeleteField}
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
                    <tr key={field.id} className="bg-blue-50 hover:bg-blue-100/50">
                      <td className="px-4 py-4 text-sm font-medium text-blue-900">
                        <TruncatedText 
                          text={field.sourceField} 
                          maxLength={18} 
                          className="font-medium text-blue-900"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-blue-700">
                        {field.dataType}
                      </td>
                      <td className="px-4 py-4 text-sm text-blue-700">
                        <TruncatedText 
                          text={field.sampleData} 
                          maxLength={22} 
                          className="text-blue-700"
                        />
                      </td>
                      {/* Target Field column - only render for first field in group */}
                      {index === 0 && (
                        <td className="px-4 py-4 align-middle border-0" rowSpan={groupFields.length}>
                          <div className="h-full flex flex-col justify-center">
                            <div style={{transform: 'translateY(20px)'}}>
                              <select 
                                className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                value={field.targetField}
                                onChange={(e) => handleFieldChange(field.id, 'targetField', e.target.value)}
                              >
                                <option value="">Select target field</option>
                                <option value="Full Name">Full Name</option>
                                <option value="Email Address">Email Address</option>
                                <option value="Phone Number">Phone Number</option>
                                <option value="Customer ID">Customer ID</option>
                                <option value="Transaction Date">Transaction Date</option>
                                <option value="Amount">Amount</option>
                              </select>
                            </div>
                            <div className="mt-6 text-sm text-neutral-500 flex items-center">
                              <FontAwesomeIcon icon={faCode} className="text-neutral-400 mr-2" />
                              Concat with space
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
                                onClick={() => {
                                  // Handle edit combination logic
                                  console.log('Edit combination clicked for grouped fields');
                                }}
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="text-neutral-600 text-xs" />
                              </button>
                              <button 
                                className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                                title="Delete combination"
                                                                 onClick={() => {
                                   console.log('🗑️ Delete button clicked for manually combined field group');
                                   console.log('📊 Group fields to reset:', groupFields.map(f => ({ id: f.id, sourceField: f.sourceField, targetField: f.targetField })));
                                   
                                   // When deleting a manually combined field group, restore the individual fields
                                   // by changing their actions back to empty (not combined)
                                   const fieldIdsToUpdate = groupFields.map((f: any) => f.id);
                                   console.log('🔄 Field IDs to update:', fieldIdsToUpdate);
                                   
                                   setFields(prevFields => {
                                     const newFields = prevFields.map(field => 
                                       fieldIdsToUpdate.includes(field.id) 
                                         ? { ...field, actions: '', targetField: '' } // Reset to individual fields
                                         : field
                                     );
                                     console.log('📊 Fields after reset:', newFields.map(f => ({ sourceField: f.sourceField, actions: f.actions, targetField: f.targetField })));
                                     return newFields;
                                   });
                                   
                                   console.log('✅ Manual combination delete completed');
                                 }}
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs" />
                              </button>
                            </div>
                            <div className="ml-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                Combined
                              </span>
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
                  <tr key={`${combination.id}-${sourceField.fieldName}`} className="bg-blue-50 hover:bg-blue-100/50">
                    <td className="px-4 py-4 text-sm font-medium text-blue-900">
                      <TruncatedText 
                        text={sourceField.fieldName} 
                        maxLength={18} 
                        className="font-medium text-blue-900"
                      />
                    </td>
                                         <td className="px-4 py-4 text-sm text-blue-700">
                       {(() => {
                         // Try to find the actual field data from the parsed file
                         const actualField = fields.find(f => f.sourceField === sourceField.fieldName);
                         return actualField?.dataType || 'Text';
                       })()}
                     </td>
                                         <td className="px-4 py-4 text-sm text-blue-700">
                                               <TruncatedText 
                          text={(() => {
                            // Try to find the actual field data from the parsed file
                            const actualField = fields.find(f => f.sourceField === sourceField.fieldName);
                            if (actualField && actualField.sampleData) {
                              return actualField.sampleData;
                            }
                            
                            // If no actual field found, just use the field name itself
                            // This ensures we show the actual field name from the parsed file
                            return sourceField.fieldName;
                          })()} 
                          maxLength={22} 
                          className="text-blue-700"
                        />
                     </td>
                    {/* Target Field column - only render for first field in combination */}
                    {index === 0 && (
                      <td className="px-4 py-4 align-middle border-0" rowSpan={combination.sourceFields.length}>
                        <div className="h-full flex flex-col justify-center">
                          <div style={{transform: 'translateY(20px)'}}>
                            <select 
                              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                              value={combination.targetField}
                              disabled
                            >
                              <option value={combination.targetField}>{combination.targetField}</option>
                            </select>
                          </div>
                          <div className="mt-6 text-sm text-neutral-500">
                            <span className="text-xs">
                              Concat with {combination.delimiter === 'Custom' ? combination.customDelimiter : 
                                combination.delimiter === 'Space' ? 'space' :
                                combination.delimiter === 'Comma' ? 'comma' :
                                combination.delimiter === 'Semicolon' ? 'semicolon' : 'space'}
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
                                  const uploadedFields = fields.map(field => field.sourceField).filter(Boolean);
                                  
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
                                  console.log('🗑️ Delete button clicked for combination:', combination.id);
                                  console.log('📊 Current fields:', fields.map(f => ({ sourceField: f.sourceField, actions: f.actions })));
                                  console.log('🔗 Combination to delete:', combination);
                                  
                                  // Set the deleting flag to prevent the useEffect from re-adding the combination
                                  setIsDeletingCombination(true);
                                  
                                  // Track this combination as deleted to prevent it from being re-added
                                  deletedCombinationIds.current.add(combination.id);
                                  console.log('🚫 Added combination ID to deleted set:', combination.id);
                                  
                                  // When deleting a field combination, restore the individual source fields
                                  // back to the fields array so they "explode" back into single lines
                                  // But only if they don't already exist in the fields array
                                  const existingFieldNames = fields.map(f => f.sourceField);
                                  console.log('📝 Existing field names:', existingFieldNames);
                                  
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
                                  
                                  console.log('🔄 Fields to restore:', sourceFieldsToRestore);
                                  
                                  // Add the restored fields to the fields array (only if there are any to add)
                                  if (sourceFieldsToRestore.length > 0) {
                                    console.log('➕ Adding restored fields to fields array');
                                    setFields(prevFields => {
                                      const newFields = [...prevFields, ...sourceFieldsToRestore];
                                      console.log('📊 New fields array:', newFields.map(f => ({ sourceField: f.sourceField, actions: f.actions })));
                                      return newFields;
                                    });
                                  } else {
                                    console.log('⚠️ No fields to restore (all already exist)');
                                  }
                                  
                                  // Remove the field combination from the state
                                  console.log('🗑️ Removing combination from fieldCombinations');
                                  setFieldCombinations(prevCombinations => {
                                    const newCombinations = prevCombinations.filter(c => c.id !== combination.id);
                                    console.log('📊 New fieldCombinations array:', newCombinations);
                                    return newCombinations;
                                  });
                                  
                                  // Reset the deleting flag after a short delay to allow state updates to complete
                                  setTimeout(() => {
                                    setIsDeletingCombination(false);
                                    console.log('✅ Delete operation completed and flag reset');
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