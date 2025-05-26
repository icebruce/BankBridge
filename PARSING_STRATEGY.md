# Reusable Parsing Strategy

This document outlines the reusable parsing components and utilities available in the BankBridge application for handling file parsing across different pages and use cases.

## Overview

The parsing strategy consists of several layers:

1. **Core Parsing Engine** (`SmartParse.ts`) - High-performance streaming parser
2. **UI Components** (`FileParser.tsx`) - Reusable React components
3. **Hooks** (`useParseFile.ts`, `useQuickParse.ts`) - React hooks for different use cases
4. **Utilities** (`parseHelpers.ts`) - Helper functions for data processing
5. **Models** (`parse.ts`) - TypeScript interfaces and types

## Components

### 1. FileParser Component

A comprehensive file upload and parsing component with drag-and-drop support, progress tracking, and error handling.

```tsx
import FileParser from '@/components/common/FileParser';
import { ParsePresets } from '@/utils/parseHelpers';

<FileParser
  title="Upload Data File"
  description="Upload a CSV, JSON, or TXT file to parse"
  onParseComplete={(result) => handleParseComplete(result)}
  onParseError={(error) => handleParseError(error)}
  parseOptions={ParsePresets.BALANCED}
  showAdvancedOptions={true}
  maxFileSizeMB={100}
  acceptedTypes=".csv,.json,.txt"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onParseComplete` | `(result: ParseResult) => void` | - | Callback when parsing completes successfully |
| `onParseError` | `(error: string) => void` | - | Callback when parsing fails |
| `onFileSelected` | `(file: File) => void` | - | Callback when file is selected |
| `parseOptions` | `ParseOpts` | `{}` | Parse options to customize behavior |
| `acceptedTypes` | `string` | `".csv,.json,.txt"` | Accepted file types |
| `maxFileSizeMB` | `number` | `100` | Maximum file size in MB |
| `showAdvancedOptions` | `boolean` | `false` | Show advanced options panel |
| `title` | `string` | `"File Parser"` | Custom title |
| `description` | `string` | `"Upload and parse..."` | Custom description |
| `disabled` | `boolean` | `false` | Disable the component |
| `showProgressDetails` | `boolean` | `true` | Show progress details |
| `className` | `string` | `""` | Custom CSS classes |

### 2. useParseFile Hook

Full-featured hook with progress tracking for UI components.

```tsx
import { useParseFile } from '@/ui/hooks/useParseFile';

const { parse, progress, isLoading, error, clearError } = useParseFile();

const handleParse = async () => {
  try {
    const result = await parse(filePath, options);
    console.log('Parse result:', result);
  } catch (err) {
    console.error('Parse error:', err);
  }
};
```

### 3. useQuickParse Hook

Simplified hook for programmatic parsing without UI components.

```tsx
import { useQuickParse } from '@/ui/hooks/useQuickParse';

const { parseFile, parseFromDialog, parseMultipleFiles } = useQuickParse();

// Parse specific file
const result = await parseFile('/path/to/file.csv', options);

// Open dialog and parse
const result = await parseFromDialog({
  title: 'Select file to parse',
  ...ParsePresets.FAST
});

// Parse multiple files
const results = await parseMultipleFiles(['/path/1.csv', '/path/2.json']);
```

## Parse Options

### Presets

Pre-configured parsing options for common scenarios:

```tsx
import { ParsePresets } from '@/utils/parseHelpers';

// Fast parsing for small files
ParsePresets.FAST

// Balanced parsing for medium files  
ParsePresets.BALANCED

// Memory-efficient parsing for large files
ParsePresets.LARGE_FILE

// Import template parsing with validation
ParsePresets.IMPORT_TEMPLATE

// Export template parsing
ParsePresets.EXPORT_TEMPLATE
```

### Custom Options

