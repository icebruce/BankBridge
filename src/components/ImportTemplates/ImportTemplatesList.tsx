// ImportTemplatesList component
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faClone,
  faChevronLeft, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';
import { ImportTemplate } from '../../models/ImportTemplate';
import styles from './ImportTemplatesList.module.css';

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

  if (loading) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Templates</h3>
        <div className="p-8 text-center">
          <div className="text-neutral-500">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Templates</h3>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Template Name</th>
              <th className={styles.th}>Fields</th>
              <th className={styles.th}>Account</th>
              <th className={styles.th}>File Type</th>
              <th className={styles.th}>Last Modified</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th + " text-center"}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.rowDivide}>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-neutral-500">
                  No templates found. Create your first import template to get started.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id}>
                  <td className={styles.td}>{template.name}</td>
                  <td className={styles.td}>{template.fieldCount} fields</td>
                  <td className={styles.td}>{template.account}</td>
                  <td className={styles.td}>{template.fileType}</td>
                  <td className={styles.td}>{formatDate(template.updatedAt)}</td>
                  <td className={styles.td}>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      template.status === 'Active' 
                        ? 'bg-neutral-100 text-neutral-800'
                        : template.status === 'Inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {template.status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionGroup + " justify-center"}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleEdit(template)}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleDuplicate(template)}
                        title="Duplicate"
                      >
                        <FontAwesomeIcon icon={faClone} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleDelete(template)}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-neutral-200 flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          Showing 1-{templates.length} of {templates.length} templates
        </div>
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50" 
            disabled={true}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button 
            className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50" 
            disabled={true}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportTemplatesList; 