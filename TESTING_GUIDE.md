# Testing Guide for BankBridge

## Philosophy: Quality Over Quantity

Tests exist to **catch bugs and verify behavior**, not to achieve coverage metrics. Every test should answer: *"What user-visible behavior does this verify?"*

## Core Principles

### 1. Test Behavior, Not Implementation

**Bad - Testing CSS classes:**
```typescript
it('should apply primary variant styles', () => {
  render(<Button>Click</Button>);
  expect(screen.getByRole('button').className).toContain('bg-neutral-900');
});
```

**Good - Testing behavior:**
```typescript
it('calls onClick when clicked', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalledOnce();
});
```

### 2. One Test, One Concept

Each test should verify one thing. If a test description contains "and", split it.

**Bad:**
```typescript
it('should render form and validate on submit and show errors', () => { ... });
```

**Good:**
```typescript
it('renders the form fields', () => { ... });
it('validates required fields on submit', () => { ... });
it('displays validation errors', () => { ... });
```

### 3. Use Parameterized Tests for Variations

**Bad - Repetitive tests:**
```typescript
it('formats positive amount as green', () => { ... });
it('formats negative amount as red', () => { ... });
it('formats zero amount as neutral', () => { ... });
```

**Good - Parameterized:**
```typescript
it.each([
  { amount: 100, expected: '$100.00' },
  { amount: -50, expected: '-$50.00' },
  { amount: 0, expected: '$0.00' },
])('formats $amount as $expected', ({ amount, expected }) => {
  expect(formatCurrency(amount)).toBe(expected);
});
```

### 4. Avoid Testing Framework/Library Behavior

Don't test that React renders, that useState works, or that Tailwind applies classes.

**Don't test:**
- That a component renders without crashing (if it has other tests, they cover this)
- That className contains expected Tailwind classes
- That useState updates state
- That constants equal their defined values

### 5. Focus on User-Facing Outcomes

Ask: "If I broke this, would a user notice?"

**High value tests:**
- Form submission saves data
- Error messages appear for invalid input
- Navigation works correctly
- Data transforms correctly for export

**Low value tests:**
- Button has correct padding class
- Component has specific DOM structure
- Internal state matches expected value

---

## What to Test

### Services (High Priority)
- Business logic and data transformations
- Validation rules
- Error handling
- Edge cases (empty data, malformed input, large datasets)

```typescript
describe('fileParserService', () => {
  it('parses CSV with headers correctly', () => { ... });
  it('handles missing required columns gracefully', () => { ... });
  it('detects duplicate transactions', () => { ... });
});
```

### Components (Medium Priority)
- User interactions (click, type, submit)
- Conditional rendering (loading, error, empty states)
- Props affecting behavior (not styling)

```typescript
describe('FileUploader', () => {
  it('accepts valid file types', () => { ... });
  it('rejects invalid file types with error message', () => { ... });
  it('shows upload progress', () => { ... });
});
```

### Hooks (Medium Priority)
- Return values for different inputs
- Side effects (API calls, state updates)
- Cleanup behavior

```typescript
describe('useParseFile', () => {
  it('returns parsed data on success', () => { ... });
  it('returns error on parse failure', () => { ... });
});
```

### Models (Low Priority)
Only test functions with logic, not simple type definitions.

```typescript
// Worth testing - has logic
describe('createAccount', () => {
  it('generates unique IDs', () => { ... });
  it('auto-generates display name from institution and account', () => { ... });
});

// Not worth testing - trivial
// createDefaultSettings just returns an object literal
```

---

## What NOT to Test

1. **CSS/Styling** - Use visual regression tools (Chromatic, Percy) if needed
2. **Third-party libraries** - Trust that React, Tailwind, FontAwesome work
3. **Trivial code** - Getters, simple object creation, type definitions
4. **Implementation details** - Internal state, private methods, DOM structure

---

## Test Structure

### File Organization
```
src/
├── components/
│   └── FeatureName/
│       ├── __tests__/
│       │   └── FeatureName.test.tsx    # One test file per component
│       └── FeatureName.tsx
└── services/
    ├── __tests__/
    │   └── serviceName.test.ts
    └── serviceName.ts
```

