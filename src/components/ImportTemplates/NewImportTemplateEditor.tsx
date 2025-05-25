import React, { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faGripVertical, 
  faTrash,
  faArrowUp,
  faArrowDown,
  faUpload,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// SortableRow component for drag and drop field reordering
const SortableRow = React.memo(({ 
  field, 
  index, 
  fields, 
  onChangeField, 
  onDeleteField, 
  onMoveField 
}: { 
  field: ImportFieldType;
  index: number;
  fields: ImportFieldType[];
  onChangeField: (id: string, property: keyof ImportFieldType, value: string) => void;
  onDeleteField: (id: string) => void;
  onMoveField: (index: number, direction: 'up' | 'down') => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as 'relative'
  };
  
  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? "bg-neutral-50" : ""}>
      <td className="py-3 px-4">
        <div {...attributes} {...listeners} className="cursor-move">
          <FontAwesomeIcon 
            icon={faGripVertical} 
            className="text-neutral-400"
          />
        </div>
      </td>
      <td className="py-3 px-4">
        {field.id.startsWith('parsed_') ? (
          <span className="text-sm">{field.sourceField}</span>
        ) : (
          <input
            type="text"
            className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput text-sm"
            value={field.sourceField}
            onChange={(e) => onChangeField(field.id, 'sourceField', e.target.value)}
            placeholder="Enter source field name"
          />
        )}
      </td>
      <td className="py-3 px-4">
        <select 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput text-sm"
          value={field.dataType}
          onChange={(e) => onChangeField(field.id, 'dataType', e.target.value)}
        >
          <option value="Text">Text</option>
          <option value="Number">Number</option>
          <option value="Date">Date</option>
          <option value="Currency">Currency</option>
          <option value="Boolean">Boolean</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-neutral-600">{field.sampleData}</span>
      </td>
      <td className="py-3 px-4">
        <select 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput text-sm"
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
      </td>
      <td className="py-3 px-4">
        <div className="flex justify-center space-x-1">
          <button 
            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
            onClick={() => onMoveField(index, 'up')}
            disabled={index === 0}
            title="Move Up"
          >
            <FontAwesomeIcon 
              icon={faArrowUp} 
              className={index === 0 ? "text-neutral-300" : "text-neutral-600"} 
              size="sm"
            />
          </button>
          <button 
            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
            onClick={() => onMoveField(index, 'down')}
            disabled={index === fields.length - 1}
            title="Move Down"
          >
            <FontAwesomeIcon 
              icon={faArrowDown} 
              className={index === fields.length - 1 ? "text-neutral-300" : "text-neutral-600"} 
              size="sm"
            />
          </button>
          <button 
            className="p-1 hover:bg-neutral-100 rounded text-red-600"
            onClick={() => onDeleteField(field.id)}
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} size="sm" />
          </button>
        </div>
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
      actions: 'Combined'
    },
    { 
      id: '4', 
      sourceField: 'phone', 
      dataType: 'Text', 
      sampleData: '+1234567890',
      targetField: 'Phone Number',
      actions: 'Combined'
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
          actions: 'Combined'
        },
        { 
          id: '4', 
          sourceField: 'phone', 
          dataType: 'Text', 
          sampleData: '+1234567890',
          targetField: 'Phone Number',
          actions: 'Combined'
        }
      ]);
    }
  }, [initialTemplate]);
  
  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  // Move field up or down using buttons
  const handleMoveField = useCallback((index: number, direction: 'up' | 'down') => {
    setFields(prevFields => {
      if (
        (direction === 'up' && index === 0) || 
        (direction === 'down' && index === prevFields.length - 1)
      ) {
        return prevFields; // Can't move further
      }
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      return arrayMove(prevFields, index, newIndex);
    });
  }, []);
  
  // Handle drag end - reorder fields
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
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
    <div>
      {/* Template Configuration */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Template Name</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border border-neutral-300 rounded-md electronInput" 
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Source File Type</label>
          <select 
            className="w-full px-3 py-2 border border-neutral-300 rounded-md electronInput"
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
      <div className="mb-6">
        <div 
          className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center bg-neutral-50"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
        >
          <FontAwesomeIcon icon={faUpload} className="text-4xl text-neutral-400 mb-4" />
          <p className="text-lg text-neutral-600 mb-2">
            <strong>Drag and drop your file here, or click to browse</strong>
          </p>
          <p className="text-sm text-neutral-500 mb-4">
            Supported formats: .csv, .txt, .json
          </p>
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
            className={`inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer ${
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
      </div>

      {/* Warning Message */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400 mr-3 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>No export template defined.</strong> Please create an export template first to enable field mapping.
          </div>
        </div>
      </div>

      {/* Field Mapping Section */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-neutral-900">Field Mapping</h3>
            <button 
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-neutral-900 hover:bg-neutral-800"
              onClick={handleAddFieldCombination}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Field Combination
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Source Field</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Data Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sample Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Target Field</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                <SortableContext 
                  items={fields.map(field => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field, index) => (
                    <SortableRow 
                      key={field.id} 
                      field={field} 
                      index={index}
                      fields={fields}
                      onChangeField={handleFieldChange}
                      onDeleteField={handleDeleteField}
                      onMoveField={handleMoveField}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default NewImportTemplateEditor; 