import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faGripVertical,
  faTrash,
  faArrowUp,
  faArrowDown,
  faCircleInfo
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
import { INTERNAL_FIELDS, InternalField } from '../../models/MasterData';
import Button from '../common/Button';

interface ExportFieldType {
  id: string;
  internalField: InternalField;
  exportField: string;
  type: 'Text' | 'Date' | 'Currency';
}

// Sample data for each internal field
const SAMPLE_DATA: Record<InternalField, string> = {
  date: '2025-01-08',
  merchant: 'Amazon',
  category: 'Shopping',
  exportDisplayName: 'TD Bank - Checking',
  originalStatement: 'AMAZON.COM*ABC123',
  notes: 'Monthly subscription',
  amount: '-58.12',
  tags: 'online, retail'
};

// Default data type for each internal field
const DEFAULT_DATA_TYPES: Record<InternalField, 'Text' | 'Date' | 'Currency'> = {
  date: 'Date',
  merchant: 'Text',
  category: 'Text',
  exportDisplayName: 'Text',
  originalStatement: 'Text',
  notes: 'Text',
  amount: 'Currency',
  tags: 'Text'
};

// Default Monarch Money field mappings
const DEFAULT_MONARCH_FIELDS: ExportFieldType[] = [
  { id: '1', internalField: 'date', exportField: 'Date', type: 'Date' },
  { id: '2', internalField: 'merchant', exportField: 'Merchant', type: 'Text' },
  { id: '3', internalField: 'category', exportField: 'Category', type: 'Text' },
  { id: '4', internalField: 'exportDisplayName', exportField: 'Account', type: 'Text' },
  { id: '5', internalField: 'originalStatement', exportField: 'Original Statement', type: 'Text' },
  { id: '6', internalField: 'notes', exportField: 'Notes', type: 'Text' },
  { id: '7', internalField: 'amount', exportField: 'Amount', type: 'Currency' },
  { id: '8', internalField: 'tags', exportField: 'Tags', type: 'Text' }
];

// Human-readable labels for internal fields
const INTERNAL_FIELD_LABELS: Record<InternalField, string> = {
  date: 'Date',
  merchant: 'Merchant',
  category: 'Category',
  exportDisplayName: 'Account',
  originalStatement: 'Original Statement',
  notes: 'Notes',
  amount: 'Amount',
  tags: 'Tags'
};

interface NewTemplateEditorProps {
  onSave: (templateData: any) => void;
  onCancel: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  initialTemplate?: Template | null;
}

