// ImportTemplatesList component
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faChevronLeft, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate } from '../../models/ImportTemplate';
import DataTable, { DataTableColumn, DataTablePresets } from '../common/DataTable';
import TableActions, { TableActionPresets } from '../common/TableActions';

interface ImportTemplatesListProps {
  templates: ImportTemplate[];
  loading: boolean;
  onEdit: (template: ImportTemplate) => void;
  onDuplicate: (template: ImportTemplate) => void;
  onDelete: (templateId: string) => void;
}

const ImportTemplatesList: FC<ImportTemplatesListProps> = ({
  templates,
  loading,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleEdit = (template: ImportTemplate) => {
    onEdit(template);
  };

  const handleDuplicate = (template: ImportTemplate) => {
    onDuplicate(template);
  };

  const handleDelete = (template: ImportTemplate) => {
    onDelete(template.id);
  };

  // Define table columns with better responsive widths
  const columns: DataTableColumn<ImportTemplate>[] = [
    {
      key: 'name',
      header: 'Template Name',
      width: '250px', // Increased for better text display
      render: (value) => (
        <span className="font-medium text-neutral-900">{value}</span>
      )
    },
    {
      key: 'fieldCount',
      header: 'Fields',
      width: '120px', // Increased slightly
      render: (value) => (
        <span className="text-neutral-600">{value} fields</span>
      )
    },
    {
      key: 'account',
      header: 'Account',
      width: '140px', // Increased for better spacing
      render: (value) => (
        <span className="text-neutral-600">{value}</span>
      )
    },
    {
      key: 'fileType',
      header: 'File Type',
      width: '140px', // Increased for better spacing
      render: (value) => (
        <span className="text-neutral-600">{value}</span>
      )
    },
    {
      key: 'updatedAt',
      header: 'Last Modified',
      width: '160px', // Increased for date display
      render: (value) => (
        <span className="text-neutral-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px', // Increased for badge display
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'Active'
            ? 'bg-green-100 text-green-800'
            : value === 'Inactive'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px', // Increased for action buttons
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

  // Footer with pagination
  const footer = (
    <div className="flex items-center justify-between">
      <div className="text-sm text-neutral-600">
        Showing 1-{templates.length} of {templates.length} templates
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
      data={templates}
      loading={loading}
      title="Templates"
      emptyMessage="No templates found. Create your first import template to get started."
      emptyIcon={<FontAwesomeIcon icon={faExclamationTriangle} />}
      footer={footer}
      {...DataTablePresets.standard}
      minWidth="1110px"
    />
  );
};

export default ImportTemplatesList; 