```tsx
const customOptions: ParseOpts = {
  chunkSize: 1000,           // Rows per chunk
  maxMemoryUsage: 512,       // Memory limit in MB
  enableGarbageCollection: true,
  maxRows: 100000,           // Limit total rows
  delimiter: '\t',           // For TXT files
  expectedFields: {          // Schema validation
    name: { required: true, type: 'string' },
    amount: { required: true, type: 'number' }
  },
  mapping: {                 // Array handling
    transactions: { type: 'array', explode: true }
  }
};
```

## Utility Functions

### Data Processing

```tsx
import {
  extractColumns,
  filterRows,
  groupByColumn,
  calculateColumnStats,
  validateRequiredColumns
} from '@/utils/parseHelpers';

// Extract specific columns
const columns = extractColumns(data, ['name', 'amount']);

// Filter data
const filtered = filterRows(data, {
  amount: (value) => Number(value) > 100
});

// Group by column
const groups = groupByColumn(data, 'category');

// Calculate statistics
const stats = calculateColumnStats(data, 'amount');

// Validate required columns
const validation = validateRequiredColumns(result, ['name', 'amount']);
```

### Data Conversion

```tsx
import { convertToCSV, convertToJSON, sampleData } from '@/utils/parseHelpers';

// Convert to CSV
const csv = convertToCSV(data);

// Convert to JSON
const json = convertToJSON(data, true); // pretty format

// Get sample data
const sample = sampleData(data, 10); // first 10 rows
```

### Analysis

```tsx
import { 
  getUniqueValues, 
  detectColumnTypes, 
  formatParseResultSummary 
} from '@/utils/parseHelpers';

// Get unique values for a column
const uniqueValues = getUniqueValues(data, 'category');

// Detect column data types
const types = detectColumnTypes(data);

// Format result summary
const summary = formatParseResultSummary(result);
```

## Usage Patterns

### 1. Basic File Upload Page

```tsx
import React, { useState } from 'react';
import FileParser from '@/components/common/FileParser';
import { ParsePresets } from '@/utils/parseHelpers';

const DataUploadPage: React.FC = () => {
  const [data, setData] = useState([]);

  const handleParseComplete = (result) => {
    if (result.success) {
      setData(result.data);
    }
  };

  return (
    <div>
      <FileParser
        title="Upload Data File"
        onParseComplete={handleParseComplete}
        parseOptions={ParsePresets.BALANCED}
        showAdvancedOptions={true}
      />
      
      {data.length > 0 && (
        <div>Data loaded: {data.length} rows</div>
      )}
    </div>
  );
};
```

### 2. Import Template Processing

```tsx
import React from 'react';
import FileParser from '@/components/common/FileParser';
import { ParsePresets, validateRequiredColumns } from '@/utils/parseHelpers';

const ImportTemplatePage: React.FC = () => {
  const handleTemplateUpload = (result) => {
    // Validate required columns
    const validation = validateRequiredColumns(result, [
      'account', 'amount', 'date', 'description'
    ]);
    
    if (!validation.isValid) {
      console.error('Missing columns:', validation.missingColumns);
      return;
    }
    
    // Process template data
    processImportTemplate(result.data);
  };

  return (
    <FileParser
      title="Upload Import Template"
      description="Upload a CSV or JSON file with transaction data"
      onParseComplete={handleTemplateUpload}
      parseOptions={{
        ...ParsePresets.IMPORT_TEMPLATE,
        mapping: {
          transactions: { type: 'array', explode: true }
        }
      }}
      acceptedTypes=".csv,.json"
      maxFileSizeMB={50}
    />
  );
};
```

### 3. Quick File Processing

