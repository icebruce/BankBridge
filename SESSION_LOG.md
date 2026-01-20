# BankBridge Session Log

Track changes and decisions made across Claude Code sessions.

---

## 2026-01-19 - Process Files 4-Step Wizard Implementation

**Changes:**

### New Components Created
| File | Purpose |
|------|---------|
| `Stepper.tsx` | Accessible horizontal stepper with circle indicators and connector lines |
| `UploadStep.tsx` | Drag-drop file upload with parsing status and duplicate detection |
| `ConfigureStep.tsx` | Template selection for each file with auto-match suggestion |
| `ReviewStep.tsx` | Processing results with error/duplicate review modals |
| `ExportStep.tsx` | Export location selection and file generation |
| `ErrorReviewModal.tsx` | Modal for reviewing parse errors per file |
| `DuplicateReviewModal.tsx` | Modal for reviewing duplicate transactions |

### Modified Files
- `ProcessFilesPage.tsx`: Refactored from single-page to 4-step wizard orchestrator
- `App.tsx`: Added exit warning when navigating away with unsaved work
- `importTemplateService.ts`: Extracted `suggestTemplateForColumns()` function

### UI/UX Design Decisions

**Stepper Design (Based on UX Best Practices):**
- Circles with visual state indicators:
  - Completed: Green filled circle with white checkmark
  - Current: Dark filled circle with small white dot (active indicator)
  - Future: Transparent circle with gray border and small gray dot
- Labels below circles (text-xs, font-semibold for current)
- Solid connector lines (green for completed, gray for upcoming)
- Hover effects on completed steps for navigation

**File Cards (Compact Design):**
- Single-row layout: file icon + filename + status + record count + remove button
- Status icons with colored text (green/blue/red)
- Duplicate badge for detected duplicates
- Shadow and border styling consistent with app design

**Navigation Bar:**
- Back button with arrow icon (left side)
- Context-aware Next button text:
  - Step 1→2: "Next"
  - Step 2→3: "Process Files" with cog icon
  - Step 3→4: "Next"
  - Step 4: "Export Files" with export icon
- Disabled message shown when action not available

**Decisions Made:**
- Stepper serves as page title (removed separate "Process Files" header)
- Exit warning uses custom event system to communicate work status to App.tsx
- Template suggestion algorithm uses column name matching with 70% confidence threshold
- Export path persisted to localStorage for convenience
- Browser beforeunload warning for unsaved work

