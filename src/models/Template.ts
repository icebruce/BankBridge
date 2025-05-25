export interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  fieldMappings: FieldMapping[];
  isDefault?: boolean;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: string;
} 