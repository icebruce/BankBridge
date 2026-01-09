export interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  fieldCount: number;
  /** @deprecated Use accountId instead. Kept for backward compatibility. */
  account: string;
  /** References Account.id from Settings - the primary way to link to an account */
  accountId?: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  status: 'Active' | 'Inactive' | 'Draft';
  fieldMappings: ImportFieldMapping[];
  isDefault?: boolean;
  fieldCombinations?: FieldCombination[];
  sourceFields?: string[];  // Store column headers from original file for edit mode
}

export interface FieldCombination {
  id: string;
  targetField: string;
  delimiter: string;
  customDelimiter?: string;
  sourceFields: SourceField[];
}

export interface SourceField {
  id: string;
  fieldName: string;
  order: number;
}

export interface ImportFieldMapping {
  sourceField: string;
  targetField: string;
  dataType?: string;
  required?: boolean;
  transform?: string;
  validation?: string;
}

export interface ImportAccount {
  id: string;
  name: string;
  description?: string;
}

export interface ImportFileType {
  id: string;
  name: string;
  description?: string;
  extensions: string[];
} 