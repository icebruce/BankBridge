import React from 'react';
import { Template } from '../../models/Template';

interface TemplateRowProps {
  template: Template;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const TemplateRow: React.FC<TemplateRowProps> = ({ template, onEdit, onDelete }) => {
  // Format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-lg">{template.name}</h3>
          <p className="text-neutral-600 text-sm">{template.description}</p>
        </div>
        <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">
          {template.fileType}
        </span>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-xs text-neutral-500">
          Last updated: {formatDate(template.updatedAt)}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(template.id)}
            className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(template.id)}
            className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateRow;
