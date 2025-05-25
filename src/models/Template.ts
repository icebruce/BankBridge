export interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  fileType: string;
  fieldMappings: FieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: string;
} 