```tsx
import React from 'react';
import { useQuickParse } from '@/ui/hooks/useQuickParse';
import { ParsePresets } from '@/utils/parseHelpers';

const QuickProcessPage: React.FC = () => {
  const { parseFromDialog } = useQuickParse();

  const handleQuickProcess = async () => {
    try {
      const result = await parseFromDialog({
        title: 'Select file to process',
        ...ParsePresets.FAST
      });
      
      if (result) {
        // Process the data immediately
        processData(result.data);
      }
    } catch (error) {
      console.error('Processing failed:', error);
    }
  };

  return (
    <button onClick={handleQuickProcess}>
      Quick Process File
    </button>
  );
};
```

### 4. Data Analysis Dashboard

```tsx
import React, { useState } from 'react';
import FileParser from '@/components/common/FileParser';
import { 
  ParsePresets, 
  calculateColumnStats, 
  detectColumnTypes,
  groupByColumn 
} from '@/utils/parseHelpers';

const AnalyticsDashboard: React.FC = () => {
  const [analysis, setAnalysis] = useState(null);

  const handleDataUpload = (result) => {
    if (!result.success) return;

    const data = result.data;
    const columnTypes = detectColumnTypes(data);
    const numericColumns = Object.keys(columnTypes)
      .filter(col => columnTypes[col] === 'number');

    const stats = {};
    numericColumns.forEach(col => {
      stats[col] = calculateColumnStats(data, col);
    });

    setAnalysis({
      totalRows: data.length,
      columnTypes,
      stats,
      groups: groupByColumn(data, 'category') // assuming category column
    });
  };

  return (
    <div>
      <FileParser
        title="Upload Data for Analysis"
        onParseComplete={handleDataUpload}
        parseOptions={ParsePresets.BALANCED}
      />
      
      {analysis && (
        <div>
          <h3>Analysis Results</h3>
          <p>Total Rows: {analysis.totalRows}</p>
          {/* Display statistics and charts */}
        </div>
      )}
    </div>
  );
};
```

## Error Handling

The parsing system provides comprehensive error handling:

### Error Codes

- `UNSUPPORTED_FORMAT` - File type not supported
- `SCHEMA_MISMATCH` - Data doesn't match expected schema
- `CSV_ROW_INVALID` - Invalid CSV row format
- `JSON_PARSE_ERROR` - JSON parsing error
- `FILE_TOO_LARGE` - File exceeds memory limits
- `MEMORY_LIMIT_EXCEEDED` - Memory usage exceeded
- `VALIDATION_FAILED` - Row validation failed
- `TRANSFORM_ERROR` - Data transformation error
- `IO_ERROR` - File system error

### Error Handling Pattern

```tsx
const handleParseComplete = (result: ParseResult) => {
  if (result.success) {
    // Handle successful parsing
    processData(result.data);
  } else {
    // Handle errors
    result.errors.forEach(error => {
      console.error(`${error.code}: ${error.message}`);
      
      switch (error.code) {
        case 'FILE_TOO_LARGE':
          showError('File is too large. Please use a smaller file.');
          break;
        case 'VALIDATION_FAILED':
          showError('Data validation failed. Check the file format.');
          break;
        default:
          showError('An error occurred while parsing the file.');
      }
    });
  }
  
  // Handle warnings
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      console.warn(warning);
    });
  }
};
```

## Performance Considerations

### Memory Management

- Use appropriate presets for file size
- Enable garbage collection for large files
- Set reasonable memory limits
- Use streaming for very large files

### Progress Tracking

- Progress updates every 1000 rows by default
- Customize chunk size based on needs
- Show progress details for long operations

### Worker Threads

- Parsing runs in background worker threads
- UI remains responsive during parsing
- Progress events are forwarded to main thread

## Best Practices

1. **Choose the right preset** for your use case
2. **Validate data** after parsing using helper functions
3. **Handle errors gracefully** with user-friendly messages
4. **Show progress** for operations that might take time
5. **Use type safety** with TypeScript interfaces
6. **Test with large files** to ensure performance
7. **Provide fallbacks** for unsupported file types

## Integration Examples

See `src/components/examples/ParsingExamples.tsx` for complete working examples of all usage patterns. 