### Test File Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  // Setup shared across tests
  const defaultProps = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Group by feature/behavior, not by prop
  describe('form submission', () => {
    it('saves valid data', async () => { ... });
    it('shows validation errors for invalid data', async () => { ... });
  });

  describe('cancellation', () => {
    it('calls onCancel without saving', async () => { ... });
  });
});
```

---

## Coverage Thresholds

We target **80% coverage** as a reasonable baseline, not a goal to maximize.

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    statements: 80,
    branches: 75,
    functions: 75,
    lines: 80,
  }
}
```

**Important:** High coverage with bad tests is worse than moderate coverage with good tests.

---

## Running Tests

```bash
npm test              # Run all tests in watch mode
npm run test:run      # Run once (CI mode)
npm run test:coverage # Run with coverage report
npm run test:ui       # Visual test runner
```

---

## Checklist Before Adding Tests

- [ ] Does this test verify user-visible behavior?
- [ ] Would a user notice if the tested code broke?
- [ ] Am I testing MY code, not React/library code?
- [ ] Can I consolidate with existing tests using `it.each`?
- [ ] Is the test name clear about what behavior is verified?

---

## Examples

### Good Test Suite (Component)
```typescript
describe('ImportTemplateEditor', () => {
  it('loads existing template data into form', () => { ... });
  it('validates required fields before save', () => { ... });
  it('saves template with correct structure', () => { ... });
  it('handles save errors gracefully', () => { ... });
  it('confirms before discarding unsaved changes', () => { ... });
});
// 5 tests covering core user workflows
```

### Good Test Suite (Service)
```typescript
describe('templateService', () => {
  describe('saveTemplate', () => {
    it('creates new template with generated ID', () => { ... });
    it('updates existing template preserving ID', () => { ... });
    it('validates template structure before save', () => { ... });
  });

  describe('deleteTemplate', () => {
    it('removes template from storage', () => { ... });
    it('throws if template not found', () => { ... });
  });
});
// 5 tests covering CRUD operations
```

### Bad Test Suite (Avoid)
```typescript
describe('Button', () => {
  it('renders', () => { ... });
  it('has correct class for primary', () => { ... });
  it('has correct class for secondary', () => { ... });
  it('has correct class for tertiary', () => { ... });
  it('has correct padding for sm', () => { ... });
  it('has correct padding for md', () => { ... });
  it('has correct padding for lg', () => { ... });
  // 38 tests checking CSS classes...
});
```

---

## Code Review Checklist for Tests

When reviewing PRs with test changes, check for these **red flags**:

### 🚩 Immediate Rejection
- [ ] Tests asserting on CSS class names (`.toContain('bg-blue-500')`)
- [ ] Tests checking `className` property
- [ ] Multiple tests that only differ by a prop value (use `it.each` instead)
- [ ] Tests named "should render" with no behavioral assertions
- [ ] Test file is longer than the source file it tests

### ⚠️ Needs Justification
- [ ] More than 15 tests for a single component
- [ ] Tests checking internal state values
- [ ] Tests for constants or type definitions
- [ ] Tests that mock more than 3 dependencies

### ✅ Good Signs
- [ ] Tests use `userEvent` for interactions
- [ ] Tests verify callbacks are called with correct arguments
- [ ] Tests check error states and edge cases
- [ ] Tests use `it.each` for variations
- [ ] Test names describe user-visible behavior

---

## Metrics to Watch

### Test-to-Source Ratio
- **Target**: 0.3:1 to 0.7:1 (test lines : source lines)
- **Warning**: > 1:1 ratio suggests over-testing
- **Current**: ~0.75:1 ✅

### Tests per File Guidelines
| File Type | Recommended Tests |
|-----------|-------------------|
| Simple component (Button, Badge) | 3-7 |
| Form component | 8-15 |
| Complex component (Editor, Modal) | 10-20 |
| Service | 10-25 |
| Utility function | 5-15 |

### Warning Signs of Bloat
1. Test file > 300 lines for a simple component
2. More than 5 tests in a `describe` block for styling/variants
3. Copy-pasted test blocks with minor differences
4. Tests that break when refactoring (not changing behavior)

---

## Periodic Audit

Every quarter, run this check:

```bash
# Count tests per file
npm test -- --reporter=verbose 2>&1 | grep -E "^\s*✓" | wc -l

# Find largest test files
find src -name "*.test.ts*" | xargs wc -l | sort -n | tail -10
```

If a test file has grown significantly, review it for:
1. Redundant tests that can be consolidated
2. CSS/styling tests that should be removed
3. Implementation detail tests that provide no value
