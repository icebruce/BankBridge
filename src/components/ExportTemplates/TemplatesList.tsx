import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faClone } from '@fortawesome/free-solid-svg-icons';
import { Template } from '../../models/Template';
import styles from './TemplatesList.module.css';

interface TemplatesListProps {
  templates: Template[];
  filter: string;
}

const TemplatesList: React.FC<TemplatesListProps> = ({ templates, filter }) => {
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
  const handleEdit = (id: string) => {
    console.log(`Editing template: ${id}`);
    // TODO: Implement template editing functionality
  };

  // Handle template duplication
  const handleDuplicate = (id: string) => {
    console.log(`Duplicating template: ${id}`);
    // TODO: Implement template duplication functionality
  };

  // Handle template deletion
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      console.log(`Deleting template: ${id}`);
      // TODO: Implement template deletion functionality
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Templates</h3>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Template Name</th>
              <th className={styles.th}>Description</th>
              <th className={styles.th}>Last Modified</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Fields</th>
              <th className={styles.th + " text-center"}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.rowDivide}>
            {filteredTemplates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-neutral-500">
                  {filter ? 'No matching templates found.' : 'No templates available.'}
                </td>
              </tr>
            ) : (
              filteredTemplates.map((template) => (
                <tr key={template.id}>
                  <td className={styles.td}>{template.name}</td>
                  <td className={styles.td}>{template.description}</td>
                  <td className={styles.td}>{formatDate(template.updatedAt)}</td>
                  <td className={styles.td}>
                    <span className={styles.statusBadge}>{template.fileType}</span>
                  </td>
                  <td className={styles.td}>{template.fieldMappings.length}</td>
                  <td className={styles.td}>
                    <div className={styles.actionGroup + " justify-center"}>
                      <button 
                        className={styles.actionBtn} 
                        title="Edit"
                        onClick={() => handleEdit(template.id)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className={styles.actionBtn} 
                        title="Clone"
                        onClick={() => handleDuplicate(template.id)}
                      >
                        <FontAwesomeIcon icon={faClone} />
                      </button>
                      <button 
                        className={styles.actionBtn} 
                        title="Delete"
                        onClick={() => handleDelete(template.id)}
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
    </div>
  );
};

export default TemplatesList;
