import React, { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash,
  faCloudArrowUp,
  faExclamationTriangle,
  faLink,
  faPenToSquare,
  faCode
} from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate } from '../../models/ImportTemplate';
import { fileParserService } from '../../services/fileParserService';

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
}

// FieldRow component for field mapping
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
  const isFirstInCombinedGroup = isCombined && (index === 0 || fields[index - 1].targetField !== field.targetField);
  const isSecondInCombinedGroup = isCombined && index > 0 && fields[index - 1].targetField === field.targetField;
  
  // Calculate rowspan for combined fields
  let rowSpan = 1;
  if (isCombined && isFirstInCombinedGroup) {
    // Count how many consecutive fields have the same target field
    for (let i = index + 1; i < fields.length; i++) {
      if (fields[i].targetField === field.targetField && fields[i].actions === 'Combined') {
        rowSpan++;
      } else {
        break;
      }
    }
  }
  
  return (
    <tr className="bg-white hover:bg-neutral-50/30">
      <td className="px-4 py-4 text-sm font-medium text-neutral-900">{field.sourceField}</td>
      <td className="px-4 py-4 text-sm text-neutral-600">{field.dataType}</td>
      <td className="px-4 py-4 text-sm text-neutral-600">{field.sampleData}</td>
      {/* Target Field column - only render for first in group or non-combined fields */}
      {(!isCombined || isFirstInCombinedGroup) && (
        <td className="px-4 py-4 align-top" rowSpan={rowSpan}>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <select 
                className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
              {isCombined && isFirstInCombinedGroup && (
                <div className="flex gap-1 flex-shrink-0">
                  <button 
                    className="p-1.5 hover:bg-neutral-100 hover:shadow-sm rounded transition-all duration-200 hover:scale-105"
                    title="Edit combination"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="text-neutral-600 hover:text-neutral-800 text-xs transition-colors" />
                  </button>
                  <button 
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm rounded transition-all duration-200 hover:scale-105"
                    title="Delete combination"
                    onClick={() => onDeleteField(field.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs transition-colors" />
                  </button>
                </div>
              )}
            </div>
            {isCombined && isFirstInCombinedGroup && (
              <div className="text-xs text-neutral-500 flex items-center">
                <FontAwesomeIcon icon={faCode} className="text-neutral-400 mr-1.5" />
                Concat with space
              </div>
            )}
          </div>
        </td>
      )}
      <td className="px-4 py-4">
        {field.actions === 'Combined' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
            Combined
          </span>
        ) : (
          <div className="flex gap-1">
            <button 
              className="p-1.5 hover:bg-neutral-100 hover:shadow-sm rounded transition-all duration-200 hover:scale-105"
              title="Link field"
            >
              <FontAwesomeIcon icon={faLink} className="text-neutral-400 hover:text-neutral-600 text-xs transition-colors" />
            </button>
            <button 
              className="p-1.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm rounded transition-all duration-200 hover:scale-105"
              title="Delete field"
              onClick={() => onDeleteField(field.id)}
            >
              <FontAwesomeIcon icon={faTrash} className="text-neutral-600 text-xs transition-colors" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
});

const NewImportTemplateEditor: FC<NewImportTemplateEditorProps> = ({ 
  onSave, 
  saveRef, 
  initialTemplate 
}) => {
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [sourceFileType, setSourceFileType] = useState('CSV File');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  
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
      
      // Convert field mappings to ImportFieldType format
      const convertedFields: ImportFieldType[] = initialTemplate.fieldMappings.map((mapping, index) => ({
        id: `${Date.now()}_${index}`,
        sourceField: mapping.sourceField,
        dataType: (mapping.dataType as any) || 'Text',
        sampleData: `Sample ${index + 1}`,
        targetField: mapping.targetField,
        actions: 'Combined'
      }));
      
      setFields(convertedFields.length > 0 ? convertedFields : [
        { 
          id: '1', 
          sourceField: 'first_name', 
          dataType: 'Text', 
          sampleData: 'John',
          targetField: 'Full Name',
          actions: 'Combined'
        }
      ]);
    } else {
      // Reset form for new template
      setTemplateName('');
      setSourceFileType('CSV File');
      setUploadedFile(null);
      setParseError(null);
      setParseWarnings([]);
      setFields([
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
    }
  }, [initialTemplate]);
  
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
          actions: 'Combined'
        }));
        
        setFields(convertedFields);
        
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
    const newField: ImportFieldType = {
      id: Date.now().toString(),
      sourceField: '',
      dataType: 'Text',
      sampleData: '',
      targetField: '',
      actions: 'Combined'
    };
    setFields([...fields, newField]);
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
      fields
    };
    onSave(templateData);
  };

  // Expose handleSave to parent component via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  }, [templateName, sourceFileType, fields, saveRef]);
  
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
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600 mr-3" />
        <p className="text-sm text-amber-800">No export template defined. Please create an export template first to enable field mapping.</p>
      </div>

      {/* Field Mapping Section */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-900">Field Mapping</h3>
          <button 
            className="px-3 py-1.5 text-sm text-neutral-900 bg-neutral-200 hover:bg-neutral-300 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-sm border border-neutral-300 hover:border-neutral-400"
            onClick={handleAddFieldCombination}
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Field Combination
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[800px]">
            <colgroup>
              <col className="w-[140px]" />
              <col className="w-[100px]" />
              <col className="w-[160px]" />
              <col className="w-[280px]" />
              <col className="w-[120px]" />
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
              {fields.length > 0 ? (
                fields.map((field, index) => (
                  <FieldRow 
                    key={field.id} 
                    field={field} 
                    index={index}
                    fields={fields}
                    onChangeField={handleFieldChange}
                    onDeleteField={handleDeleteField}
                  />
                ))
              ) : (
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