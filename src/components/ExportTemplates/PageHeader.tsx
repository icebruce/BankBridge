// src/components/ExportTemplates/PageHeader.tsx

import React from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  /** Called when the user clicks “New Template” */
  onNew: () => void;
}

const PageHeader: FC<PageHeaderProps> = ({ onNew }) => (
  <div className={styles.wrapper}>
    <div className={styles.titles}>
      <h2 className={styles.title}>Export Templates</h2>
      <p className={styles.subtitle}>Manage your export templates and field mappings</p>
    </div>
    <button className={styles.newButton} onClick={onNew}>
      <FontAwesomeIcon icon={faPlus} className={styles.icon} />
      New Template
    </button>
  </div>
);

export default PageHeader;
