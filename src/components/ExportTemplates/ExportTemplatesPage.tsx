// src/components/ExportTemplates/ExportTemplatesPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { Template } from '../../models/Template';
import PageHeader from './PageHeader';
import SearchInput from './SearchInput';
import TemplatesList from './TemplatesList';
import NewTemplateEditor from './NewTemplateEditor';
import Breadcrumbs from '../common/Breadcrumbs';
import styles from './ExportTemplatesPage.module.css';

// Mock data for templates
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Bank Statement Export',
    description: 'Template for exporting bank statements to CSV',
    createdAt: '2023-07-15T10:30:00Z',
    updatedAt: '2023-08-20T14:15:00Z',
    fileType: 'CSV',
    fieldMappings: [
      { sourceField: 'date', targetField: 'Transaction Date' },
      { sourceField: 'amount', targetField: 'Amount' },
      { sourceField: 'description', targetField: 'Description' },
    ],
  },
  {
    id: '2',
    name: 'Customer Data Export',
    description: 'Export customer information for CRM',
    createdAt: '2023-06-10T08:45:00Z',
    updatedAt: '2023-06-10T08:45:00Z',
    fileType: 'XML',
    fieldMappings: [
      { sourceField: 'customerId', targetField: 'ID' },
      { sourceField: 'name', targetField: 'Full Name' },
      { sourceField: 'email', targetField: 'Email Address' },
    ],
  },
  {
    id: '3',
    name: 'Financial Report',
    description: 'Monthly financial report template',
    createdAt: '2023-05-05T16:20:00Z',
    updatedAt: '2023-09-01T11:10:00Z',
    fileType: 'XLSX',
    fieldMappings: [
      { sourceField: 'month', targetField: 'Reporting Period' },
      { sourceField: 'revenue', targetField: 'Total Revenue' },
      { sourceField: 'expenses', targetField: 'Total Expenses' },
    ],
  },
];

const ExportTemplatesPage: FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [showNewTemplateEditor, setShowNewTemplateEditor] = useState<boolean>(false);

  useEffect(() => {
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      setTemplates(mockTemplates);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleNew = () => {
    setShowNewTemplateEditor(true);
  };
  
  const handleSaveTemplate = useCallback((templateData: any) => {
    // Create a new template with the form data
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateData.name,
      description: templateData.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileType: 'CSV', // Default file type
      fieldMappings: templateData.fields.map((field: any) => ({
        sourceField: field.name,
        targetField: field.name,
        transform: field.format
      }))
    };
    
    // Add the new template to the list
    setTemplates(prev => [newTemplate, ...prev]);
    
    // Close the editor
    setShowNewTemplateEditor(false);
  }, []);
  
  const handleCancelTemplate = () => {
    setShowNewTemplateEditor(false);
  };

  // Define breadcrumb items
  const breadcrumbItems = showNewTemplateEditor 
    ? [
        { label: 'Export Templates', path: '/export-templates' },
        { label: 'New Export Template' }
      ]
    : [
        { label: 'Export Templates', path: '/export-templates' }
      ];

  if (showNewTemplateEditor) {
    return (
      <div className={styles.container}>
        <div id="header" className="mb-8">
          <Breadcrumbs 
            items={breadcrumbItems}
            showBackButton={true}
            onBack={handleCancelTemplate}
          />
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl">New Export Template</h2>
              <p className="text-neutral-600">Define fields and their properties</p>
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
                onClick={handleSaveTemplate}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
        <NewTemplateEditor 
          onSave={handleSaveTemplate}
          onCancel={handleCancelTemplate}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div id="header" className="mb-8">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader onNew={handleNew} />
      </div>
      <div className="mb-6">
        <SearchInput value={filter} onChange={setFilter} />
      </div>
      <TemplatesList templates={templates} filter={filter} />
    </div>
  );
};

export default ExportTemplatesPage;
