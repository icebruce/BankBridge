import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faClone,
  faEye,
  faDownload,
  faShare,
  faArchive,
  faUndo
} from '@fortawesome/free-solid-svg-icons';

export interface TableAction {
  icon: any;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
}

export interface TableActionsProps {
  actions: TableAction[];
  size?: 'sm' | 'md';
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

const TableActions: React.FC<TableActionsProps> = ({
  actions,
  size = 'sm',
  layout = 'horizontal',
  className = ''
}) => {
  const getButtonClasses = (variant: TableAction['variant'] = 'default') => {
    const baseClasses = size === 'sm' 
      ? "p-1.5 rounded transition-all duration-200 hover:scale-105 hover:shadow-sm"
      : "p-2 rounded transition-all duration-200 hover:scale-105 hover:shadow-sm";
    
    const iconSize = size === 'sm' ? 'text-xs' : 'text-sm';
    
    switch (variant) {
      case 'danger':
        return `${baseClasses} hover:bg-red-50 hover:text-red-600 text-neutral-600 ${iconSize}`;
      case 'success':
        return `${baseClasses} hover:bg-green-50 hover:text-green-600 text-neutral-600 ${iconSize}`;
      case 'warning':
        return `${baseClasses} hover:bg-yellow-50 hover:text-yellow-600 text-neutral-600 ${iconSize}`;
      default:
        return `${baseClasses} hover:bg-neutral-100 hover:text-neutral-800 text-neutral-600 ${iconSize}`;
    }
  };

  const containerClasses = layout === 'horizontal' 
    ? `flex gap-1 ${className}`
    : `flex flex-col gap-1 ${className}`;

  return (
    <div className={containerClasses}>
      {actions.map((action, index) => (
        <button
          key={index}
          className={`${getButtonClasses(action.variant)} transition-colors ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={action.onClick}
          title={action.label}
          disabled={action.disabled}
        >
          <FontAwesomeIcon icon={action.icon} />
        </button>
      ))}
    </div>
  );
};

// Common action presets
export const TableActionPresets = {
  // Standard CRUD actions
  crud: (onEdit: () => void, onDelete: () => void): TableAction[] => [
    {
      icon: faEdit,
      label: 'Edit',
      onClick: onEdit
    },
    {
      icon: faTrash,
      label: 'Delete',
      onClick: onDelete,
      variant: 'danger' as const
    }
  ],

  // Extended CRUD with duplicate
  crudWithDuplicate: (onEdit: () => void, onDuplicate: () => void, onDelete: () => void): TableAction[] => [
    {
      icon: faEdit,
      label: 'Edit',
      onClick: onEdit
    },
    {
      icon: faClone,
      label: 'Duplicate',
      onClick: onDuplicate
    },
    {
      icon: faTrash,
      label: 'Delete',
      onClick: onDelete,
      variant: 'danger' as const
    }
  ],

  // View and download actions
  viewAndDownload: (onView: () => void, onDownload: () => void): TableAction[] => [
    {
      icon: faEye,
      label: 'View',
      onClick: onView
    },
    {
      icon: faDownload,
      label: 'Download',
      onClick: onDownload
    }
  ],

  // Archive and restore actions
  archiveRestore: (onArchive: () => void, onRestore: () => void, isArchived: boolean): TableAction[] => [
    isArchived ? {
      icon: faUndo,
      label: 'Restore',
      onClick: onRestore,
      variant: 'success' as const
    } : {
      icon: faArchive,
      label: 'Archive',
      onClick: onArchive,
      variant: 'warning' as const
    }
  ]
};

export default TableActions; 