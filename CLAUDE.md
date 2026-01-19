# Claude Code Instructions for BankBridge

## Project Overview

BankBridge is an Electron desktop app that bridges bank statement formats to Monarch Money's import requirements. It provides template-based import/export mapping, duplicate detection, and automated Excel/CSV export generation.

## Required Reading

Before making changes, read these docs in order:
1. `DESIGN_GUIDE.md` - UI/UX patterns, Tailwind classes, component styling
2. `PARSING_STRATEGY.md` - File parsing hooks, presets, error handling
3. `TESTING_GUIDE.md` - Test structure, coverage requirements, patterns
4. `TEMPLATE_STORAGE.md` - How templates are persisted
5. `ELECTRON_INPUT_FIXES.md` - Electron-specific performance considerations
6. `docs/DATA_ARCHITECTURE.md` - Data models, storage formats, internal/export field mappings

## Core Principles

### Always Ask Questions
When given a task, surface any:
- Unanswered questions or ambiguities
- Gaps in requirements or logic
- Assumptions that need validation
- Alternative approaches worth considering

Do this BEFORE starting implementation.

### Keep It Simple
- Prefer simple solutions over clever ones
- No premature optimization
- No unnecessary abstractions
- Only build what's requested

### Documentation Must Stay Current
After completing a full implementation (not after every small change):
1. **Ask the user** when the right time is to update documentation
2. **Update these files as needed:**
   - `SESSION_LOG.md` - Add entry with changes, decisions, and any new patterns discovered
   - `CODEBASE_CONTEXT.md` - Update if new UI/UX patterns, CSS tricks, or architectural patterns were used
   - `DESIGN_GUIDE.md` - Update if new styling conventions were established
   - Test files - Ensure tests reflect the new behavior
3. **For UI/UX changes specifically:**
   - Document any new CSS patterns (e.g., scrollable tables, form validation styles)
   - Update styling quick reference if new reusable patterns emerged
   - Ensure component tests cover the new UI behavior

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit types for function parameters and returns
- Use Zod for runtime validation
- Prefer pure functions where possible

### UI/UX
- Follow patterns in `DESIGN_GUIDE.md`
- Use existing Tailwind classes and presets
- Match existing component patterns
- Use `electronInput` class for form inputs

### Error Handling
- Try/catch with actionable error messages
- Use Winston for logging
- Surface errors to users clearly
- Generate reject files for invalid data

### Performance
- Use worker threads for heavy parsing (see `SmartParse.ts`)
- Streaming for large files
- Debounce rapid user inputs
- Avoid unnecessary re-renders (React.memo, useCallback)

## Testing Requirements

**Read `TESTING_GUIDE.md` before writing any tests.** Key principles:

### Coverage Thresholds (Realistic, Not Maximized)
- Statements: 80%, Branches: 75%, Functions: 75%, Lines: 80%

### What to Test (High → Low Priority)
1. **Services**: Business logic, data transformations, validation
2. **Hooks**: State management, side effects
3. **Components**: User interactions, conditional rendering (NOT styling)

### What NOT to Test
- CSS classes or Tailwind styling
- That React renders or useState works
- Constants, getters, trivial code
- Implementation details (internal state, DOM structure)

### Anti-Patterns to Avoid
```typescript
// ❌ BAD - Testing CSS classes
expect(button.className).toContain('bg-blue-500');

// ❌ BAD - Redundant tests for each variant
it('should apply primary styles', ...);
it('should apply secondary styles', ...);
it('should apply tertiary styles', ...);

// ✅ GOOD - Testing behavior
expect(onClick).toHaveBeenCalledOnce();

// ✅ GOOD - Parameterized tests
it.each([...])('formats %s correctly', ...);
```

### Before Adding Tests, Ask:
- Does this test verify **user-visible behavior**?
- Would a user notice if this code broke?
- Am I testing MY code, not React/library code?
- Can I consolidate with `it.each`?

Run `npm test` before committing.

## File Organization

```
src/
├── components/     # React components by feature
│   ├── [Feature]/
│   │   ├── __tests__/
│   │   └── *.tsx
├── services/       # Business logic, pure functions
├── models/         # TypeScript interfaces
├── ui/hooks/       # React hooks
├── main/           # Electron main process
└── utils/          # Helper utilities
```

