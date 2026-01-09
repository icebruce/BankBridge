// src/components/ExportTemplates/ExportTemplatesPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Template } from '../../models/Template';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate, setDefaultTemplate } from '../../services/templateService';
import PageHeader from './PageHeader';
import SearchInput from './SearchInput';
import TemplatesList from './TemplatesList';
import NewTemplateEditor from './NewTemplateEditor';
import { useToast, ToastContainer } from '../common/Toast';


const ExportTemplatesPage: FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [showNewTemplateEditor, setShowNewTemplateEditor] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const saveTemplateRef = useRef<(() => void) | null>(null);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  useEffect(() => {
    // Load templates from service
    fetchTemplates()
      .then(setTemplates)
      .catch(error => {
        console.error('Error loading templates:', error);
        setTemplates([]);
      });
  }, []);

  const handleNew = () => {
    setShowNewTemplateEditor(true);
  };

  const handleSaveTemplate = useCallback(async (templateData: any) => {
    try {
      console.log('🔄 Saving template with data:', templateData);

      // Validate input data
      if (!templateData) {
        throw new Error('No template data provided');
      }

      if (!templateData.name || !templateData.name.trim()) {
        throw new Error('Template name is required');
      }

      if (!templateData.fields || templateData.fields.length === 0) {
        throw new Error('At least one field is required');
      }

      // Create field mappings from the form data
      const fieldMappings = templateData.fields.map((field: any) => ({
        sourceField: field.name,
        targetField: field.name,
        dataType: field.type
      }));

      console.log('📋 Field mappings created:', fieldMappings);

      if (editingTemplate) {
        // Update existing template
        console.log('📝 Updating existing template:', editingTemplate.id);

        const updatedTemplate = await updateTemplate(editingTemplate.id, {
          name: templateData.name,
          description: templateData.description || '',
          fieldMappings
        });

        console.log('✅ Template updated successfully:', updatedTemplate);

        // Update the template in the list
        setTemplates(prev => prev.map(t =>
          t.id === editingTemplate.id ? updatedTemplate : t
        ));
      } else {
        // Create new template
        console.log('➕ Creating new template');

        const newTemplate = await createTemplate({
          name: templateData.name,
          description: templateData.description || '',
          fieldMappings
        });

        console.log('✅ Template created successfully:', newTemplate);

        // Add the new template to the list
        setTemplates(prev => [newTemplate, ...prev]);
      }

      // Close the editor and reset editing state
      setShowNewTemplateEditor(false);
      setEditingTemplate(null);
      showSuccess(editingTemplate ? 'Template updated successfully' : 'Template created successfully');

      console.log('🎉 Template saved and UI updated');
    } catch (error) {
      console.error('❌ Error saving template:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');

      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`Failed to save template: ${errorMessage}`);
    }
  }, [editingTemplate, showSuccess, showError]);

  const handleCancelTemplate = () => {
    setShowNewTemplateEditor(false);
    setEditingTemplate(null);
  };

  // Handle editing an existing template
  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowNewTemplateEditor(true);
  };

  // Handle duplicating a template
  const handleDuplicateTemplate = useCallback(async (template: Template) => {
    try {
      console.log('🔄 Duplicating template:', template.name);

      const duplicatedTemplate = await duplicateTemplate(template.id);

      console.log('✅ Template duplicated successfully:', duplicatedTemplate);

      // Add the duplicated template to the list
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      showSuccess('Template duplicated successfully');

    } catch (error) {
      console.error('❌ Error duplicating template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`Failed to duplicate template: ${errorMessage}`);
    }
  }, [showSuccess, showError]);

  // Handle deleting a template
  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      console.log('🔄 Deleting template:', templateId);

      await deleteTemplate(templateId);

      console.log('✅ Template deleted successfully');

      // Remove the template from the list
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      showSuccess('Template deleted successfully');

    } catch (error) {
      console.error('❌ Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`Failed to delete template: ${errorMessage}`);
    }
  }, [showSuccess, showError]);

  // Handle setting a template as default
  const handleSetDefaultTemplate = useCallback(async (templateId: string) => {
    try {
      console.log('🔄 Setting default template:', templateId);

      await setDefaultTemplate(templateId);

      console.log('✅ Default template set successfully');

      // Update all templates in the list
      setTemplates(prev => prev.map(t => ({
        ...t,
        isDefault: t.id === templateId
      })));
      showSuccess('Default template updated successfully');

    } catch (error) {
      console.error('❌ Error setting default template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`Failed to set default template: ${errorMessage}`);
    }
  }, [showSuccess, showError]);

  if (showNewTemplateEditor) {
    return (
      <div>
        <div id="header" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                className="mr-3 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
                onClick={handleCancelTemplate}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <div>
                <div className="flex items-center text-sm text-neutral-500 mb-1 font-semibold">
                  <button
                    className="hover:text-neutral-700 transition-colors duration-200"
                    onClick={handleCancelTemplate}
                  >
                    Export Templates
                  </button>
                  <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
                  <span>{editingTemplate ? 'Edit Template' : 'New Template'}</span>
                </div>
                <h2 className="text-2xl font-semibold">
                  {editingTemplate ? 'Edit Export Template' : 'New Export Template'}
                </h2>
                <p className="text-neutral-600">
                  {editingTemplate ? 'Modify fields and their properties' : 'Define fields and their properties'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
                onClick={handleCancelTemplate}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200"
                onClick={() => saveTemplateRef.current?.()}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
        <NewTemplateEditor
          onSave={handleSaveTemplate}
          onCancel={handleCancelTemplate}
          saveRef={saveTemplateRef}
          initialTemplate={editingTemplate}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <div>
      <div id="header" className="mb-8">
        <PageHeader onNew={handleNew} />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <SearchInput value={filter} onChange={setFilter} />
        <TemplatesList
          templates={templates}
          filter={filter}
          onEdit={handleEditTemplate}
          onDuplicate={handleDuplicateTemplate}
          onDelete={handleDeleteTemplate}
          onSetDefault={handleSetDefaultTemplate}
        />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ExportTemplatesPage;
