import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faGripVertical, 
  faTrash,
  faArrowUp,
  faArrowDown
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
import { Template } from '../../models/Template';
import DataTable, { DataTableColumn, DataTablePresets } from '../common/DataTable';
import Button from '../common/Button';

interface FieldType {
  id: string;
  name: string;
  type: 'Text' | 'Number' | 'Date' | 'Currency';
  format: string;
}

interface NewTemplateEditorProps {
  onSave: (templateData: any) => void;
  onCancel: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  initialTemplate?: Template | null;
}

// SortableRow component for drag and drop functionality
const SortableRow = React.memo(({ field, index, fields, onChangeField, onDeleteField, onMoveField }: { 
  field: FieldType;
  index: number;
  fields: FieldType[];
  onChangeField: (id: string, property: keyof FieldType, value: string) => void;
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
    <tr ref={setNodeRef} style={style} className={`${isDragging ? "bg-neutral-50" : "bg-white hover:bg-neutral-50/50"} transition-colors duration-150`}>
      <td className="px-4 py-3 text-sm">
        <div {...attributes} {...listeners} className="cursor-move flex justify-center">
          <FontAwesomeIcon 
            icon={faGripVertical} 
            className="text-neutral-400 hover:text-neutral-600"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <input 
          type="text" 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          value={field.name}
          onChange={(e) => onChangeField(field.id, 'name', e.target.value)}
          placeholder="Field name"
        />
      </td>
      <td className="px-4 py-3 text-sm">
        <select 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          value={field.type}
          onChange={(e) => onChangeField(field.id, 'type', e.target.value as any)}
        >
          <option value="Text">Text</option>
          <option value="Number">Number</option>
          <option value="Date">Date</option>
          <option value="Currency">Currency</option>
        </select>
      </td>
      <td className="px-4 py-3 text-sm">
        <input 
          type="text" 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder="Format pattern"
          value={field.format}
          onChange={(e) => onChangeField(field.id, 'format', e.target.value)}
        />
      </td>
      <td className="px-4 py-3 text-sm text-center">
        <div className="flex justify-center gap-1">
          <Button 
            variant="icon"
            icon={faArrowUp}
            onClick={() => onMoveField(index, 'up')}
            disabled={index === 0}
            title="Move Up"
          />
          <Button 
            variant="icon"
            icon={faArrowDown}
            onClick={() => onMoveField(index, 'down')}
            disabled={index === fields.length - 1}
            title="Move Down"
          />
          <Button 
            variant="icon"
            icon={faTrash}
            onClick={() => onDeleteField(field.id)}
            title="Delete"
            className="hover:bg-red-100 hover:text-red-600"
          />
        </div>
      </td>
    </tr>
  );
});

const NewTemplateEditor: React.FC<NewTemplateEditorProps> = ({ onSave, onCancel, saveRef, initialTemplate }) => {
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  
  // Fields state
  const [fields, setFields] = useState<FieldType[]>([
    { id: '1', name: 'Customer ID', type: 'Text', format: '' },
    { id: '2', name: 'Transaction Date', type: 'Date', format: 'YYYY-MM-DD' }
  ]);

  // Initialize form with template data when editing
  React.useEffect(() => {
    if (initialTemplate) {
      setTemplateName(initialTemplate.name);
      setDescription(initialTemplate.description);
      
      // Convert field mappings to FieldType format
      const convertedFields: FieldType[] = initialTemplate.fieldMappings.map((mapping, index) => ({
        id: `${Date.now()}_${index}`,
        name: mapping.sourceField,
        type: 'Text', // Default type, could be enhanced to store actual type
        format: mapping.transform || ''
      }));
      
      setFields(convertedFields.length > 0 ? convertedFields : [
        { id: '1', name: 'Customer ID', type: 'Text', format: '' },
        { id: '2', name: 'Transaction Date', type: 'Date', format: 'YYYY-MM-DD' }
      ]);
    } else {
      // Reset form for new template
      setTemplateName('');
      setDescription('');
      setFields([
        { id: '1', name: 'Customer ID', type: 'Text', format: '' },
        { id: '2', name: 'Transaction Date', type: 'Date', format: 'YYYY-MM-DD' }
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
  
  // Add a new field
  const handleAddField = () => {
    const newField: FieldType = {
      id: Date.now().toString(),
      name: '',
      type: 'Text',
      format: ''
    };
    setFields([...fields, newField]);
  };
  
  // Update field properties - optimized to prevent unnecessary re-renders
  const handleFieldChange = React.useCallback((id: string, property: keyof FieldType, value: string) => {
    setFields(prevFields => prevFields.map(field => 
      field.id === id ? { ...field, [property]: value } : field
    ));
  }, []);
  
  // Delete a field
  const handleDeleteField = React.useCallback((id: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
  }, []);
  
  // Move field up or down using buttons
  const handleMoveField = React.useCallback((index: number, direction: 'up' | 'down') => {
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
    
    // Check if all fields have names
    const emptyFields = fields.filter(field => !field.name.trim());
    if (emptyFields.length > 0) {
      alert('Please fill in all field names');
      return;
    }
    
    const templateData = {
      name: templateName,
      description,
      fields
    };
    onSave(templateData);
  };

  // Expose handleSave to parent component via ref
  React.useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  }, [templateName, description, fields, saveRef]);

  // Define table columns for DataTable
  const columns: DataTableColumn<FieldType>[] = [
    {
      key: 'drag',
      header: '#',
      width: '60px',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (_, field, index) => (
        <SortableRow 
          field={field} 
          index={index}
          fields={fields}
          onChangeField={handleFieldChange}
          onDeleteField={handleDeleteField}
          onMoveField={handleMoveField}
        />
      )
    }
  ];

  // Custom table content with drag and drop
  const tableContent = (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] table-auto">
          <colgroup>
            <col style={{ width: '60px', minWidth: '60px' }} />
            <col style={{ width: '200px', minWidth: '200px' }} />
            <col style={{ width: '140px', minWidth: '140px' }} />
            <col style={{ width: '200px', minWidth: '200px' }} />
            <col style={{ width: '140px', minWidth: '140px' }} />
          </colgroup>
          
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 text-center">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Field Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Format</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
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
      </div>
    </DndContext>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div id="template-config" className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-neutral-600 mb-1">Template Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" 
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-neutral-600 mb-1">Description</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" 
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-4 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-900">Field Configuration</h3>
          <Button 
            variant="tertiary"
            icon={faPlus}
            onClick={handleAddField}
          >
            Add Field
          </Button>
        </div>
        
        {tableContent}
        
        <div className="p-4 border-t border-neutral-200 bg-white">
          <div className="flex justify-between items-center text-sm text-neutral-600">
            <span>
              {fields.length} field{fields.length !== 1 ? 's' : ''} configured
            </span>
            <span className="text-xs text-neutral-500">
              Drag rows to reorder • Use arrow buttons for precise positioning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTemplateEditor; 