// src/components/ExportTemplates/PageHeader.tsx

import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

interface PageHeaderProps {
  /** Called when the user clicks "New Template" */
  onNew: () => void;
}

const PageHeader: FC<PageHeaderProps> = ({ onNew }) => (
  <div className="flex justify-between items-center mb-4">
    <div>
      <h2 className="text-2xl font-semibold">Export Templates</h2>
      <p className="text-neutral-600">Manage your export templates and field mappings</p>
    </div>
    <button 
      className="px-4 py-2 bg-neutral-900 text-white rounded-lg flex items-center hover:bg-neutral-800 hover:shadow-sm transition-all duration-200"
      onClick={onNew}
    >
      <FontAwesomeIcon icon={faPlus} className="mr-2" />
      New Template
    </button>
  </div>
);

export default PageHeader;
