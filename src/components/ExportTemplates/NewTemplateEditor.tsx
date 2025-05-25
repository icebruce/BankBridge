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
import styles from './NewTemplateEditor.module.css';

interface FieldType {
  id: string;
  name: string;
  type: 'Text' | 'Number' | 'Date' | 'Currency';
  format: string;
}

interface NewTemplateEditorProps {
  onSave: (templateData: any) => void;
  onCancel: () => void;
}

// SortableRow component
const SortableRow = ({ field, index, fields, onChangeField, onDeleteField, onMoveField }: { 
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
        <input 
          type="text" 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg"
          value={field.name}
          onChange={(e) => onChangeField(field.id, 'name', e.target.value)}
          placeholder="Field name"
        />
      </td>
      <td className="py-3 px-4">
        <select 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg"
          value={field.type}
          onChange={(e) => onChangeField(field.id, 'type', e.target.value as any)}
        >
          <option value="Text">Text</option>
          <option value="Number">Number</option>
          <option value="Date">Date</option>
          <option value="Currency">Currency</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <input 
          type="text" 
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg"
          placeholder="Format pattern"
          value={field.format}
          onChange={(e) => onChangeField(field.id, 'format', e.target.value)}
        />
      </td>
      <td className="py-3 px-4">
        <div className="flex justify-center space-x-2">
          <button 
            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-700"
            onClick={() => onMoveField(index, 'up')}
            disabled={index === 0}
            title="Move Up"
          >
            <FontAwesomeIcon 
              icon={faArrowUp} 
              className={index === 0 ? "text-neutral-300" : "text-neutral-700"} 
            />
          </button>
          <button 
            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-700"
            onClick={() => onMoveField(index, 'down')}
            disabled={index === fields.length - 1}
            title="Move Down"
          >
            <FontAwesomeIcon 
              icon={faArrowDown} 
              className={index === fields.length - 1 ? "text-neutral-300" : "text-neutral-700"} 
            />
          </button>
          <button 
            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-700"
            onClick={() => onDeleteField(field.id)}
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const NewTemplateEditor: React.FC<NewTemplateEditorProps> = ({ onSave, onCancel }) => {
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  
  // Fields state
  const [fields, setFields] = useState<FieldType[]>([
    { id: '1', name: 'Customer ID', type: 'Text', format: '' },
    { id: '2', name: 'Transaction Date', type: 'Date', format: 'YYYY-MM-DD' }
  ]);
  
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
  
  // Update field properties
  const handleFieldChange = (id: string, property: keyof FieldType, value: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, [property]: value } : field
    ));
  };
  
  // Delete a field
  const handleDeleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };
  
  // Move field up or down using buttons
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === fields.length - 1)
    ) {
      return; // Can't move further
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setFields(items => arrayMove(items, index, newIndex));
  };
  
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
    const templateData = {
      name: templateName,
      description,
      fields
    };
    onSave(templateData);
  };
  
  return (
    <div>
      <div id="template-config" className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-neutral-600 mb-1">Template Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg" 
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-neutral-600 mb-1">Description</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg" 
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div id="field-editor" className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg">Field Configuration</h3>
          <button 
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 flex items-center"
            onClick={handleAddField}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Field
          </button>
        </div>

        <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead className="border-b border-neutral-200">
                <tr>
                  <th className="text-left py-3 px-4 w-10">#</th>
                  <th className="text-left py-3 px-4">Field Name</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Format</th>
                  <th className="text-center py-3 px-4 w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
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

export default NewTemplateEditor; 