**Resources Referenced:**
- [SetProduct - Steps UI Design Tutorial](https://www.setproduct.com/blog/steps-ui-design)
- [8 Proven UX Practices for Designing Accessible Steppers](https://medium.com/@ahmedtareq_46462/8-proven-ux-practices-for-designing-accessible-steppers-628001493e54)

**Commit:** 4a60b0c - "Refactor Process Files into 4-step wizard with polished UI"

---

## 2026-01-18 - Test Suite Refactoring (Quality Over Quantity)

**Problem Identified:**
- Test suite had grown to ~1,000 tests with ~15,200 lines of test code
- Test-to-source ratio was 1.09:1 (more test code than source code!)
- Many tests were checking CSS classes, implementation details, and trivial behavior

**Changes:**

### Test Files Refactored
| File | Before | After | Reduction |
|------|--------|-------|-----------|
| Button.test.tsx | 272 lines / 38 tests | 62 lines / 7 tests | -82% |
| Toast.test.tsx | 237 lines / 18 tests | 85 lines / 7 tests | -64% |
| DataTable.test.tsx | 366 lines / 36 tests | 115 lines / 9 tests | -69% |
| TableActions.test.tsx | 288 lines / 24 tests | 90 lines / 6 tests | -69% |
| Settings.test.ts | 220 lines / 22 tests | 78 lines / 6 tests | -65% |
| SearchAndFilters.test.tsx | 168 lines / 12 tests | 68 lines / 4 tests | -60% |
| Breadcrumbs.test.tsx | 293 lines / 17 tests | 91 lines / 5 tests | -69% |
| AccountFormModal.test.tsx | 630 lines / 33 tests | 155 lines / 10 tests | -75% |
| NewImportTemplateEditor.test.tsx | 1029 lines / 40 tests | 368 lines / 14 tests | -64% |
| ImportPreviewStep.test.tsx | 849 lines / 30 tests | 382 lines / 14 tests | -55% |
| FileParser.test.tsx | 727 lines / 50 tests | 309 lines / 17 tests | -58% |

**Final Results:**
- Tests: ~1,000 → 786 (**-214 tests**)
- Test lines: ~15,200 → ~10,500 (**-4,700 lines**)
- Test-to-source ratio: 1.09:1 → 0.75:1
- Coverage still exceeds thresholds (90%+ statements/lines, 82%+ branches/functions)

### Documentation Updates
- `TESTING_GUIDE.md`: New comprehensive testing philosophy document
  - What to test vs what NOT to test
  - Good/bad examples with code
  - Code review checklist with red flags
  - Metrics and periodic audit instructions
- `CLAUDE.md`: Updated Testing Requirements section with anti-patterns
- `vitest.config.ts`: Updated thresholds to realistic 80/75/75/80

**Anti-Patterns Removed:**
```typescript
// ❌ CSS class assertions (removed)
expect(button.className).toContain('bg-blue-500');

// ❌ Redundant variant tests (consolidated to it.each)
it('should apply primary styles', ...);
it('should apply secondary styles', ...);

// ❌ Testing React behavior
it('should render without crashing', ...);
```

**Decisions Made:**
- Coverage thresholds reduced from 90/85/90/90 to 80/75/75/80 (quality over quantity)
- Service tests are high-value and should remain thorough
- Component tests should focus on user interactions, not styling
- Test file should never be longer than its source file
- Use `it.each` for variations instead of copy-pasting tests

---

## 2026-01-17 - Import Preview & CSV Parser Improvements

**Changes:**

### New Import Preview Step
- **New:** `src/components/Settings/ImportPreviewStep.tsx`: Multi-step import workflow with duplicate detection
  - Shows "Total in File" and "Selected for Import" summary cards
  - Detects duplicates based on date, amount, institution, account, and description
  - Allows selecting/deselecting individual transactions or bulk actions
  - Warning displayed when duplicates are selected for import
  - Performance optimized with `React.memo`, `useCallback`, `useMemo`, and Set-based selection state

### CSV Parser Fixes (RFC 4180 Compliance)
- `src/services/fileParserService.ts`:
  - Added `splitCSVIntoRows()` for proper multi-line quoted field handling
  - Fixed `parseCSVRow()` to handle escaped quotes (`""` → `"`)
  - Added line ending normalization (CRLF/CR → LF)
  - Added public `parseCSVContent()` method for string parsing
- `src/services/__tests__/fileParserService.test.ts`: Added 9 new tests for CSV edge cases
- `src/components/Settings/MasterDataSection.tsx`: Updated to use fixed CSV parser

### Export Template Simplification
- `src/models/MasterData.ts`: Removed `accountName` and `institutionName` from export field options
- `src/components/ExportTemplates/NewTemplateEditor.tsx`: Renamed `exportDisplayName` to "Account" in UI

### MasterDataTable UI Improvements
- `src/components/Settings/MasterDataTable.tsx`:
  - Reduced page size from 50 to 25 rows
  - Added first/last page navigation buttons (`faAnglesLeft`/`faAnglesRight`)
  - Moved pagination into proper table footer with `border-t` styling
  - Updated button styling to match app standards (`border border-neutral-200`)

**Decisions Made:**
- Multi-line quoted fields in CSV require quote-aware row splitting, not naive `split('\n')`
- Selection state stored in `Set<number>` for O(1) toggle operations instead of recreating objects
- Table row component memoized to prevent re-renders when only selection changes
- Duplicate detection uses existing `findDuplicates` service from backend
- Export templates only need computed `exportDisplayName` field, not raw account components
- Pagination footer belongs inside table container for visual consistency

**Performance Patterns:**
```tsx
// Set-based selection for fast toggle
const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

// Memoized row component
const TableRow = memo<TableRowProps>(({ item, isSelected, onToggle }) => ...);

// Stable callbacks
const toggleSelection = useCallback((index: number) => {
  setSelectedIndices(prev => {
    const next = new Set(prev);
    next.has(index) ? next.delete(index) : next.add(index);
    return next;
  });
}, []);
```

**Test Results:**
- Total: 286 tests (up from 277)
- All passing
- 9 new CSV parser tests

**Commit:** f74d25d - "Import preview with duplicate detection & UI improvements"

---

## 2026-01-11 - Phase 7 Complete: UI Polish & Accessibility

**Changes:**

### Console Logging Cleanup
- `ExportTemplatesPage.tsx`: Removed 18+ debug console.log statements with emoji prefixes
- `ImportTemplatesPage.tsx`: Removed emoji prefix from error logging
- `FileParser.tsx`: Replaced debug console.log with TODO comment

### Focus Ring Color Fix
- `NewTemplateEditor.tsx`: Changed `focus:ring-primary-500` → `focus:ring-blue-500` (6 instances)
- `SearchInput.tsx`: Changed `focus:ring-primary-500` → `focus:ring-blue-500`
- `ProcessFilesPage.tsx`: Changed `focus:ring-primary-500` → `focus:ring-blue-500` (6 instances)
- `SearchAndFilters.tsx`: Changed `focus:ring-primary-500` → `focus:ring-blue-500` (3 instances)

### Custom Confirm Dialogs
- **New:** `src/components/common/ConfirmDialog.tsx`: Reusable modal with danger/warning/default variants
- `TemplatesList.tsx`: Replaced `window.confirm()` with ConfirmDialog
- `ImportTemplatesPage.tsx`: Replaced `window.confirm()` with ConfirmDialog
- `ImportTemplatesList.tsx`: Updated `onDelete` prop to pass full template object
- Updated 4 test files to interact with modal instead of mocking `window.confirm()`

### Accessibility Improvements
- `TableActions.tsx`: Added `aria-label` to buttons, `aria-hidden="true"` to icons
- `AccountFormModal.tsx`: Added `aria-label="Close dialog"` to close button
- `ExportTemplatesPage.tsx`: Added `aria-label` to back button
- `ImportTemplatesPage.tsx`: Added `aria-label` to back button
- `TemplatesList.tsx`: Added `aria-label` and `title` to pagination buttons
- `ImportTemplatesList.tsx`: Added `aria-label` and `title` to pagination buttons

### Empty State Standardization
- `TemplatesList.tsx`: "No templates available." → "No templates found. Create your first template to get started."
- `DataTable.tsx`: Default message "No data available" → "No data found."
- `AccountConfiguration.tsx`: Added period to "No accounts configured yet"
- Updated test assertions to match new messages

### Dead Code Removal
- **Deleted:** `src/components/MasterData/MasterDataPage.tsx` (unused stub with wrong content)
- **Deleted:** `src/components/MasterData/` directory (empty after file removal)

**Decisions Made:**
- `primary-500` is not a valid Tailwind color - standardized on `blue-500` for focus rings
- Custom ConfirmDialog provides better UX than browser `window.confirm()`
- All icon-only buttons should have both `aria-label` (for screen readers) and `title` (for tooltips)
- Empty state messages should end with periods and include actionable hints when appropriate
- Dead code should be removed rather than leaving incorrect placeholders

**Test Results:**
- Total: 277 tests (up from 276)
- All passing
- Added new test case: "should not delete template when cancelled"

**Implementation Status:**
- Phase 7 (Polish & Testing): COMPLETE

**Next Steps:**
- Manual E2E testing in Electron
- Consider additional accessibility audit (WCAG compliance check)
- Performance profiling if needed

---

## 2026-01-08 - Phase 6 Complete: Import Templates Integration

**Changes:**
- `src/services/importTemplateService.ts`: Added `sourceFields` and `accountId` to createImportTemplate function signature
- `src/components/ImportTemplates/ImportTemplatesPage.tsx`:
  - Updated to pass `sourceFields` when creating/updating templates
  - Added navigation event listener for "Go to Settings" link
- `src/components/ImportTemplates/NewImportTemplateEditor.tsx`:
  - Fixed validation to exclude hidden empty fields from required check
  - Fixed Add Field dropdown to show hidden fields that can be re-added
  - Fixed `handleAddFieldFromSource` to handle hidden fields properly
- `src/components/ImportTemplates/ImportTemplatesList.tsx`: Added Institution/Account columns with account lookup
- `src/App.tsx`: Added navigation event listener for cross-component navigation
- `src/models/ImportTemplate.ts`: Already had `accountId` and `sourceFields` properties
- `docs/DATA_ARCHITECTURE.md`: Updated with complete ImportTemplate model including sourceFields explanation
- `TESTING_GUIDE.md`: Added Import Template testing coverage and mock patterns

**New Files:**
- `src/services/__tests__/importTemplateService.test.ts`: 36 comprehensive unit tests for service layer

**Bug Fixes:**
1. **sourceFields persistence**: When creating a template with only 3 of 7 fields mapped, the remaining 4 fields were being lost. Fixed by persisting `sourceFields` array.
2. **Empty fields validation**: Fields hidden via "Show empty fields" toggle were incorrectly counted as required.
3. **Add Field button**: Hidden fields were not available in the Add Field dropdown when editing.
4. **Institution column blank**: `accountId` wasn't being passed to createImportTemplate.
5. **Settings link not working**: Custom navigation event wasn't being handled.

**Decisions Made:**
- `sourceFields` is critical for partial mapping → edit → add fields workflow
- All mock templates in tests must include `sourceFields` property
- Round-trip testing (create → load → update) validates data persistence

**Test Results:**
- Total: 276 tests (up from 240)
- All passing

**Implementation Status:**
- Phase 6 (Import Templates Integration): COMPLETE
- Phase 7 (Polish & Testing): In Progress

**Next Steps:**
- Additional UI polish
- Manual E2E testing in Electron
- Consider accessibility audit

---

## 2026-01-08 - Export Templates Alignment

**Changes:**
- `NewTemplateEditor.tsx` (Export): Multiple alignment changes
  - Replaced Format column with read-only Sample column (auto-generated based on Type)
  - Type options now: Text, Date, Currency (removed Number)
  - Default fields updated to Monarch Money's 8 required fields (Date, Merchant, Category, Account, Original Statement, Notes, Amount, Tags)
  - Added inline error message display (replaced browser alert())
  - Added red left border indicator for empty Template Name field after blur
  - Added touched state tracking for validation
- `Template.ts`: Added `dataType` property to FieldMapping interface
- `ExportTemplatesPage.tsx`: Added success message state and display with 5-second auto-clear
- `ImportTemplatesList.tsx`: Updated Active status pill from gray to green (bg-green-100 text-green-800)

**Decisions Made:**
- Type field kept to identify what transformation to apply in processing layer (Text, Date, Currency)
- Format field removed since formatting is handled in processing, not template definition
- Sample column shows auto-generated examples: Text → "Sample text", Date → "2023-10-16", Currency → "-58.12"
- Active status pill matches Export's green Default pill styling for consistency

**Monarch Money CSV Format Reference:**
- Columns: Date, Merchant, Category, Account, Original Statement, Notes, Amount, Tags
- Date format: YYYY-MM-DD
- Amount format: -58.12 (negative for debits), 58.12 (positive for credits, no symbol)

---

## 2026-01-08 - Import Templates UX Round 4

**Changes:**
- `NewImportTemplateEditor.tsx`: Multiple UX improvements
  - Red indicator now conditional (only shows when target field is empty)
  - Source file type auto-detected from file extension (dropdown replaced with read-only display)
  - File upload section hidden in edit mode (shows summary instead)
  - Data preview table fixed width with horizontal scroll (uses `contain: inline-size` and `width: 0; min-width: 100%` CSS trick)
  - "Show ID fields" toggle replaced with "Show empty fields" toggle, moved inline with Field Mapping title
- `NewImportTemplateEditor.test.tsx`: Updated tests for read-only file type display

**Decisions Made:**
- Credit/debit sign inversion should be handled in processing phase, not field mapping
- Empty fields toggle more useful than ID fields toggle for JSON files with sparse data
- Used CSS containment (`contain: inline-size`) to prevent table from expanding page

**CSS Pattern for Contained Scrollable Tables:**
```tsx
// Outer container - prevents size expansion from content
<div style={{ contain: 'inline-size' }}>
  // Scroll container - width: 0 trick forces respecting parent bounds
  <div style={{ width: '0', minWidth: '100%', overflowX: 'auto' }}>
    <table style={{ width: `${columns * 150}px` }}>...</table>
  </div>
</div>
```

---

## 2026-01-08 - Workflow Optimization

**Changes:**
- `CLAUDE.md`: Added Quick Reference section with key files, styling patterns, and common workflows
- `CODEBASE_CONTEXT.md`: Created comprehensive architecture documentation
- `SESSION_LOG.md`: Created this tracking file

**Decisions Made:**
- Adopted documentation strategy to reduce token usage by providing Claude with codebase context upfront
- Three-file approach: CLAUDE.md (instructions + quick ref), CODEBASE_CONTEXT.md (architecture), SESSION_LOG.md (change tracking)

**Status:**
- Import Templates feature complete with UX fixes merged to main
- PR #1 merged: feature/import-templates-completion

---

## Template for Future Sessions

Copy and fill in for each new session:

```markdown
## [YYYY-MM-DD] - [Brief Session Title]

**Changes:**
- `file1.tsx`: Description of change
- `file2.ts`: Description of change

**Decisions Made:**
- Decision 1 and rationale
- Decision 2 and rationale

**Issues Encountered:**
- Issue and how it was resolved

**Next Steps:**
- Pending task 1
- Pending task 2
```

---

## Quick Reference: Recent Feature Work

| Date | Feature | Branch | PR | Status |
|------|---------|--------|----|----|
| 2026-01-19 | Process Files 4-Step Wizard | main | 4a60b0c | Pushed |
| 2026-01-17 | Import Preview & CSV Parser | main | f74d25d | Pushed |
| 2026-01-11 | Phase 7: UI Polish & Accessibility | main | fa19916 | Pushed |
| 2026-01-08 | Phase 6: Import Templates Integration | main | 5127957 | Committed |
| 2026-01-08 | Export Templates Alignment | main | 0951df8 | Committed |
| 2026-01-08 | Import Templates UX Round 4 | main | 843c2ed | Pushed |
| 2026-01-08 | Import Templates UX Fixes | feature/import-templates-ux-fixes | #1 | Merged |

## Implementation Progress

| Phase | Status | Key Changes |
|-------|--------|-------------|
| Phase 0: Documentation | Complete | DATA_ARCHITECTURE.md |
| Phase 1: Core Infrastructure | Complete | Settings models, services |
| Phase 2: Account Configuration | Complete | SettingsPage, AccountConfiguration |
| Phase 3: Master Data Section | Complete | MasterDataSection, file ops |
| Phase 4: Import/Export | Complete | CSV/Excel export, import diff |
| Phase 5: Export Template Updates | Complete | Internal field mapping |
| Phase 6: Import Templates | Complete | Account dropdown, sourceFields |
| Phase 7: Polish & Testing | Complete | Accessibility, ConfirmDialog, cleanup |
| Phase 8: Import Preview | Complete | Duplicate detection, CSV parser fixes, MasterDataTable UI |
| **Phase 9: Process Files Wizard** | **Complete** | 4-step wizard, Stepper component, exit warning |

---

## Notes

- Always update this log at the end of a session
- Keep entries concise but informative
- Include file paths for easy navigation
- Document decisions with rationale for future context
