// e.g. src/components/ExportTemplates/ExportTemplatesPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate, FieldCombination } from '../../models/ImportTemplate';
import { fetchImportTemplates, createImportTemplate, updateImportTemplate, deleteImportTemplate, duplicateImportTemplate } from '../../services/importTemplateService';
import { getDefaultTemplate } from '../../services/templateService';
import { Template } from '../../models/Template';
import ImportTemplatesList from './ImportTemplatesList';
import SearchAndFilters from './SearchAndFilters';
import NewImportTemplateEditor from './NewImportTemplateEditor';
import FieldCombinationEditor from './FieldCombinationEditor';

const ImportTemplatesPage: FC = () => {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [defaultExportTemplate, setDefaultExportTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('All Accounts');
  const [selectedFileType, setSelectedFileType] = useState<string>('All File Types');
  const [loading, setLoading] = useState<boolean>(true);
  const [showNewTemplateEditor, setShowNewTemplateEditor] = useState<boolean>(false);
  const [showFieldCombinationEditor, setShowFieldCombinationEditor] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<ImportTemplate | null>(null);
  const [currentTemplateData, setCurrentTemplateData] = useState<any>(null);
  const [uploadedFileFields, setUploadedFileFields] = useState<string[]>([]);
  const [editingFieldCombination, setEditingFieldCombination] = useState<FieldCombination | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveTemplateRef = useRef<(() => void) | null>(null);
  const fieldCombinationsRef = useRef<{
    updateFieldCombinations: (combinations: FieldCombination[]) => void;
    getFieldCombinations: () => FieldCombination[];
  } | null>(null);

  useEffect(() => {
    // Load import templates and default export template
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const [importTemplates, defaultTemplate] = await Promise.all([
          fetchImportTemplates(),
          getDefaultTemplate()
        ]);
        setTemplates(importTemplates);
        setDefaultExportTemplate(defaultTemplate || null);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates([]);
        setDefaultExportTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setShowNewTemplateEditor(true);
  };

  const handleEditTemplate = (template: ImportTemplate) => {
    setEditingTemplate(template);
    setCurrentTemplateData(null);
    setShowNewTemplateEditor(true);
  };

  const handleDuplicateTemplate = async (template: ImportTemplate) => {
    try {
      setPageError(null);
      const duplicatedTemplate = await duplicateImportTemplate(template.id);
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      setSuccessMessage(`Template "${duplicatedTemplate.name}" created`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error duplicating template:', error);
      setPageError('Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        setPageError(null);
        await deleteImportTemplate(templateId);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        setSuccessMessage('Template deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Error deleting template:', error);
        setPageError('Failed to delete template');
      }
    }
  };

  const handleSaveTemplate = useCallback(async (templateData: any) => {
    try {
      setIsSaving(true);

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
      
      // Create field mappings from the form data (excluding combined fields)
      const fieldMappings = templateData.fields
        .filter((field: any) => field.actions !== 'Combined')
        .map((field: any) => ({
          sourceField: field.sourceField,
          targetField: field.targetField,
          dataType: field.dataType,
          required: false,
          validation: ''
        }));

      if (editingTemplate) {
        // Update existing template

        const updatedTemplate = await updateImportTemplate(editingTemplate.id, {
          name: templateData.name,
          description: templateData.description || '',
          account: templateData.account || '',
          fileType: templateData.sourceFileType,
          status: templateData.status || 'Active',
          fieldCount: fieldMappings.length,
          fieldMappings,
          fieldCombinations: templateData.fieldCombinations || []
        });

        // Update the template in the list
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? updatedTemplate : t
        ));
      } else {
        // Create new template
        const newTemplate = await createImportTemplate({
          name: templateData.name,
          description: templateData.description || '',
          account: templateData.account || '',
          fileType: templateData.sourceFileType,
          status: templateData.status || 'Active',
          fieldMappings,
          fieldCombinations: templateData.fieldCombinations || []
        });

        // Add the new template to the list
        setTemplates(prev => [newTemplate, ...prev]);
      }
      
      // Close the editor and reset editing state
      setShowNewTemplateEditor(false);
      setEditingTemplate(null);
      setCurrentTemplateData(null);
      setPageError(null);
      setSuccessMessage('Template saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setPageError(`Failed to save template: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [editingTemplate]);
  
  const handleCancelTemplate = () => {
    setShowNewTemplateEditor(false);
    setShowFieldCombinationEditor(false);
    setEditingTemplate(null);
    setCurrentTemplateData(null);
  };

  const handleAddFieldCombination = (templateData: any, uploadedFields: string[]) => {
    setCurrentTemplateData(templateData);
    setUploadedFileFields(uploadedFields);
    setEditingFieldCombination(templateData.editingCombination || null);
    setShowFieldCombinationEditor(true);
  };

  const handleSaveFieldCombination = (combination: FieldCombination) => {
    // Get current field combinations from the template editor
    const currentCombinations = fieldCombinationsRef.current?.getFieldCombinations() || [];
    
    let updatedCombinations;
    if (editingFieldCombination) {
      // Update existing combination
      updatedCombinations = currentCombinations.map((c: FieldCombination) => 
        c.id === combination.id ? combination : c
      );
    } else {
      // Add new combination
      updatedCombinations = [...currentCombinations, combination];
    }
    
    // Update field combinations directly in the template editor
    fieldCombinationsRef.current?.updateFieldCombinations(updatedCombinations);
    
    // Also update currentTemplateData for consistency
    if (currentTemplateData) {
      const updatedTemplateData = {
        ...currentTemplateData,
        fieldCombinations: updatedCombinations
      };
      setCurrentTemplateData(updatedTemplateData);
    }
    
    setShowFieldCombinationEditor(false);
    setEditingFieldCombination(null);
  };

  const handleCancelFieldCombination = () => {
    // When canceling, preserve the current field combinations in currentTemplateData
    if (currentTemplateData && fieldCombinationsRef.current) {
      const currentCombinations = fieldCombinationsRef.current.getFieldCombinations();
      const updatedTemplateData = {
        ...currentTemplateData,
        fieldCombinations: currentCombinations
      };
      setCurrentTemplateData(updatedTemplateData);
    }
    
    setShowFieldCombinationEditor(false);
    setEditingFieldCombination(null);
  };

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAccount = selectedAccount === 'All Accounts' || template.account === selectedAccount;
    const matchesFileType = selectedFileType === 'All File Types' || template.fileType === selectedFileType;
    
    return matchesSearch && matchesAccount && matchesFileType;
  });



  return (
    <div>
      {showFieldCombinationEditor ? (
        // Show field combination editor
        <FieldCombinationEditor
          onSave={handleSaveFieldCombination}
          onCancel={handleCancelFieldCombination}
          availableSourceFields={uploadedFileFields}
          availableTargetFields={defaultExportTemplate?.fieldMappings.map(mapping => mapping.targetField) || []}
          editingCombination={editingFieldCombination}
        />
      ) : showNewTemplateEditor ? (
        // Show template editor
        <div>
          <div id="header" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button 
                  className="mr-3 text-neutral-600"
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
                      Import Templates
                    </button>
                    <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
                    <span>{editingTemplate ? 'Edit Template' : 'New Template'}</span>
                  </div>
                  <h2 className="text-2xl font-semibold">{editingTemplate ? 'Edit Import Template' : 'New Import Template'}</h2>
                  <p className="text-neutral-600">Create a new template from source file</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
                  onClick={handleCancelTemplate}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-neutral-900 text-white rounded-lg transition-all duration-200 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-neutral-800'}`}
                  onClick={() => saveTemplateRef.current?.()}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>

          <NewImportTemplateEditor
            onSave={handleSaveTemplate}
            onCancel={handleCancelTemplate}
            saveRef={saveTemplateRef}
            initialTemplate={editingTemplate}
            onAddFieldCombination={handleAddFieldCombination}
            currentTemplateData={currentTemplateData}
            defaultExportTemplate={defaultExportTemplate}
            fieldCombinationsRef={fieldCombinationsRef}
            existingTemplates={templates}
          />
        </div>
      ) : (
        // Show template list
        <div>
          <div id="header" className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold">Import Templates</h2>
                <p className="text-neutral-600">Manage your import templates</p>
              </div>
              <button 
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 flex items-center"
                onClick={handleNewTemplate}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                New Template
              </button>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {pageError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {pageError}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
              selectedFileType={selectedFileType}
              onFileTypeChange={setSelectedFileType}
              accounts={[...new Set(templates.map(t => t.account).filter(Boolean))]}
              fileTypes={[...new Set(templates.map(t => t.fileType).filter(Boolean))]}
            />

            <ImportTemplatesList
              templates={filteredTemplates}
              loading={loading}
              onEdit={handleEditTemplate}
              onDuplicate={handleDuplicateTemplate}
              onDelete={handleDeleteTemplate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportTemplatesPage;