## Git Commits
- Descriptive messages explaining "why"
- Logical, atomic changes
- Run tests before committing

## Commands

```bash
npm run start      # Dev mode (Vite + Electron)
npm test           # Run tests
npm run test:coverage  # Tests with coverage report
npm run typecheck  # TypeScript check
npm run build      # Production build
```

## When Uncertain

ASK before:
- Deleting or renaming existing code
- Adding new dependencies
- Changing data schemas or storage
- Modifying IPC contracts
- Making architectural decisions with multiple valid approaches

---

## Quick Reference

### Key Files by Feature

| Feature | Main Files |
|---------|------------|
| **Import Templates** | `components/ImportTemplates/ImportTemplatesPage.tsx`, `NewImportTemplateEditor.tsx`, `FieldCombinationEditor.tsx` |
| **Export Templates** | `components/ExportTemplates/ExportTemplatesPage.tsx`, `NewTemplateEditor.tsx` |
| **Process Files** | `components/Process files/ProcessFilesPage.tsx` |
| **Layout** | `components/Layout/DashboardLayout.tsx`, `SidebarMenu.tsx` |
| **Services** | `services/templateService.ts`, `importTemplateService.ts`, `fileParserService.ts` |
| **Models** | `models/Template.ts`, `models/ImportTemplate.ts` |
| **Common Components** | `components/common/Button.tsx`, `DataTable.tsx`, `ConfirmDialog.tsx`, `TableActions.tsx` |

### Styling Quick Reference

```tsx
// Form input (always use electronInput)
className="border border-neutral-200 rounded-lg px-3 py-2 electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"

// Required field indicator (conditional - only when empty/invalid)
className={`... ${touched && !value ? 'border-l-4 border-l-red-500 border-red-600' : 'border-neutral-200'}`}

// Message types
Error:   "bg-red-50 border border-red-200 text-red-700"
Warning: "bg-yellow-50 border border-yellow-200 text-yellow-700"
Info:    "bg-blue-50 border border-blue-200 text-blue-700"
Success: "bg-green-50 border border-green-200 text-green-700"

// Combined badge (blue pill)
"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"

// Button primary
"px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
```

### Common Patterns

```tsx
// Service call pattern
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    const data = await fetchItems();
    setItems(data);
    setLoading(false);
  };
  load();
}, []);

// Success message with auto-dismiss
setSuccessMessage('Saved successfully');
setTimeout(() => setSuccessMessage(null), 3000);

// Save ref pattern (parent calls child's save)
useEffect(() => {
  if (saveRef) saveRef.current = handleSave;
}, [dependencies, saveRef]);

// Confirm dialog pattern (replace window.confirm)
const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
const handleDelete = (item: Item) => setDeleteTarget(item);
const handleConfirmDelete = async () => {
  if (deleteTarget) {
    await deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }
};
// In JSX:
<ConfirmDialog
  isOpen={deleteTarget !== null}
  title="Delete Item"
  message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
  variant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```

---

## Common Workflows

### Adding a New Page
1. Create `components/[Feature]/[Feature]Page.tsx`
2. Add route in `App.tsx`
3. Add menu item in `Layout/SidebarMenu.tsx`
4. Create tests in `components/[Feature]/__tests__/`

### Adding a New Service
1. Create `services/[name]Service.ts`
2. Add TypeScript interfaces in `models/`
3. Create tests in `services/__tests__/`
4. Use localStorage pattern from `localStorageService.ts`

### Modifying Templates
1. Update interface in `models/Template.ts` or `models/ImportTemplate.ts`
2. Update service in `services/templateService.ts` or `importTemplateService.ts`
3. Update validation if using Zod
4. Add migration logic if schema changes

### Testing
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- ComponentName  # Run specific test
npm run test:coverage # Coverage report
```

---

## Additional Documentation

- **Full Architecture**: See `CODEBASE_CONTEXT.md` for detailed codebase structure
- **Data Architecture**: See `docs/DATA_ARCHITECTURE.md` for data models, storage formats, and field mappings
- **Session History**: See `SESSION_LOG.md` for recent changes and decisions
- **Design Patterns**: See `DESIGN_GUIDE.md` for UI/UX patterns
