import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faChevronRight, 
  faPlus, 
  faArrowUp,
  faArrowDown, 
  faTrash 
} from '@fortawesome/free-solid-svg-icons';
import Button from '../common/Button';
import { FieldCombination, SourceField } from '../../models/ImportTemplate';

interface FieldCombinationEditorProps {
  onSave: (combination: FieldCombination) => void;
  onCancel: () => void;
  availableSourceFields?: string[];
  availableTargetFields?: string[];
  editingCombination?: FieldCombination | null;
}

const FieldCombinationEditor: FC<FieldCombinationEditorProps> = ({
  onSave,
  onCancel,
  availableSourceFields = ['first_name', 'last_name', 'middle_name', 'title', 'suffix'],
  availableTargetFields = ['Full Name', 'Address', 'Contact Info', 'Customer Details'],
  editingCombination = null
}) => {
  const [targetField, setTargetField] = useState<string>('');
  const [delimiter, setDelimiter] = useState<string>('Space');
  const [customDelimiter, setCustomDelimiter] = useState<string>('');
  const [sourceFields, setSourceFields] = useState<SourceField[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize state with editing combination data (only on initial mount or when editingCombination changes)
  useEffect(() => {
    if (editingCombination) {
      setTargetField(editingCombination.targetField);
      setDelimiter(editingCombination.delimiter);
      setCustomDelimiter(editingCombination.customDelimiter || '');
      setSourceFields(editingCombination.sourceFields || []);
    }
  }, [editingCombination]);

  // Add a default field for new combination mode (only if no fields exist yet)
  useEffect(() => {
    if (!editingCombination && availableSourceFields.length > 0 && sourceFields.length === 0) {
      setSourceFields([{
        id: '1',
        fieldName: availableSourceFields[0],
        order: 1
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCombination, availableSourceFields]);

  const delimiterOptions = [
    { value: 'Space', label: 'Space', symbol: ' ' },
    { value: 'Comma', label: 'Comma', symbol: ', ' },
    { value: 'Semicolon', label: 'Semicolon', symbol: '; ' },
    { value: 'Custom', label: 'Custom', symbol: '' }
  ];

  const generatePreview = () => {
    if (sourceFields.length === 0) return '';
    
    const sortedFields = [...sourceFields].sort((a, b) => a.order - b.order);
    const sampleValues = sortedFields.map(field => {
      // Use the actual field name as sample data
      // This ensures we show the real field names from the parsed file
      return field.fieldName;
    });
    
    // Get the actual delimiter symbol
    let delimiterSymbol = '';
    if (delimiter === 'Custom') {
      delimiterSymbol = customDelimiter;
    } else {
      const delimiterOption = delimiterOptions.find(option => option.value === delimiter);
      delimiterSymbol = delimiterOption?.symbol || ' ';
    }
    
    return sampleValues.join(delimiterSymbol);
  };

  const handleAddField = () => {
    // Find the first available field that's not already used
    const usedFieldNames = sourceFields.map(f => f.fieldName);
    const availableField = availableSourceFields.find(field => !usedFieldNames.includes(field)) || availableSourceFields[0] || '';
    
    const newField: SourceField = {
      id: Date.now().toString(),
      fieldName: availableField,
      order: sourceFields.length + 1
    };
    setSourceFields([...sourceFields, newField]);
  };

  const handleRemoveField = (id: string) => {
    const updatedFields = sourceFields.filter(field => field.id !== id);
    // Reorder remaining fields
    const reorderedFields = updatedFields.map((field, index) => ({
      ...field,
      order: index + 1
    }));
    setSourceFields(reorderedFields);
  };

  const handleFieldChange = (id: string, newFieldName: string) => {
    setSourceFields(sourceFields.map(field => 
      field.id === id ? { ...field, fieldName: newFieldName } : field
    ));
  };

  const handleMoveField = (id: string, direction: 'up' | 'down') => {
    const field = sourceFields.find(f => f.id === id);
    if (!field) return;

    const currentOrder = field.order;
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    // Check bounds
    if (targetOrder < 1 || targetOrder > sourceFields.length) return;

    // Find the field that currently has the target order
    const targetField = sourceFields.find(f => f.order === targetOrder);
    if (!targetField) return;

    // Swap the order values
    const newFields = sourceFields.map(f => {
      if (f.id === id) {
        return { ...f, order: targetOrder };
      } else if (f.id === targetField.id) {
        return { ...f, order: currentOrder };
      }
      return f;
    });

    setSourceFields(newFields);
  };

  const handleSave = () => {
    if (!targetField.trim()) {
      setFormError('Target field is required');
      return;
    }

    if (sourceFields.length < 2) {
      setFormError('A combination requires at least 2 source fields');
      return;
    }

    if (delimiter === 'Custom' && !customDelimiter.trim()) {
      setFormError('Custom delimiter cannot be empty');
      return;
    }

    setFormError(null);
    const combination: FieldCombination = {
      id: editingCombination?.id || `field_combination_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      targetField,
      delimiter,
      customDelimiter: delimiter === 'Custom' ? customDelimiter : undefined,
      sourceFields: [...sourceFields].sort((a, b) => a.order - b.order)
    };

    onSave(combination);
  };

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button 
                variant="back-arrow"
                icon={faArrowLeft}
                onClick={onCancel}
                className="mr-3"
              />
              <div>
                <div className="flex items-center text-sm text-neutral-500 mb-1">
                  <button 
                    className="hover:text-neutral-700 transition-colors"
                    onClick={onCancel}
                  >
                    Import Templates
                  </button>
                  <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
                  <span>New Template</span>
                  <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
                  <span>Field Combination</span>
                </div>
                <h2 className="text-2xl font-semibold">{editingCombination ? 'Edit' : 'Add'} Field Combination</h2>
                <p className="text-neutral-600">Combine multiple source fields into one target field</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleSave}
              >
                {editingCombination ? 'Update' : 'Save'} Combination
              </Button>
            </div>
          </div>
        </div>

        {/* Form Error Message */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {formError}
          </div>
        )}

        {/* Combination Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Target Field and Delimiter */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="combination-target-field" className="block mb-1 text-sm font-semibold text-neutral-600">Target Field</label>
              <select
                id="combination-target-field"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg border-l-4 border-l-red-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
              >
                <option value="">Select target field</option>
                {availableTargetFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="combination-delimiter" className="block mb-1 text-sm font-semibold text-neutral-600">Delimiter</label>
              <div className="space-y-2">
                <select
                  id="combination-delimiter"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                >
                  {delimiterOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {delimiter === 'Custom' && (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter custom delimiter"
                    value={customDelimiter}
                    onChange={(e) => setCustomDelimiter(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Source Fields */}
          <div className="border border-neutral-200 rounded-lg">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-neutral-900">Source Fields</h3>
              <Button 
                variant="tertiary" 
                icon={faPlus}
                onClick={handleAddField}
              >
                Add Field
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {[...sourceFields].sort((a, b) => a.order - b.order).map((field) => (
                <div key={field.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-neutral-100 rounded-full text-sm font-medium text-neutral-600">
                    {field.order}
                  </div>
                  <select
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                    value={field.fieldName}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  >
                    {availableSourceFields.map(fieldName => (
                      <option key={fieldName} value={fieldName}>{fieldName}</option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <Button 
                      variant="icon"
                      icon={faArrowUp}
                      onClick={() => handleMoveField(field.id, 'up')}
                      disabled={field.order === 1}
                      title="Move up"
                    />
                    <Button 
                      variant="icon"
                      icon={faArrowDown}
                      onClick={() => handleMoveField(field.id, 'down')}
                      disabled={field.order === sourceFields.length}
                      title="Move down"
                    />
                    <Button 
                      variant="icon"
                      icon={faTrash}
                      onClick={() => handleRemoveField(field.id)}
                      title="Remove field"
                      className="hover:bg-red-50 hover:text-red-600"
                    />
                  </div>
                </div>
              ))}
              {sourceFields.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <p>No source fields added yet</p>
                  <p className="text-sm">Click "Add Field" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-neutral-700 mb-2">Preview</div>
            <div className="bg-white border border-neutral-200 rounded p-3">
              <code className="text-neutral-800 text-sm">
                {generatePreview() || 'No preview available'}
              </code>
            </div>
          </div>
        </div>
    </div>
  );
};

export default FieldCombinationEditor; 