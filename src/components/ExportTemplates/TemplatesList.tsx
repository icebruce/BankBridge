import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faChevronLeft, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';
import { Template } from '../../models/Template';
import DataTable, { DataTableColumn, DataTablePresets } from '../common/DataTable';
import TableActions, { TableActionPresets } from '../common/TableActions';

interface TemplatesListProps {
  templates: Template[];
  filter: string;
  onEdit: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onSetDefault: (templateId: string) => void;
}

const TemplatesList: React.FC<TemplatesListProps> = ({ 
  templates, 
  filter, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onSetDefault 
}) => {
  // Filter templates based on the search input
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(filter.toLowerCase()) ||
    template.description.toLowerCase().includes(filter.toLowerCase())
  );

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle template editing
  const handleEdit = (template: Template) => {
    onEdit(template);
  };

  // Handle template duplication
  const handleDuplicate = (template: Template) => {
    onDuplicate(template);
  };

  // Handle template deletion
  const handleDelete = (template: Template) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      onDelete(template.id);
    }
  };

  // Define table columns
  const columns: DataTableColumn<Template>[] = [
    {
      key: 'name',
      header: 'Template Name',
      width: '250px',
      render: (value) => (
        <span className="font-medium text-neutral-900">{value}</span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      width: '300px',
      render: (value) => (
        <span className="text-neutral-600">{value}</span>
      )
    },
    {
      key: 'updatedAt',
      header: 'Last Modified',
      width: '160px',
      render: (value) => (
        <span className="text-neutral-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'fieldMappings',
      header: 'Fields',
      width: '100px',
      render: (value) => (
        <span className="text-neutral-600">{value.length}</span>
      )
    },
    {
      key: 'isDefault',
      header: 'Status',
      width: '140px',
      render: (value, template) => (
        value ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Default
          </span>
        ) : (
          <button 
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-none cursor-pointer transition-colors duration-200"
            onClick={() => onSetDefault(template.id)}
          >
            Set as Default
          </button>
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (_, template) => (
        <TableActions
          actions={TableActionPresets.crudWithDuplicate(
            () => handleEdit(template),
            () => handleDuplicate(template),
            () => handleDelete(template)
          )}
          className="justify-center"
        />
      )
    }
  ];

  // Footer with pagination arrows to match Import Templates design
  const footer = (
    <div className="flex items-center justify-between">
      <div className="text-sm text-neutral-600">
        Showing {filteredTemplates.length === 0 ? 0 : 1}-{filteredTemplates.length} of {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
      </div>
      <div className="flex gap-2">
        <button 
          className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200" 
          disabled={true}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button 
          className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200" 
          disabled={true}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={filteredTemplates}
      loading={false}
      title="Templates"
      emptyMessage={filter ? 'No matching templates found.' : 'No templates available.'}
      emptyIcon={<FontAwesomeIcon icon={faExclamationTriangle} />}
      footer={footer}
      {...DataTablePresets.standard}
      minWidth="1190px"
    />
  );
};

export default TemplatesList;
