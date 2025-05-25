import { Template, FieldMapping } from '../models/Template';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate template name
 */
export const validateTemplateName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Template name is required' });
  } else if (name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Template name must be at least 3 characters long' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Template name must be less than 100 characters' });
  }
  
  return errors;
};

/**
 * Validate template description
 */
export const validateTemplateDescription = (description: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (description && description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }
  
  return errors;
};

/**
 * Validate field mappings
 */
export const validateFieldMappings = (fieldMappings: FieldMapping[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!fieldMappings || fieldMappings.length === 0) {
    errors.push({ field: 'fieldMappings', message: 'At least one field mapping is required' });
    return errors;
  }
  
  // Check for duplicate source fields
  const sourceFields = fieldMappings.map(fm => fm.sourceField.trim().toLowerCase());
  const duplicateSourceFields = sourceFields.filter((field, index) => 
    field && sourceFields.indexOf(field) !== index
  );
  
  if (duplicateSourceFields.length > 0) {
    errors.push({ 
      field: 'fieldMappings', 
      message: `Duplicate source fields found: ${[...new Set(duplicateSourceFields)].join(', ')}` 
    });
  }
  
  // Check for empty field names
  fieldMappings.forEach((mapping, index) => {
    if (!mapping.sourceField || mapping.sourceField.trim().length === 0) {
      errors.push({ 
        field: `fieldMappings[${index}].sourceField`, 
        message: `Source field at position ${index + 1} cannot be empty` 
      });
    }
    
    if (!mapping.targetField || mapping.targetField.trim().length === 0) {
      errors.push({ 
        field: `fieldMappings[${index}].targetField`, 
        message: `Target field at position ${index + 1} cannot be empty` 
      });
    }
  });
  
  return errors;
};

// File type validation removed - all templates are JSON format

/**
 * Validate complete template data
 */
export const validateTemplate = (templateData: {
  name: string;
  description: string;
  fieldMappings: FieldMapping[];
}): ValidationResult => {
  const errors: ValidationError[] = [
    ...validateTemplateName(templateData.name),
    ...validateTemplateDescription(templateData.description),
    ...validateFieldMappings(templateData.fieldMappings),
  ];
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate existing template for updates
 */
export const validateTemplateUpdate = (template: Partial<Template>): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (template.name !== undefined) {
    errors.push(...validateTemplateName(template.name));
  }
  
  if (template.description !== undefined) {
    errors.push(...validateTemplateDescription(template.description));
  }
  
  if (template.fieldMappings !== undefined) {
    errors.push(...validateFieldMappings(template.fieldMappings));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 