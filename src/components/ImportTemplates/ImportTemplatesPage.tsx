// e.g. src/components/ExportTemplates/ExportTemplatesPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate } from '../../models/ImportTemplate';
import ImportTemplatesList from './ImportTemplatesList';
import SearchAndFilters from './SearchAndFilters';
import NewImportTemplateEditor from './NewImportTemplateEditor';
import FieldCombinationEditor from './FieldCombinationEditor';

const ImportTemplatesPage: FC = () => {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('All Accounts');
  const [selectedFileType, setSelectedFileType] = useState<string>('All File Types');
  const [loading, setLoading] = useState<boolean>(true);
  const [showNewTemplateEditor, setShowNewTemplateEditor] = useState<boolean>(false);
  const [showFieldCombinationEditor, setShowFieldCombinationEditor] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<ImportTemplate | null>(null);
  const saveTemplateRef = useRef<(() => void) | null>(null);

  // Mock data for initial development
  const mockTemplates: ImportTemplate[] = [
    {
      id: 'import_template_1',
      name: 'Sales Import Template',
      description: 'Template for importing sales data',
      fieldCount: 24,
      account: 'Account 1',
      fileType: 'Sales Data',
      createdAt: '2025-04-20T10:00:00Z',
      updatedAt: '2025-04-26T14:30:00Z',
      schemaVersion: '1.0.0',
      status: 'Active',
      fieldMappings: [],
      isDefault: false
    },
    {
      id: 'import_template_2',
      name: 'Customer Import Template',
      description: 'Template for importing customer information',
      fieldCount: 18,
      account: 'Account 2',
      fileType: 'Customer Data',
      createdAt: '2025-04-22T09:15:00Z',
      updatedAt: '2025-04-24T16:45:00Z',
      schemaVersion: '1.0.0',
      status: 'Active',
      fieldMappings: [],
      isDefault: false
    }
  ];

  useEffect(() => {
    // Simulate loading templates
    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 500);
  }, []);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setShowNewTemplateEditor(true);
  };

  const handleEditTemplate = (template: ImportTemplate) => {
    setEditingTemplate(template);
    setShowNewTemplateEditor(true);
  };

  const handleDuplicateTemplate = (template: ImportTemplate) => {
    console.log('Duplicating template:', template.name);
    // TODO: Implement template duplication
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      console.log('Deleted template:', templateId);
    }
  };

  const handleSaveTemplate = useCallback(async (templateData: any) => {
    try {
      console.log('🔄 Saving import template with data:', templateData);
      
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
        sourceField: field.sourceField,
        targetField: field.targetField,
        dataType: field.dataType,
        required: false,
        validation: ''
      }));

      console.log('📋 Field mappings created:', fieldMappings);

      const now = new Date().toISOString();
      
      if (editingTemplate) {
        // Update existing template
        console.log('📝 Updating existing template:', editingTemplate.id);
        
        const updatedTemplate: ImportTemplate = {
          ...editingTemplate,
          name: templateData.name,
          description: '',
          account: 'Account 1',
          fileType: templateData.sourceFileType,
          status: 'Active',
          fieldCount: fieldMappings.length,
          updatedAt: now,
          fieldMappings
        };
        
        console.log('✅ Template updated successfully:', updatedTemplate);
        
        // Update the template in the list
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? updatedTemplate : t
        ));
      } else {
        // Create new template
        console.log('➕ Creating new template');
        
        const newTemplate: ImportTemplate = {
          id: `import_template_${Date.now()}`,
          name: templateData.name,
          description: '',
          fieldCount: fieldMappings.length,
          account: 'Account 1',
          fileType: templateData.sourceFileType,
          createdAt: now,
          updatedAt: now,
          schemaVersion: '1.0.0',
          status: 'Active',
          fieldMappings,
          isDefault: false
        };
        
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
    setShowFieldCombinationEditor(false);
    setEditingTemplate(null);
  };

  const handleAddFieldCombination = () => {
    setShowFieldCombinationEditor(true);
  };

  const handleSaveFieldCombination = (combination: any) => {
    console.log('Field combination saved:', combination);
    // TODO: Integrate with template editor
    setShowFieldCombinationEditor(false);
  };

  const handleCancelFieldCombination = () => {
    setShowFieldCombinationEditor(false);
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
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                  onClick={() => saveTemplateRef.current?.()}
                >
                  Save Template
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

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
              selectedFileType={selectedFileType}
              onFileTypeChange={setSelectedFileType}
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
