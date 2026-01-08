# BankBridge Codebase Context

This document provides comprehensive architecture documentation for Claude to quickly understand the codebase without re-exploration.

## Directory Structure

```
src/
├── components/              # React UI components by feature
│   ├── common/              # Shared reusable components
│   │   ├── Button.tsx       # Standard button with variants
│   │   ├── DataTable.tsx    # Reusable data table
│   │   ├── Modal.tsx        # Modal dialog
│   │   └── __tests__/
│   ├── Layout/              # App shell components
│   │   ├── DashboardLayout.tsx  # Main app layout wrapper
│   │   └── SidebarMenu.tsx      # Navigation sidebar
│   ├── ImportTemplates/     # Import template feature
│   │   ├── ImportTemplatesPage.tsx      # List view + routing
│   │   ├── ImportTemplatesList.tsx      # Template list display
│   │   ├── NewImportTemplateEditor.tsx  # Create/edit form
│   │   ├── FieldCombinationEditor.tsx   # Combine fields UI
│   │   ├── SearchAndFilters.tsx         # Filter controls
│   │   └── __tests__/
│   ├── ExportTemplates/     # Export template feature
│   │   ├── ExportTemplatesPage.tsx      # List view + routing
│   │   ├── NewTemplateEditor.tsx        # Create/edit form
│   │   └── __tests__/
│   ├── ProcessFiles/        # File processing feature
│   │   ├── ProcessFilesPage.tsx
│   │   └── __tests__/
│   ├── MasterData/          # Configuration/settings
│   │   └── MasterDataPage.tsx
│   └── Dashboard/           # Home dashboard
│       └── DashboardPage.tsx
├── services/                # Business logic layer
│   ├── templateService.ts       # Export template operations
│   ├── importTemplateService.ts # Import template operations
│   ├── fileParserService.ts     # File parsing utilities
│   └── __tests__/
├── models/                  # TypeScript interfaces
│   ├── Template.ts          # Export template types
│   └── ImportTemplate.ts    # Import template types
├── ui/hooks/                # Custom React hooks
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── main/                    # Electron main process
│   ├── main.ts              # Main entry point
│   ├── preload.ts           # Preload script
│   └── ipc/                 # IPC handlers
└── utils/                   # Helper utilities
    ├── SmartParse.ts        # Worker-based file parsing
    └── helpers.ts
```

## Key Components

### ImportTemplatesPage.tsx
**Purpose:** Container component for import template feature
**Location:** `src/components/ImportTemplates/ImportTemplatesPage.tsx`
**Key responsibilities:**
- Manages view state (list vs editor vs field combination editor)
- Handles CRUD operations via service layer
- Coordinates data between child components
- Manages field combinations ref for cross-component updates

**State:**
```typescript
const [templates, setTemplates] = useState<ImportTemplate[]>([]);
const [showNewTemplateEditor, setShowNewTemplateEditor] = useState(false);
const [showFieldCombinationEditor, setShowFieldCombinationEditor] = useState(false);
const [editingTemplate, setEditingTemplate] = useState<ImportTemplate | null>(null);
```

### NewImportTemplateEditor.tsx
**Purpose:** Form for creating/editing import templates
**Key features:**
- File upload and parsing
- Field mapping UI
- Validation with visual indicators
- Field combination integration via ref

### FieldCombinationEditor.tsx
**Purpose:** UI for combining multiple source fields into one target field
**Key features:**
- Dynamic source field list with reordering
- Delimiter selection (Space, Comma, Semicolon, Custom)
- Live preview of combined result
- Validation (requires 2+ source fields)

### Common Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Standard button with variants | `variant`, `icon`, `onClick`, `disabled` |
| `DataTable` | Reusable table with sorting/actions | `columns`, `data`, `onRowClick` |
| `Modal` | Dialog overlay | `isOpen`, `onClose`, `title`, `children` |

## Data Models

### ImportTemplate
```typescript
interface ImportTemplate {
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
  fieldCombinations?: FieldCombination[];
  sourceFields?: string[];  // Column headers from original file
}
```

### FieldCombination
```typescript
interface FieldCombination {
  id: string;
  targetField: string;
  delimiter: string;
  customDelimiter?: string;
  sourceFields: SourceField[];
}

interface SourceField {
  id: string;
  fieldName: string;
  order: number;
}
```

### Template (Export)
```typescript
interface Template {
  id: string;
  name: string;
  description?: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}
```

## Services

### importTemplateService.ts
```typescript
// CRUD operations for import templates
fetchImportTemplates(): Promise<ImportTemplate[]>
createImportTemplate(data): Promise<ImportTemplate>
updateImportTemplate(id, data): Promise<ImportTemplate>
deleteImportTemplate(id): Promise<void>
duplicateImportTemplate(id): Promise<ImportTemplate>
```