// SortableRow component for drag and drop functionality
const SortableRow = React.memo(({
  field,
  index,
  fields,
  usedInternalFields,
  onChangeField,
  onDeleteField,
  onMoveField,
  showValidation
}: {
  field: ExportFieldType;
  index: number;
  fields: ExportFieldType[];
  usedInternalFields: Set<InternalField>;
  onChangeField: (id: string, property: keyof ExportFieldType, value: string) => void;
  onDeleteField: (id: string) => void;
  onMoveField: (index: number, direction: 'up' | 'down') => void;
  showValidation: boolean;
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

  const isExportDisplayName = field.internalField === 'exportDisplayName';

  return (
    <tr ref={setNodeRef} style={style} className={`${isDragging ? "bg-neutral-50" : "bg-white hover:bg-neutral-50"} transition-colors duration-150`}>
      {/* Drag Handle */}
      <td className="px-4 py-3 text-sm">
        <div {...attributes} {...listeners} className="cursor-move flex justify-center">
          <FontAwesomeIcon
            icon={faGripVertical}
            className="text-neutral-400 hover:text-neutral-600"
          />
        </div>
      </td>

      {/* Internal Field (dropdown) */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <select
            className="flex-1 px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-neutral-50"
            value={field.internalField}
            onChange={(e) => {
              const newInternalField = e.target.value as InternalField;
              onChangeField(field.id, 'internalField', newInternalField);
              // Auto-set the type based on the internal field
              onChangeField(field.id, 'type', DEFAULT_DATA_TYPES[newInternalField]);
            }}
          >
            {INTERNAL_FIELDS.map((internalField) => {
              const isUsedElsewhere = usedInternalFields.has(internalField) && field.internalField !== internalField;
              return (
                <option
                  key={internalField}
                  value={internalField}
                  disabled={isUsedElsewhere}
                >
                  {INTERNAL_FIELD_LABELS[internalField]}{isUsedElsewhere ? ' (in use)' : ''}
                </option>
              );
            })}
          </select>
          {isExportDisplayName && (
            <div className="relative group">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="w-4 h-4 text-blue-500 cursor-help"
              />
              <div className="absolute left-6 top-0 w-64 p-2 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                Account name from Settings → Account Configuration (e.g., "TD Bank - Checking").
              </div>
            </div>
          )}
        </div>
      </td>

      {/* Export Field (editable) */}
      <td className="px-4 py-3 text-sm">
        <input
          type="text"
          className={`w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            showValidation && !field.exportField.trim() ? 'border-l-4 border-l-red-500' : ''
          }`}
          value={field.exportField}
          onChange={(e) => onChangeField(field.id, 'exportField', e.target.value)}
          placeholder="Column name in export"
        />
      </td>

      {/* Type */}
      <td className="px-4 py-3 text-sm">
        <select
          className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={field.type}
          onChange={(e) => onChangeField(field.id, 'type', e.target.value as any)}
        >
          <option value="Text">Text</option>
          <option value="Date">Date</option>
          <option value="Currency">Currency</option>
        </select>
      </td>

      {/* Sample */}
      <td className="px-4 py-3 text-sm">
        <span className="text-neutral-500 italic truncate block" title={SAMPLE_DATA[field.internalField]}>
          {SAMPLE_DATA[field.internalField]}
        </span>
      </td>

      {/* Actions */}
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

const NewTemplateEditor: React.FC<NewTemplateEditorProps> = ({ onSave, saveRef, initialTemplate }) => {
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [templateNameTouched, setTemplateNameTouched] = useState(false);
  const [showFieldValidation, setShowFieldValidation] = useState(false);

  // Fields state - Default to Monarch Money's 8 required fields
  const [fields, setFields] = useState<ExportFieldType[]>(DEFAULT_MONARCH_FIELDS);

  // Initialize form with template data when editing
  React.useEffect(() => {
    // Reset validation state when switching modes
    setTemplateNameTouched(false);
    setFormError('');
    setShowFieldValidation(false);

    if (initialTemplate) {
      setTemplateName(initialTemplate.name);
      setDescription(initialTemplate.description);

      // Convert field mappings to ExportFieldType format
      const convertedFields: ExportFieldType[] = initialTemplate.fieldMappings.map((mapping, index) => {
        // Handle both new format (internalField/exportField) and legacy format (sourceField/targetField)
        const internalField = (mapping.internalField || mapping.sourceField) as InternalField;
        const exportField = mapping.exportField || mapping.targetField;

        return {
          id: `${Date.now()}_${index}`,
          internalField: INTERNAL_FIELDS.includes(internalField as any) ? internalField : 'merchant',
          exportField: exportField,
          type: (mapping.dataType as ExportFieldType['type']) || DEFAULT_DATA_TYPES[internalField] || 'Text'
        };
      });

      setFields(convertedFields.length > 0 ? convertedFields : DEFAULT_MONARCH_FIELDS);
    } else {
      // Reset form for new template
      setTemplateName('');
      setDescription('');
      setFields(DEFAULT_MONARCH_FIELDS.map((f, i) => ({ ...f, id: `new_${Date.now()}_${i}` })));
    }
  }, [initialTemplate]);

  // Track which internal fields are already used
  const usedInternalFields = React.useMemo(() => {
    return new Set(fields.map(f => f.internalField));
  }, [fields]);

  // Get available internal fields for adding
  const availableInternalFields = React.useMemo(() => {
    return INTERNAL_FIELDS.filter(f => !usedInternalFields.has(f));
  }, [usedInternalFields]);

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add a new field
  const handleAddField = () => {
    // Find first available internal field
    const availableField = availableInternalFields[0];
    if (!availableField) {
      setFormError('All internal fields are already mapped');
      return;
    }

    const newField: ExportFieldType = {
      id: Date.now().toString(),
      internalField: availableField,
      exportField: INTERNAL_FIELD_LABELS[availableField],
      type: DEFAULT_DATA_TYPES[availableField]
    };
    setFields([...fields, newField]);
  };

  // Update field properties
  const handleFieldChange = React.useCallback((id: string, property: keyof ExportFieldType, value: string) => {
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
        return prevFields;
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
    setFormError('');

    if (!templateName.trim()) {
      setTemplateNameTouched(true);
      setFormError('Please enter a template name');
      return;
    }

    if (fields.length === 0) {
      setFormError('Please add at least one field');
      return;
    }

    // Check if all fields have export names
    const emptyFields = fields.filter(field => !field.exportField.trim());
    if (emptyFields.length > 0) {
      setShowFieldValidation(true);
      setFormError('Please fill in all export field names');
      return;
    }

    // Convert to the format expected by the service
    const templateData = {
      name: templateName,
      description,
      fields: fields.map(f => ({
        name: f.exportField,
        type: f.type,
        internalField: f.internalField,
        exportField: f.exportField
      }))
    };
    onSave(templateData);
  };

  // Expose handleSave to parent component via ref
  React.useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  }, [templateName, description, fields, saveRef]);

  // Custom table content with drag and drop
  const tableContent = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-auto">
          <colgroup>
            <col style={{ width: '50px', minWidth: '50px' }} />
            <col style={{ width: '200px', minWidth: '200px' }} />
            <col style={{ width: '180px', minWidth: '180px' }} />
            <col style={{ width: '120px', minWidth: '120px' }} />
            <col style={{ width: '160px', minWidth: '160px' }} />
            <col style={{ width: '120px', minWidth: '120px' }} />
          </colgroup>

          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600 text-center">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Internal Field</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Export Field</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Sample</th>
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
                  usedInternalFields={usedInternalFields}
                  onChangeField={handleFieldChange}
                  onDeleteField={handleDeleteField}
                  onMoveField={handleMoveField}
                  showValidation={showFieldValidation}
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
      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {formError}
        </div>
      )}

      <div id="template-config" className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-neutral-600 mb-1">Template Name</label>
            <input
              type="text"
              className={`w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                templateNameTouched && !templateName.trim() ? 'border-l-4 border-l-red-500' : ''
              }`}
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onBlur={() => setTemplateNameTouched(true)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-neutral-600 mb-1">Description</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-4 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-900">Field Mapping</h3>
          <Button
            variant="tertiary"
            icon={faPlus}
            onClick={handleAddField}
            disabled={availableInternalFields.length === 0}
            title={availableInternalFields.length === 0 ? 'All fields are mapped' : 'Add field'}
          >
            Add Field
          </Button>
        </div>

        {tableContent}

        <div className="p-4 border-t border-neutral-200 bg-white">
          <div className="flex justify-between items-center text-sm text-neutral-600">
            <span>
              {fields.length} field{fields.length !== 1 ? 's' : ''} configured
              {availableInternalFields.length > 0 && (
                <span className="text-neutral-400 ml-2">
                  ({availableInternalFields.length} more available)
                </span>
              )}
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
