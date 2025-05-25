// src/components/ExportTemplates/ExportTemplatesPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { Template } from '../../models/Template';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate, setDefaultTemplate } from '../../services/templateService';
import PageHeader from './PageHeader';
import SearchInput from './SearchInput';
import TemplatesList from './TemplatesList';
import NewTemplateEditor from './NewTemplateEditor';
import Breadcrumbs from '../common/Breadcrumbs';



const ExportTemplatesPage: FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [showNewTemplateEditor, setShowNewTemplateEditor] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const saveTemplateRef = useRef<(() => void) | null>(null);

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
        transform: field.format
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
      
      console.log('🎉 Template saved and UI updated');
    } catch (error) {
      console.error('❌ Error saving template:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save template: ${errorMessage}`);
    }
  }, [editingTemplate]);
  
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
      
    } catch (error) {
      console.error('❌ Error duplicating template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to duplicate template: ${errorMessage}`);
    }
  }, []);

  // Handle deleting a template
  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      console.log('🔄 Deleting template:', templateId);
      
      await deleteTemplate(templateId);
      
      console.log('✅ Template deleted successfully');
      
      // Remove the template from the list
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to delete template: ${errorMessage}`);
    }
  }, []);

  // Handle setting a template as default
  const handleSetDefaultTemplate = useCallback(async (templateId: string) => {
    try {
      console.log('🔄 Setting default template:', templateId);
      
      const updatedTemplate = await setDefaultTemplate(templateId);
      
      console.log('✅ Default template set successfully');
      
      // Update all templates in the list
      setTemplates(prev => prev.map(t => ({
        ...t,
        isDefault: t.id === templateId
      })));
      
    } catch (error) {
      console.error('❌ Error setting default template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to set default template: ${errorMessage}`);
    }
  }, []);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (path: string) => {
    if (path === '/export-templates') {
      setShowNewTemplateEditor(false);
      setEditingTemplate(null);
    }
  };

  // Define breadcrumb items
  const breadcrumbItems = showNewTemplateEditor 
    ? [
        { label: 'Export Templates', path: '/export-templates' },
        { label: editingTemplate ? 'Edit Export Template' : 'New Export Template' }
      ]
    : [
        { label: 'Export Templates', path: '/export-templates' }
      ];

  if (showNewTemplateEditor) {
    return (
      <div>
        <div id="header" className="mb-8">
          <Breadcrumbs 
            items={breadcrumbItems}
            showBackButton={true}
            onBack={handleCancelTemplate}
            onNavigate={handleBreadcrumbNavigate}
          />
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl">
                {editingTemplate ? 'Edit Export Template' : 'New Export Template'}
              </h2>
              <p className="text-neutral-600">
                {editingTemplate ? 'Modify fields and their properties' : 'Define fields and their properties'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50"
                onClick={handleCancelTemplate}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
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
      </div>
    );
  }

  return (
    <div>
      <div id="header" className="mb-8">
        <Breadcrumbs items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />
        <PageHeader onNew={handleNew} />
      </div>
      <div className="mb-6">
        <SearchInput value={filter} onChange={setFilter} />
      </div>
      <TemplatesList 
        templates={templates} 
        filter={filter} 
        onEdit={handleEditTemplate}
        onDuplicate={handleDuplicateTemplate}
        onDelete={handleDeleteTemplate}
        onSetDefault={handleSetDefaultTemplate}
      />
    </div>
  );
};

export default ExportTemplatesPage;
