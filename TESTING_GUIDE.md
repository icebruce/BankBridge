# Testing Guide for Export Templates

This document provides comprehensive information about testing the Export Templates functionality in the BankBridge application.

## Testing Framework

The project uses **Vitest** as the testing framework with **React Testing Library** for component testing.

### Dependencies

```json
{
  "@testing-library/jest-dom": "^6.1.4",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^14.5.1",
  "@vitest/coverage-v8": "^1.0.4",
  "@vitest/ui": "^1.0.4",
  "jsdom": "^23.0.1",
  "vitest": "^1.0.4"
}
```

## Test Structure

### Test Files Location

```
src/
├── components/
│   └── ExportTemplates/
│       ├── __tests__/
│       │   ├── ExportTemplatesPage.test.tsx
│       │   └── TemplatesList.test.tsx
│       ├── ExportTemplatesPage.tsx
│       └── TemplatesList.tsx
└── services/
    ├── __tests__/
    │   └── templateService.test.ts
    └── templateService.ts
```

### Test Categories

1. **Component Tests** - Testing React components
2. **Service Tests** - Testing business logic and API calls
3. **Integration Tests** - Testing component interactions
4. **Edge Case Tests** - Testing error scenarios and boundary conditions

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test
```

### Run Tests Once (CI Mode)

```bash
npm run test:run
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests with UI

```bash
npm run test:ui
```

## Test Coverage

### Current Coverage Areas

#### ExportTemplatesPage Component
- ✅ Initial loading and template display
- ✅ Template creation (positive and negative scenarios)
- ✅ Template editing functionality
- ✅ Template duplication
- ✅ Template deletion with confirmation
- ✅ Default template management
- ✅ Search and filtering
- ✅ Navigation and breadcrumbs
- ✅ Error handling
- ✅ Empty states

#### TemplatesList Component
- ✅ Template display and formatting
- ✅ Filtering functionality
- ✅ Action button interactions
- ✅ Status display (default/non-default)
- ✅ Accessibility features
- ✅ Edge cases and error handling

#### Template Service
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Template duplication
- ✅ Default template management
- ✅ Data validation
- ✅ Error handling
- ✅ Schema version management
- ✅ Storage integration

### Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Test Scenarios

### Positive Test Cases

1. **Template Creation**
   - Create template with valid data
   - Save template successfully
   - Display new template in list

2. **Template Editing**
   - Edit existing template
   - Update template fields
   - Save changes successfully

3. **Template Management**
   - Duplicate template
   - Set template as default
   - Delete template with confirmation

4. **User Interface**
   - Search and filter templates
   - Navigate between views
   - Display correct status indicators

### Negative Test Cases

1. **Validation Errors**
   - Empty template name
   - Invalid field mappings
   - Duplicate field names

2. **Service Errors**
   - Network failures
   - Storage errors
   - Invalid template IDs

3. **User Interactions**
   - Cancel operations
   - Reject confirmations
   - Invalid search queries

### Edge Cases

1. **Data Handling**
   - Empty template lists
   - Templates with no fields
   - Very long template names
   - Invalid date formats

2. **User Experience**
   - Rapid button clicks
   - Concurrent operations
   - Browser refresh during operations

## Mock Data

### Template Mock Structure

```typescript
const mockTemplate: Template = {
  id: 'template_123',
  name: 'Test Template',
  description: 'Test description',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  schemaVersion: '1.0.0',
  isDefault: false,
  fieldMappings: [
    { sourceField: 'field1', targetField: 'Field 1' },
    { sourceField: 'field2', targetField: 'Field 2' }
  ]
}
```

### Service Mocking

```typescript
// Mock template service
vi.mock('../../../services/templateService', () => ({
  fetchTemplates: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  duplicateTemplate: vi.fn(),
  setDefaultTemplate: vi.fn()
}))
```

## Testing Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the scenario
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Component Testing

```typescript
// Good: Test user interactions
it('should create template when form is submitted', async () => {
  const user = userEvent.setup()
  render(<ExportTemplatesPage />)
  
  await user.type(screen.getByPlaceholderText('Enter template name'), 'New Template')
  await user.click(screen.getByText('Save Template'))
  
  expect(templateService.createTemplate).toHaveBeenCalledWith({
    name: 'New Template',
    description: '',
    fieldMappings: expect.any(Array)
  })
})
```

### 3. Service Testing

```typescript
// Good: Test business logic
it('should validate template data before creation', async () => {
  const invalidData = { name: '', description: '', fieldMappings: [] }
  
  await expect(createTemplate(invalidData)).rejects.toThrow('Validation failed')
})
```

### 4. Error Testing

```typescript
// Good: Test error scenarios
it('should handle creation errors gracefully', async () => {
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  vi.mocked(templateService.createTemplate).mockRejectedValue(new Error('Creation failed'))
  
  // ... test implementation
  
  expect(alertSpy).toHaveBeenCalledWith('Failed to save template: Creation failed')
  alertSpy.mockRestore()
})
```

## Continuous Integration

### Pre-commit Testing

Before making changes to the Export Templates functionality:

1. Run the full test suite: `npm run test:run`
2. Check test coverage: `npm run test:coverage`
3. Ensure all tests pass
4. Review coverage report for any gaps

### Build Pipeline

The CI/CD pipeline should include:

1. **Lint Check**: `npm run lint`
2. **Type Check**: `npm run typecheck`
3. **Unit Tests**: `npm run test:run`
4. **Coverage Check**: Ensure coverage thresholds are met
5. **Build Test**: `npm run build`

## Debugging Tests

### Common Issues

1. **Async Operations**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Template created')).toBeInTheDocument()
   })
   ```

2. **Mock Cleanup**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks()
   })
   ```

3. **DOM Queries**
   ```typescript
   // Use appropriate queries
   screen.getByText() // Throws if not found
   screen.queryByText() // Returns null if not found
   screen.findByText() // Async, waits for element
   ```

### Debug Tools

1. **Screen Debug**: `screen.debug()` - Prints current DOM
2. **Test UI**: `npm run test:ui` - Visual test runner
3. **Coverage Report**: `npm run test:coverage` - Detailed coverage analysis

## Future Enhancements

### Planned Test Additions

1. **E2E Tests**: Full user workflow testing
2. **Performance Tests**: Large dataset handling
3. **Accessibility Tests**: Screen reader compatibility
4. **Visual Regression Tests**: UI consistency checks

### Test Automation

1. **Snapshot Testing**: Component output consistency
2. **Property-based Testing**: Random input validation
3. **Mutation Testing**: Test quality assessment

## Troubleshooting

### Common Test Failures

1. **Import Errors**: Ensure all dependencies are installed
2. **Mock Issues**: Check mock setup and cleanup
3. **Timing Issues**: Use proper async/await patterns
4. **DOM Queries**: Verify element existence and accessibility

### Getting Help

1. Check the [Vitest documentation](https://vitest.dev/)
2. Review [React Testing Library guides](https://testing-library.com/docs/react-testing-library/intro/)
3. Consult the project's existing test examples
4. Ask team members for guidance on complex scenarios 