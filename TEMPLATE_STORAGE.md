# Export Template Storage Implementation

This document describes how export templates are saved and managed in the BankBridge application.

## Overview

Export templates are saved as JSON in the browser's local storage with the following features:
- **Unique IDs**: Each template gets a unique identifier
- **Timestamps**: `createdAt` and `updatedAt` fields track when templates are created and modified
- **Schema Versioning**: `schemaVersion` field allows for future data migrations
- **Validation**: All template data is validated before saving
- **Persistence**: Templates persist across browser sessions

## Data Structure

### Template Model
```typescript
interface Template {
  id: string;              // Unique identifier (e.g., "template_1699123456789_abc123def")
  name: string;            // Template name
  description: string;     // Template description
  createdAt: string;       // ISO timestamp when created
  updatedAt: string;       // ISO timestamp when last updated
  schemaVersion: string;   // Current schema version (e.g., "1.0.0")
  fileType: string;        // Export file type (CSV, XML, XLSX, etc.)
  fieldMappings: FieldMapping[];
}

interface FieldMapping {
  sourceField: string;     // Source field name
  targetField: string;     // Target field name
  transform?: string;      // Optional transformation/format
}
```

### Storage Format
Templates are stored in localStorage under the key `bankbridge_export_templates` with this structure:
```json
{
  "templates": [
    {
      "id": "template_1699123456789_abc123def",
      "name": "Bank Statement Export",
      "description": "Template for exporting bank statements to CSV",
      "createdAt": "2023-11-05T10:30:45.123Z",
      "updatedAt": "2023-11-05T10:30:45.123Z",
      "schemaVersion": "1.0.0",
      "fileType": "CSV",
      "fieldMappings": [
        {
          "sourceField": "date",
          "targetField": "Transaction Date",
          "transform": "YYYY-MM-DD"
        }
      ]
    }
  ],
  "lastUpdated": "2023-11-05T10:30:45.123Z",
  "schemaVersion": "1.0.0"
}
```

## Key Components

### 1. Local Storage Service (`src/services/localStorageService.ts`)
Handles low-level storage operations:
- `loadTemplatesFromStorage()` - Load templates from localStorage
- `saveTemplatesToStorage()` - Save templates to localStorage
- `generateTemplateId()` - Generate unique template IDs
- `getCurrentTimestamp()` - Get current ISO timestamp
- `getStorageInfo()` - Get storage usage statistics

### 2. Template Service (`src/services/templateService.ts`)
Provides high-level CRUD operations:
- `fetchTemplates()` - Get all templates
- `createTemplate()` - Create new template with validation
- `updateTemplate()` - Update existing template
- `deleteTemplate()` - Delete template
- `duplicateTemplate()` - Duplicate existing template

### 3. Validation Service (`src/services/templateValidation.ts`)
Validates template data:
- Template name (required, 3-100 characters)
- Description (optional, max 500 characters)
- File type (must be valid: CSV, XML, XLSX, JSON, TXT)
- Field mappings (at least one required, no duplicates)

### 4. Debug Utilities (`src/services/templateDebugUtils.ts`)
Development tools for inspecting and managing templates:
- `logStoredTemplates()` - Log all templates to console
- `exportTemplatesAsJSON()` - Export templates as JSON string
- `importTemplatesFromJSON()` - Import templates from JSON
- `resetTemplates()` - Clear all templates

## Usage

### Creating a New Template
When a user creates a new template through the UI:

1. User fills out the template form in `NewTemplateEditor`
2. Form data is passed to `handleSaveTemplate` in `ExportTemplatesPage`
3. Data is validated using `validateTemplate`
4. If valid, `createTemplate` service creates the template with:
   - Generated unique ID
   - Current timestamps for `createdAt` and `updatedAt`
   - Current schema version
   - Validated and cleaned data
5. Template is saved to localStorage
6. UI is updated with the new template

### Template ID Generation
Template IDs follow this format: `template_{timestamp}_{random}`
- Example: `template_1699123456789_abc123def`
- Ensures uniqueness across time and random collision avoidance

### Schema Versioning
The current schema version is `1.0.0`. This allows for future data migrations if the template structure changes.

## Development Tools

In development mode, debug utilities are available in the browser console:

```javascript
// View all stored templates
templateDebug.logTemplates()

// View storage statistics
templateDebug.logStats()

// Export templates as JSON (for backup)
const backup = templateDebug.exportJSON()

// Import templates from JSON
templateDebug.importJSON(jsonString)

// Reset all templates
templateDebug.reset()

// Show help
templateDebug.help()
```

## Error Handling

The system includes comprehensive error handling:
- **Validation Errors**: Clear messages for invalid data
- **Storage Errors**: Handles localStorage quota exceeded
- **Schema Mismatches**: Warns about version incompatibilities
- **Missing Templates**: Graceful handling of deleted templates

## Future Enhancements

Potential improvements:
1. **Cloud Sync**: Sync templates across devices
2. **Import/Export**: UI for backing up and sharing templates
3. **Template Categories**: Organize templates by category
4. **Advanced Validation**: More sophisticated field validation
5. **Template Versioning**: Track template change history
6. **Bulk Operations**: Import/export multiple templates

## Storage Limitations

- **Browser Storage**: Limited by localStorage quota (typically 5-10MB)
- **JSON Size**: Large templates with many fields may impact performance
- **Browser Specific**: Templates are stored per browser/device
- **No Backup**: Data is lost if localStorage is cleared

## Security Considerations

- Templates are stored locally in the browser
- No sensitive data should be stored in templates
- Consider encryption for sensitive field mappings in future versions 