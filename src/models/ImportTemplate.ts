export interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  fieldCount: number;
  account: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  status: 'Active' | 'Inactive' | 'Draft';
  fieldMappings: ImportFieldMapping[];
  isDefault?: boolean;
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