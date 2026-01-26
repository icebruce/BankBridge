// e.g. src/components/ExportTemplates/ExportTemplatesPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft, faChevronRight, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate, FieldCombination } from '../../models/ImportTemplate';
import { Account } from '../../models/Settings';
import { fetchImportTemplates, createImportTemplate, updateImportTemplate, deleteImportTemplate, duplicateImportTemplate } from '../../services/importTemplateService';
import { getDefaultTemplate } from '../../services/templateService';
import { getAccounts } from '../../services/settingsService';
import { Template, getInternalField } from '../../models/Template';
import { INTERNAL_FIELDS } from '../../models/MasterData';
import ImportTemplatesList from './ImportTemplatesList';
import SearchAndFilters from './SearchAndFilters';
import NewImportTemplateEditor from './NewImportTemplateEditor';
import FieldCombinationEditor from './FieldCombinationEditor';
import { useToast, ToastContainer } from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';

const ImportTemplatesPage: FC = () => {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<ImportTemplate | null>(null);
  const saveTemplateRef = useRef<(() => void) | null>(null);
  const fieldCombinationsRef = useRef<{
    updateFieldCombinations: (combinations: FieldCombination[]) => void;
    getFieldCombinations: () => FieldCombination[];
  } | null>(null);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  useEffect(() => {
    // Load import templates, accounts, and default export template
    const loadData = async () => {
      try {
        setLoading(true);
        const [importTemplates, defaultTemplate, loadedAccounts] = await Promise.all([
          fetchImportTemplates(),
          getDefaultTemplate(),
          getAccounts()
        ]);
        setTemplates(importTemplates);
        setDefaultExportTemplate(defaultTemplate || null);
        setAccounts(loadedAccounts);
      } catch (error) {
        console.error('Error loading data:', error);
        setTemplates([]);
        setDefaultExportTemplate(null);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      const duplicatedTemplate = await duplicateImportTemplate(template.id);
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      showSuccess(`Template "${duplicatedTemplate.name}" created`);
    } catch (error) {
      console.error('Error duplicating template:', error);
      showError('Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (template: ImportTemplate) => {
    setDeleteTarget(template);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteImportTemplate(deleteTarget.id);
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      showSuccess('Template deleted successfully');
    } catch (error) {
      showError('Failed to delete template');
    } finally {
      setDeleteTarget(null);
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
          accountId: templateData.accountId || '',
          fileType: templateData.sourceFileType,
          status: templateData.status || 'Active',
          fieldCount: fieldMappings.length,
          fieldMappings,
          fieldCombinations: templateData.fieldCombinations || [],
          sourceFields: templateData.sourceFields || []
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
          accountId: templateData.accountId || '',
          fileType: templateData.sourceFileType,
          status: templateData.status || 'Active',
          fieldMappings,
          fieldCombinations: templateData.fieldCombinations || [],
          sourceFields: templateData.sourceFields || []
        });

        // Add the new template to the list
        setTemplates(prev => [newTemplate, ...prev]);
      }

      // Close the editor and reset editing state
      setShowNewTemplateEditor(false);
      setEditingTemplate(null);
      setCurrentTemplateData(null);
      showSuccess('Template saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`Failed to save template: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [editingTemplate, showSuccess, showError]);

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
          availableTargetFields={
            defaultExportTemplate
              ? (defaultExportTemplate.fieldMappings || [])
                  .map(m => getInternalField(m))
                  .filter(Boolean)
                  .filter(f => f !== 'exportDisplayName')
                  .filter((v, i, a) => a.indexOf(v) === i)
              : INTERNAL_FIELDS.filter(f => f !== 'exportDisplayName')
          }
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
                  aria-label="Go back to templates list"
                >
                  <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
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
            accounts={accounts}
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
                className={`px-4 py-2 rounded-lg flex items-center ${
                  accounts.length === 0
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
                onClick={handleNewTemplate}
                disabled={accounts.length === 0}
                title={accounts.length === 0 ? 'Configure accounts in Settings first' : undefined}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                New Template
              </button>
            </div>
          </div>

          {/* Setup incomplete warning */}
          {accounts.length === 0 && !loading && (
            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">No accounts configured.</span>{' '}
                Please configure accounts in Settings before creating import templates.{' '}
                <a href="#" className="text-amber-900 underline hover:no-underline" onClick={(e) => {
                  e.preventDefault();
                  // Navigate to Settings - this would be handled by parent/router
                  window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'settings' } }));
                }}>Go to Settings</a>
              </div>
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
              accounts={accounts}
              loading={loading}
              onEdit={handleEditTemplate}
              onDuplicate={handleDuplicateTemplate}
              onDelete={handleDeleteTemplate}
            />
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ImportTemplatesPage;
