# Import Templates Testing Guide

This document provides comprehensive testing information for the Import Templates functionality, including the new field combination editing features.

## Test Structure

### Test Files

```
src/components/ImportTemplates/__tests__/
├── ImportTemplatesPage.test.tsx      # Main page component tests
├── NewImportTemplateEditor.test.tsx  # Template editor component tests
├── FieldCombinationEditor.test.tsx   # Field combination editor tests
└── README.md                         # This documentation
```

## Test Coverage

### ImportTemplatesPage Component

#### ✅ Core Functionality
- **Initial Loading**: Page rendering, template list display, loading states
- **Template Creation**: New template workflow, form validation, success/error handling
- **Template Editing**: Edit existing templates, pre-population of data
- **Template Deletion**: Confirmation dialogs, successful deletion, error handling
- **Search and Filtering**: Search by name, filter by file type, real-time updates

#### ✅ Field Combination Workflow
- **Navigation to Field Combination Editor**: Button availability, data passing
- **Save Field Combination**: Successful save, return to template editor, data persistence
- **Cancel Field Combination**: Cancel workflow, state preservation
- **Edit Field Combination**: Edit existing combinations, data pre-population
- **State Management**: Field combinations persist during navigation

#### ✅ Error Handling
- **Service Failures**: Template loading errors, creation/update failures
- **Network Issues**: Graceful degradation, user feedback
- **Data Validation**: Required fields, data format validation

### NewImportTemplateEditor Component

#### ✅ Template Form Management
- **New Template Mode**: Empty form, default values, validation
- **Edit Template Mode**: Pre-populated data, field mappings display
- **File Upload**: File parsing, field extraction, error handling
- **Form Validation**: Required fields, data consistency

#### ✅ Field Combination Integration
- **Add Field Combination Button**: Availability based on default template
- **Navigation to Field Combination Editor**: Data passing, state management
- **Field Combination Display**: Table rendering, combined field indicators
- **Field Combination Editing**: Edit existing combinations, state updates
- **Field Combination Deletion**: Explode combinations into individual fields, table updates

#### ✅ State Synchronization
- **currentTemplateData Updates**: Prop changes, state synchronization
- **Field Combination Ref**: Direct state manipulation, method exposure
- **Form State Management**: Input changes, validation, save preparation

### FieldCombinationEditor Component

#### ✅ Add New Combination Mode
- **Form Rendering**: Empty form, default source fields
- **Field Management**: Add/remove source fields, field reordering
- **Validation**: Required target field, minimum source fields
- **Save Functionality**: Data collection, ID generation, callback invocation

#### ✅ Edit Existing Combination Mode
- **Data Pre-population**: Form fields, source field list, field order
- **ID Preservation**: Existing combination ID maintained
- **Update Functionality**: Modified data collection, callback invocation
- **Header Display**: "Edit" vs "Add" mode indication

#### ✅ Advanced Features
- **Custom Delimiters**: Custom delimiter input, validation, preview updates
- **Field Reordering**: Move up/down, order preservation
- **Preview Generation**: Real-time preview, delimiter application
- **Navigation**: Cancel, back arrow, breadcrumb navigation

## Key Test Cases

### Critical User Flows

1. **Complete Template Creation with Field Combinations**
   ```
   Start → New Template → Upload File → Add Field Combination → 
   Configure Combination → Save → Return to Template → Save Template
   ```

2. **Edit Existing Field Combination**
   ```
   Template List → Edit Template → Edit Field Combination → 
   Modify Settings → Save → Verify Changes → Save Template
   ```

3. **Cancel Field Combination Editing**
   ```
   Template Editor → Add Field Combination → Configure → 
   Cancel → Verify Template State Preserved
   ```

4. **Delete Field Combination**
   ```
   Template Editor → Field Combination → Delete → 
   Verify Fields Exploded into Individual Rows
   ```

### Edge Cases Tested

- **No Default Export Template**: Field combination button disabled, warning displayed
- **Empty Source Fields**: Validation prevents saving
- **File Upload Errors**: Error display, graceful handling
- **Network Failures**: Error boundaries, user feedback
- **Large Field Lists**: Performance, scrolling, UI responsiveness

## Test Data

### Mock Templates
```typescript
const mockImportTemplate = {
  id: 'import_template_1',
  name: 'Test Import Template',
  fileType: 'CSV File',
  fieldMappings: [...],
  fieldCombinations: [...]
}
```

### Mock Field Combinations
```typescript
const mockFieldCombination = {
  id: 'combo_1',
  targetField: 'Full Name',
  delimiter: 'Space',
  sourceFields: [
    { id: 'sf_1', fieldName: 'first_name', order: 1 },
    { id: 'sf_2', fieldName: 'last_name', order: 2 }
  ]
}
```

## Running Tests

### Run All Import Template Tests
```bash
npm test -- src/components/ImportTemplates
```

### Run Specific Test File
```bash
npm test -- ImportTemplatesPage.test.tsx
```

### Run Tests with Coverage
```bash
npm run test:coverage -- src/components/ImportTemplates
```

### Watch Mode for Development
```bash
npm test -- --watch src/components/ImportTemplates
```

## Test Scenarios

### Regression Prevention

The tests are designed to prevent regressions in:

1. **Field Combination State Management**
   - Ensures field combinations persist during navigation
   - Prevents table resets when canceling edits
   - Maintains data integrity during the edit flow

2. **Form Data Synchronization**
   - Validates currentTemplateData updates
   - Ensures ref-based state updates work correctly
   - Prevents data loss during component re-renders

3. **User Experience Flows**
   - Confirms smooth navigation between editors
   - Validates proper button states and availability
   - Ensures error states are handled gracefully

### Performance Considerations

- **Large Dataset Handling**: Tests with multiple field combinations
- **Rapid State Changes**: Quick navigation, multiple edits
- **Memory Leaks**: Component mounting/unmounting, ref cleanup

## Maintenance

### Adding New Tests

When adding new functionality:

1. **Component Tests**: Test the component in isolation
2. **Integration Tests**: Test component interactions
3. **User Flow Tests**: Test complete user workflows
4. **Edge Case Tests**: Test error conditions and boundaries

### Test Updates

When modifying functionality:

1. Update existing tests to match new behavior
2. Add tests for new features
3. Remove tests for deprecated functionality
4. Update mock data to reflect schema changes

## Continuous Integration

These tests are designed to run in CI/CD pipelines and will:

- Fail fast on regressions
- Provide clear error messages
- Generate coverage reports
- Support parallel execution

## Coverage Goals

- **Component Coverage**: >95% for all components
- **Integration Coverage**: >90% for component interactions
- **User Flow Coverage**: 100% for critical paths
- **Error Handling**: 100% for error scenarios 