# BankBridge React

A high-performance Electron desktop application for financial data processing and template management.

## Features

- **Template Management**: Create and manage import/export templates
- **File Processing**: High-performance streaming parser for large files
- **Data Transformation**: Intelligent data type detection and transformation
- **Progress Tracking**: Real-time progress updates for long-running operations
- **Error Handling**: Comprehensive error reporting and validation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run start
```

### Testing
```bash
npm test
```

## Parsing Large Files

BankBridge includes a high-performance streaming file parser that can handle large CSV, JSON, and TXT files without blocking the UI.

### Features
- **Streaming Processing**: Handles files of any size without loading everything into memory
- **Progress Tracking**: Real-time progress updates during parsing
- **Worker Threads**: Parsing runs in background threads to keep UI responsive
- **Error Handling**: Comprehensive error reporting with reject file generation
- **Data Transformation**: Automatic flattening of nested objects and array explosion
- **Type Detection**: Intelligent detection of data types (text, number, currency, date, boolean)

### IPC Channels
- **Channel**: `parse-file`
- **Progress Event**: `parse-progress`

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

### Usage Example
```typescript
import { useParseFile } from '@/ui/hooks/useParseFile';

const { parse, progress, isLoading, error } = useParseFile();

const handleFileUpload = async (filePath: string) => {
  try {
    const result = await parse(filePath, {
      maxRows: 100000,
      chunkSize: 1000,
      mapping: {
        tags: { type: 'array', explode: true }
      }
    });
    
    console.log(`Parsed ${result.stats.validRows} rows successfully`);
  } catch (err) {
    console.error('Parse failed:', err);
  }
};
```

## Architecture

### Core Components
- **SmartParse**: Main parsing service with streaming support
- **Transformers**: Pure utility functions for data transformation
- **Worker Threads**: Background processing for large files
- **IPC Handlers**: Electron main process communication
- **React Hooks**: UI integration for parsing functionality

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Electron
- **Build**: Vite
- **Testing**: Vitest
- **Parsing**: fast-csv, stream-json
- **Validation**: Zod
- **Logging**: Winston