### templateService.ts
```typescript
// CRUD operations for export templates
fetchTemplates(): Promise<Template[]>
getDefaultTemplate(): Promise<Template | null>
createTemplate(data): Promise<Template>
updateTemplate(id, data): Promise<Template>
deleteTemplate(id): Promise<void>
```

### fileParserService.ts
```typescript
// File parsing utilities
parseFile(file: File): Promise<ParsedData>
detectFileType(file: File): string
extractHeaders(content: string): string[]
```

## State Management

**Pattern:** Local state with props drilling (no global store)

- Components use `useState` for local state
- Parent components manage shared state
- Data passed down via props
- Callbacks passed up for state updates
- Refs used for imperative cross-component updates (e.g., `fieldCombinationsRef`)

**Example pattern:**
```typescript
// Parent manages state
const [data, setData] = useState([]);
const handleUpdate = (newData) => setData(newData);

// Child receives props
<ChildComponent data={data} onUpdate={handleUpdate} />
```

## Styling Conventions

### Color Palette
- **Primary/Neutral:** `neutral-50` through `neutral-900`
- **Interaction:** `blue-500` (focus rings, links, info)
- **Status:** red (error), yellow (warning), green (success)

### Form Inputs
```tsx
// Standard input (ALWAYS use electronInput class)
className="border border-neutral-200 rounded-lg px-3 py-2 electronInput
           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"

// Required field indicator (conditional - only when empty/invalid)
className={`... ${touched && !value ? 'border-l-4 border-l-red-500' : ''}`}
```

### Messages/Alerts
```tsx
// Error
className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"

// Warning
className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg"

// Info
className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg"

// Success
className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
```

### Badges
```tsx
// Combined field badge (blue pill)
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"

// Status badge
className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" // Active
className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800" // Inactive
```

### Scrollable Tables (Fixed Width with Horizontal Scroll)
```tsx
// Use this pattern when table has many columns and shouldn't expand the page
// Outer container - CSS containment prevents size expansion from content
<div style={{ contain: 'inline-size' }}>
  {/* Scroll container - width: 0 trick forces respecting parent bounds */}
  <div style={{ width: '0', minWidth: '100%', overflowX: 'auto', overflowY: 'auto', maxHeight: '256px' }}>
    <table style={{ tableLayout: 'fixed', width: `${columns * 150}px` }}>
      {/* Fixed column widths */}
      <th style={{ width: '150px', minWidth: '150px', maxWidth: '150px' }}>
        <div className="truncate">{header}</div>
      </th>
    </table>
  </div>
</div>
```

## Testing Patterns

### Structure
- Tests located in `__tests__/` subdirectory of each feature
- Use vitest as test runner
- React Testing Library for component tests

### Example Test
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const mockHandler = vi.fn();
    render(<ComponentName onAction={mockHandler} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### Coverage Requirements
- 90% statements
- 85% branches
- 90% functions
- 90% lines

## Electron Architecture

### Main Process (`src/main/`)
- `main.ts` - Application entry, window management
- `preload.ts` - Secure bridge between main and renderer
- `ipc/` - IPC handlers for file operations

### Renderer Process (`src/`)
- React application
- Communicates with main via IPC

### IPC Pattern
```typescript
// Renderer (invoke)
const result = await window.electronAPI.readFile(path);

// Main (handle)
ipcMain.handle('read-file', async (event, path) => {
  return fs.readFile(path);
});
```

## Data Persistence

**Storage:** localStorage (via service layer)

```typescript
// Pattern used in services
const STORAGE_KEY = 'import_templates';

export const fetchImportTemplates = (): ImportTemplate[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveImportTemplates = (templates: ImportTemplate[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};
```

## Common Workflows

### Adding a New Page
1. Create component in `src/components/[Feature]/[Feature]Page.tsx`
2. Add route in `App.tsx`
3. Add menu item in `SidebarMenu.tsx`
4. Create service if needed in `src/services/`
5. Add tests in `__tests__/`

### Adding a New Service Function
1. Add function to appropriate service file
2. Export from service
3. Add corresponding test
4. Use in components via import

### Modifying Template Structure
1. Update model in `src/models/`
2. Update service layer
3. Update UI components
4. Migrate existing data if needed
5. Update tests

## Performance Considerations

- Heavy file parsing uses worker threads (`SmartParse.ts`)
- Debounce rapid user inputs
- Use `React.memo` and `useCallback` to prevent unnecessary re-renders
- Streaming for large files
