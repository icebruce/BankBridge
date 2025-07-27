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
import { ImportTemplate } from '../../models/ImportTemplate';
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
  
  // Check if this is the last row in a combined group
  const isLastInCombinedGroup = isCombined && (
    index === fields.length - 1 || 
    fields[index + 1].targetField !== field.targetField || 
    fields[index + 1].actions !== 'Combined'
  );
  
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
      <td className="px-4 py-4 text-sm align-middle">
        <div className="flex gap-2 items-center">
          <button 
            className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
            title={isCombined ? "Edit combination" : "Edit field"}
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
          {field.actions === 'Combined' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
              Combined
            </span>
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
  defaultExportTemplate
}) => {
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [sourceFileType, setSourceFileType] = useState('CSV File');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [fieldCombinations, setFieldCombinations] = useState<any[]>([]);
  
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

  // Sync with currentTemplateData when returning from field combination editor
  useEffect(() => {
    if (currentTemplateData) {
      setTemplateName(currentTemplateData.name || '');
      setSourceFileType(currentTemplateData.sourceFileType || 'CSV File');
      setFields(currentTemplateData.fields || []);
      setFieldCombinations(currentTemplateData.fieldCombinations || []);
    }
  }, [currentTemplateData]);
  
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
        fieldCombinations: [] // Will be populated by the field combination editor
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
    setFields(prevFields => prevFields.filter(field => field.id !== id));
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
          <label className="block mb-2 text-sm font-semibold">Template Name</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput" 
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">Source File Type</label>
          <select 
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
            disabled={!defaultExportTemplate}
            title={!defaultExportTemplate ? "Set a default export template to enable field combinations" : "Add field combination"}
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 bg-neutral-50 border-b border-neutral-200">Actions</th>
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
                return fields
                  .filter(field => field.actions !== 'Combined' && !fieldsInCombinations.includes(field.sourceField))
                  .map((field, index) => (
                    <FieldRow 
                      key={field.id} 
                      field={field} 
                      index={index}
                      fields={fields.filter(f => f.actions !== 'Combined' && !fieldsInCombinations.includes(f.sourceField))}
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
                
                return Object.entries(groupedCombined).map(([targetField, groupFields]: [string, any]) => 
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
                            <div style={{transform: 'translateY(12px)'}}>
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
                            <div className="mt-4 text-sm text-neutral-500 flex items-center">
                              <FontAwesomeIcon icon={faCode} className="text-neutral-400 mr-2" />
                              Concat with space
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* Actions column - only render for first field in group */}
                      {index === 0 && (
                        <td className="px-4 py-4 text-sm align-middle border-0" rowSpan={groupFields.length}>
                          <div className="flex gap-2 items-center">
                            <button 
                              className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                              title="Edit combination"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="text-neutral-600 text-xs" />
                            </button>
                            <button 
                              className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                              title="Delete combination"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs" />
                            </button>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                              Combined
                            </span>
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
                    <td className="px-4 py-4 text-sm text-blue-700">Text</td>
                    <td className="px-4 py-4 text-sm text-blue-700">
                      <TruncatedText 
                        text={(() => {
                          switch (sourceField.fieldName) {
                            case 'first_name': return 'John';
                            case 'last_name': return 'Doe';
                            case 'middle_name': return 'Michael';
                            case 'title': return 'Mr.';
                            case 'suffix': return 'Jr.';
                            default: return sourceField.fieldName.replace('_', ' ');
                          }
                        })()} 
                        maxLength={22} 
                        className="text-blue-700"
                      />
                    </td>
                    {/* Target Field column - only render for first field in combination */}
                    {index === 0 && (
                      <td className="px-4 py-4 align-middle border-0" rowSpan={combination.sourceFields.length}>
                        <div className="h-full flex flex-col justify-center">
                          <div style={{transform: 'translateY(12px)'}}>
                            <select 
                              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                              value={combination.targetField}
                              disabled
                            >
                              <option value={combination.targetField}>{combination.targetField}</option>
                            </select>
                          </div>
                          <div className="mt-4 text-sm text-neutral-500">
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
                      <td className="px-4 py-4 text-sm align-middle border-0" rowSpan={combination.sourceFields.length}>
                        <div className="flex gap-2 items-center">
                          <button 
                            className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                            title="Edit combination"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="text-neutral-600 text-xs" />
                          </button>
                          <button 
                            className="p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                            title="Delete combination"
                            onClick={() => {
                              setFieldCombinations(prev => prev.filter(c => c.id !== combination.id));
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs" />
                          </button>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Combined
                          </span>
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