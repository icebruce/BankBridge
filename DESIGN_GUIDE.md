# BankBridge Design Guide

## Page Layout Patterns

### Standard List Page Layout

For pages that display lists of items (templates, transactions, etc.), use this consistent layout pattern:

```tsx
return (
  <div>
    {/* Header Section - Outside container */}
    <div id="header" className="mb-8">
      <PageHeader onNew={handleNew} />
    </div>
    
    {/* Main Content - Inside white container */}
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <SearchAndFilters />
      <DataTable />
    </div>
  </div>
);
```

### New/Edit Page Layout

For pages that create or edit items, use this pattern with back navigation:

```tsx
return (
  <div>
    {/* Header Section - Outside container */}
    <div id="header" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button 
            className="mr-3 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
            onClick={handleBack}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <div className="flex items-center text-sm text-neutral-500 mb-1 font-semibold">
              <button 
                className="hover:text-neutral-700 transition-colors duration-200"
                onClick={handleBack}
              >
                Parent Page Name
              </button>
              <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
              <span>Current Page Name</span>
            </div>
            <h2 className="text-2xl font-semibold">Page Title</h2>
            <p className="text-neutral-600">Page description</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200">
            Cancel
          </button>
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200">
            Save
          </button>
        </div>
      </div>
    </div>
    
    {/* Main Content - Inside white container */}
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <FormContent />
    </div>
  </div>
);
```

## Header Components

### 1. Standard Page Header

For list pages with a primary action button:

```tsx
const PageHeader: FC<PageHeaderProps> = ({ onNew }) => (
  <div className="flex justify-between items-center mb-4">
    <div>
      <h2 className="text-2xl font-semibold">Page Title</h2>
      <p className="text-neutral-600">Page description</p>
    </div>
    <button 
      className="px-4 py-2 bg-neutral-900 text-white rounded-lg flex items-center hover:bg-neutral-800 hover:shadow-sm transition-all duration-200"
      onClick={onNew}
    >
      <FontAwesomeIcon icon={faPlus} className="mr-2" />
      New Item
    </button>
  </div>
);
```

### 2. Back Navigation Header

For new/edit pages with back navigation:

```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center">
    <button 
      className="mr-3 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
      onClick={handleBack}
    >
      <FontAwesomeIcon icon={faArrowLeft} />
    </button>
    <div>
      <div className="flex items-center text-sm text-neutral-500 mb-1 font-semibold">
        <button 
          className="hover:text-neutral-700 transition-colors duration-200"
          onClick={handleBack}
        >
          Parent Page
        </button>
        <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
        <span>Current Page</span>
      </div>
      <h2 className="text-2xl font-semibold">Page Title</h2>
      <p className="text-neutral-600">Page description</p>
    </div>
  </div>
  <div className="flex space-x-3">
    {/* Action buttons */}
  </div>
</div>
```

## Breadcrumb Navigation

### Breadcrumb Component Usage

```tsx
// For standalone breadcrumbs (deprecated - use inline navigation instead)
<Breadcrumbs 
  items={breadcrumbItems}
  showBackButton={true}
  onBack={handleBack}
  onNavigate={handleNavigate}
/>
```

### Inline Breadcrumb Navigation (Preferred)

```tsx
<div className="flex items-center text-sm text-neutral-500 mb-1 font-semibold">
  <button
    className="hover:text-neutral-700 transition-colors duration-200"
    onClick={handleNavigateToParent}
  >
    Parent Page Name
  </button>
  <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
  <span>Current Page Name</span>
</div>
```

## Stepper Component

### Horizontal Stepper for Multi-Step Wizards

Used in Process Files wizard. Based on accessible UX best practices.

```tsx
// Stepper structure
<div className="flex items-center w-full">
  {steps.map((step, index) => (
    <React.Fragment key={step.id}>
      {/* Step indicator */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        <div className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-300 border-2
          ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
          ${isCurrent ? 'bg-neutral-900 border-neutral-900 text-white' : ''}
          ${isFuture ? 'bg-transparent border-neutral-300' : ''}
        `}>
          {isCompleted ? <FontAwesomeIcon icon={faCheck} /> : null}
          {isCurrent ? <div className="w-2 h-2 bg-white rounded-full" /> : null}
          {isFuture ? <div className="w-2 h-2 bg-neutral-300 rounded-full" /> : null}
        </div>

        {/* Label below */}
        <span className={`
          mt-2.5 text-xs font-medium whitespace-nowrap
          ${isCompleted ? 'text-green-600' : ''}
          ${isCurrent ? 'text-neutral-900 font-semibold' : ''}
          ${isFuture ? 'text-neutral-400' : ''}
        `}>
          {step.label}
        </span>
      </div>

      {/* Connector line */}
      {index < steps.length - 1 && (
        <div className="flex-1 mx-4 -mt-5">
          <div className={`
            h-0.5 w-full transition-colors duration-300
            ${isCompleted ? 'bg-green-500' : 'bg-neutral-200'}
          `} />
        </div>
      )}
    </React.Fragment>
  ))}
</div>
```

### Stepper Visual States

| State | Circle | Inner Content | Label | Connector |
|-------|--------|---------------|-------|-----------|
| Completed | `bg-green-500 border-green-500` | White checkmark | `text-green-600` | `bg-green-500` |
| Current | `bg-neutral-900 border-neutral-900` | Small white dot | `text-neutral-900 font-semibold` | `bg-neutral-200` |
| Future | `bg-transparent border-neutral-300` | Small gray dot | `text-neutral-400` | `bg-neutral-200` |

### Stepper Best Practices

1. **Labels below circles** - Better readability and alignment
2. **No step numbers in circles** - Visual indicators (dots/checkmarks) are clearer
3. **Clickable completed steps** - Allow users to navigate back
4. **Solid connector lines** - Green for completed paths, gray for upcoming
5. **Hover effects** - Scale and color change on clickable steps

## Button Styling

### Primary Buttons
```tsx
className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200"
```

### Secondary Buttons
```tsx
className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
```

### Tertiary Buttons

#### Standard Tertiary Button (25% smaller than primary/secondary)
```tsx
className="px-3 py-1.5 text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-all duration-200"
```

## Button Component

### Usage

Import the reusable Button component for consistent styling:

```tsx
import Button from '../common/Button';
import { faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
```

### Examples

#### Primary Button
```tsx
<Button variant="primary" icon={faPlus}>
  New Item
</Button>
```

#### Secondary Button
```tsx
<Button variant="secondary">
  Cancel
</Button>
```

#### Tertiary Button (Standard)
```tsx
<Button variant="tertiary" icon={faPlus}>
  Add Item
</Button>
```



#### Icon Button
```tsx
<Button variant="icon" icon={faTrash} title="Delete" />
```

#### Back Arrow Button
```tsx
<Button variant="back-arrow" icon={faArrowLeft} onClick={handleBack} />
```

#### Upload Box Button
```tsx
<Button variant="upload-box">
  Browse Files
</Button>
```

### Props

- `variant`: 'primary' | 'secondary' | 'tertiary' | 'icon' | 'back-arrow' | 'upload-box'
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `icon`: FontAwesome icon definition
- `iconPosition`: 'left' | 'right' (default: 'left')
- `disabled`: boolean
- `className`: Additional CSS classes
- All standard button HTML attributes

### Icon Buttons
```tsx
className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
```

### Back Arrow Buttons
```tsx
className="mr-3 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
```

### Upload Box Buttons (File Browse)
```tsx
className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 hover:shadow-sm transition-all duration-200"
```

## Form Styling

### Form Layout Patterns

#### Horizontal Form Layout
```tsx
<div className="flex items-center space-x-4">
  <div className="flex-1">
    <label className="block text-sm font-semibold text-neutral-600 mb-1">Label</label>
    <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors" />
  </div>
  <div className="flex-1">
    <label className="block text-sm font-semibold text-neutral-600 mb-1">Label</label>
    <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors" />
  </div>
</div>
```

#### Vertical Form Layout
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-semibold text-neutral-600 mb-1">Label</label>
    <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors" />
  </div>
</div>
```

### Form Input Styling

#### Standard Input
```tsx
className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
```

#### Select Dropdown
```tsx
className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
```

#### Required Field Indicator
Use a red left border to indicate required fields (not asterisks). The indicator should only appear when the field is empty/invalid:
```tsx
// Conditional red left border - only shows when field is empty after user interaction
className={`w-full px-3 py-2 border rounded-lg electronInput ${
  touched && !value.trim()
    ? 'border-l-4 border-l-red-500 border-red-600'
    : 'border-neutral-200'
}`}
```
Note: The red left border appears only after the user has interacted with the field (touched) and left it empty. This provides a clear visual indicator without overwhelming new users.

#### Search Input with Icon
```tsx
<div className="relative">
  <input 
    className="w-full px-4 py-2 pl-10 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
    placeholder="Search..."
  />
  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" width="16" height="16">
    {/* Search icon */}
  </svg>
</div>
```

#### Form Labels
```tsx
className="block text-sm font-semibold text-neutral-600 mb-1"
```

## Table Styling

### DataTable Configuration

#### For tables inside white containers (most common):
```tsx
<DataTable
  columns={columns}
  data={data}
  loading={false}
  title="Table Title"
  footer={<TableFooter />}
  {...DataTablePresets.standard}
  minWidth="1190px"
/>
```

#### For standalone tables (with container borders):
```tsx
<DataTable
  columns={columns}
  data={data}
  loading={false}
  title="Table Title"
  footer={<TableFooter />}
  {...DataTablePresets.standalone}
  minWidth="1190px"
/>
```

### DataTable Presets

- **`DataTablePresets.standard`** - Table with borders and rounded corners, no shadow (for tables inside white containers)
- **`DataTablePresets.standalone`** - Table with borders, rounded corners, and shadow (for independent tables)
- **`DataTablePresets.compact`** - Dense layout with zebra stripes, borders, and rounded corners
- **`DataTablePresets.simple`** - No borders, zebra stripes only
- **`DataTablePresets.minimal`** - No styling, basic table

### Table Footer Pattern with Navigation
```tsx
const footer = (
  <div className="flex items-center justify-between">
    <div className="text-sm text-neutral-600">
      Showing {filteredItems.length === 0 ? 0 : 1}-{filteredItems.length} of {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
    </div>
    <div className="flex gap-2">
      <button 
        className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200" 
        disabled={true}
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <button 
        className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors duration-200" 
        disabled={true}
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
  </div>
);
```

### Table Actions

Use the `TableActions` component with presets:

```tsx
<TableActions
  actions={TableActionPresets.crudWithDuplicate(
    () => handleEdit(item),
    () => handleDuplicate(item),
    () => handleDelete(item)
  )}
  className="justify-center"
/>
```

### Custom Table Styling

For tables with drag and drop or custom functionality:

```tsx
<div className="rounded-lg border border-neutral-200 overflow-hidden">
  <div className="px-4 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
    <h3 className="text-lg font-semibold text-neutral-900">Section Title</h3>
    <button className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-all duration-200 flex items-center">
      <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Item
    </button>
  </div>
  
  <div className="overflow-x-auto">
    <table className="w-full min-w-[800px] table-auto">
      <colgroup>
        <col style={{ width: '60px', minWidth: '60px' }} />
        <col style={{ width: '200px', minWidth: '200px' }} />
        {/* More columns */}
      </colgroup>
      
      <thead>
        <tr className="bg-neutral-50 border-b border-neutral-200">
          <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">#</th>
          <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Column</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-200 bg-white">
        {/* Table rows */}
      </tbody>
    </table>
  </div>
  
  <div className="p-4 border-t border-neutral-200 bg-white">
    <div className="flex justify-between items-center text-sm text-neutral-600">
      <span>{items.length} item{items.length !== 1 ? 's' : ''} configured</span>
      <span className="text-xs text-neutral-500">Additional info</span>
    </div>
  </div>
</div>
```

## Search and Filters

### Horizontal Search and Filters Layout
```tsx
<div className="flex items-center gap-4">
  <div className="flex-1">
    <SearchInput value={searchTerm} onChange={setSearchTerm} />
  </div>
  <div className="w-48">
    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
      <option>All Categories</option>
    </select>
  </div>
  <div className="w-48">
    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
      <option>All Types</option>
    </select>
  </div>
</div>
```

## Container Styling

### Main White Container
```tsx
className="bg-white rounded-lg shadow-sm p-6 space-y-6"
```

### Section Containers
```tsx
className="rounded-lg border border-neutral-200 overflow-hidden"
```

### Section Headers
```tsx
className="px-4 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center"
```

## Color Palette

### Neutral Colors
- `neutral-50` - Light backgrounds, hover states, table headers
- `neutral-100` - Subtle backgrounds, disabled states
- `neutral-200` - Borders, dividers, tertiary button backgrounds
- `neutral-300` - Tertiary button hover states
- `neutral-400` - Icons, separators
- `neutral-500` - Tertiary text, breadcrumb text
- `neutral-600` - Secondary text, button text
- `neutral-700` - Dark secondary text, tertiary button text
- `neutral-800` - Primary button hover states
- `neutral-900` - Primary text, primary button backgrounds

### Status Colors
- `green-100` / `green-800` - Success states, default badges
- `blue-600` / `blue-800` - Links, info states
- `red-100` / `red-600` / `red-700` - Error states, danger actions
- `amber-500` / `amber-600` / `amber-700` - Warning states, warning icons and text
- `yellow-100` / `yellow-800` - Alternative warning states

### Focus Colors
- `primary-500` - Focus ring color for form inputs

## Typography

### Headings
- `text-2xl font-semibold` - Page titles (H1)
- `text-lg font-semibold` - Section titles (H2)
- `text-sm font-semibold` - Labels, table headers, breadcrumbs

### Body Text
- `text-neutral-900` - Primary text
- `text-neutral-600` - Secondary text, descriptions
- `text-neutral-500` - Tertiary text, breadcrumbs
- `text-sm` - Standard body text
- `text-xs` - Small text, badges, helper text

### Font Weights
- `font-semibold` - All headings, labels, important text
- `font-medium` - Table cell content, emphasized text
- `font-normal` - Regular body text (default)

## Spacing

### Container Spacing
- `p-6` - Standard container padding
- `p-8` - Large container padding (main layout)
- `space-y-6` - Standard vertical spacing between sections
- `mb-8` - Standard margin below headers

### Component Spacing
- `gap-4` - Standard gap between form elements
- `gap-2` - Small gap between buttons
- `gap-1` - Tiny gap between action buttons
- `space-x-3` - Standard horizontal spacing between buttons
- `space-x-4` - Standard horizontal spacing between form fields
- `mr-3` - Standard margin for back arrows
- `mx-2` - Small horizontal margin for breadcrumb separators

### Padding and Margins
- `px-4 py-2` - Standard button padding
- `px-3 py-1.5` - Small button/input padding
- `px-4 py-3` - Table cell padding
- `mb-1` - Small margin below labels
- `mb-4` - Standard margin below sections

## Transitions

### Standard Transition
```tsx
className="transition-all duration-200"
```

### Color Transitions
```tsx
className="transition-colors duration-200"
```

### Hover Effects
- Buttons: Scale, shadow, and color changes
- Links: Color changes
- Icons: Color changes
- Table rows: Background color changes

## Layout Patterns

### DashboardLayout Integration
All pages should use the `DashboardLayout` component:

```tsx
<DashboardLayout
  sidebar={<SidebarMenu active={activeSection} onSelect={handleSectionChange} />}
  stickyBar={stickyBarContent}
>
  <PageContent />
</DashboardLayout>
```

### Responsive Design
- Use `min-w-0` for flex items that need to shrink
- Use `overflow-x-auto` for tables that might overflow
- Set `minWidth` on DataTables to prevent cramping
- Use `flex-1` for flexible form fields

## Examples

### Import Templates Page
- ✅ Standard list page layout
- ✅ Header outside white container
- ✅ Search and table inside white container
- ✅ Proper button styling with hover effects
- ✅ Table footer with item counts
- ✅ Back navigation with inline breadcrumbs

### Export Templates Page
- ✅ Standard list page layout
- ✅ Header outside white container
- ✅ Search and table inside white container
- ✅ Proper button styling with hover effects
- ✅ Table footer with item counts
- ✅ Back navigation with inline breadcrumbs
- ✅ Tertiary button styling for Add Field

### New Template Editor Pages
- ✅ Back arrow next to H1 title
- ✅ Inline breadcrumb navigation
- ✅ Form inside white container
- ✅ Proper form field styling
- ✅ Consistent button styling

## Status Messages

### Message Types
Use these four message types consistently:

| Type | Use Case | Colors |
|------|----------|--------|
| **Error** (red) | Validation failures, parse errors, blocking issues | `bg-red-50`, `border-red-200`, `text-red-700/800` |
| **Warning** (yellow/amber) | Non-blocking issues, cautions | `bg-yellow-50`, `border-yellow-200`, `text-yellow-700/800` |
| **Success** (green) | Completed actions (file upload, save completed) | `bg-green-50`, `border-green-200`, `text-green-700/800` |
| **Info** (blue) | Informational messages, current state, help text | `bg-blue-50`, `border-blue-200`, `text-blue-700/800` |

### Toast Notifications (for transient feedback)

Use the reusable Toast component for action feedback that should auto-dismiss:

```tsx
import { useToast, ToastContainer } from '../common/Toast';

const MyComponent: FC = () => {
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully');
    } catch (error) {
      showError('Failed to save data');
    }
  };

  return (
    <div>
      {/* Your component content */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
```

**Toast Features:**
- Fixed position (top-right corner)
- Slide-in animation from right
- Auto-dismiss after 4 seconds
- Manual dismiss with X button
- Uses Status Message color palette
- Stacks multiple toasts with gap

**When to use Toasts vs Inline Messages:**
- **Toasts**: Transient feedback after user actions (save, delete, duplicate, etc.)
- **Inline Messages**: Persistent state information, validation errors that need fixing, warnings about current data

### Consolidated Status Area
Group status messages in a single container, ordered by severity:

```tsx
<div className="mt-4 space-y-3">
  {/* Error messages first */}
  {error && (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <span className="mr-2 text-red-500">❌</span>
        <div>
          <h4 className="text-sm font-medium text-red-800">Error Title</h4>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    </div>
  )}

  {/* Warnings second */}
  {warnings.length > 0 && (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
      <div className="flex items-center mb-1">
        <span className="mr-2">⚠️</span>
        <h4 className="text-sm font-medium text-yellow-800">Warnings ({warnings.length})</h4>
      </div>
      <div className="ml-8 mt-1 space-y-1">
        {warnings.map((w, i) => (
          <p key={i} className="text-sm text-yellow-700">• {w}</p>
        ))}
      </div>
    </div>
  )}

  {/* Info messages (current state, helpful information) */}
  {info && (
    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center">
      <span className="mr-2 text-blue-600">ℹ</span>
      <p className="text-sm text-blue-800">{info}</p>
    </div>
  )}

  {/* Success messages (completed actions) */}
  {success && (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
      <div className="flex items-center mb-2">
        <span className="mr-2">✅</span>
        <p className="text-sm font-medium text-green-800">Success message</p>
      </div>
    </div>
  )}
</div>
```

## Hidden Field Toggle

### Pattern for Hiding ID Fields
Auto-hide fields matching ID patterns and provide toggle:

```tsx
// Helper function to detect ID-like fields
const isLikelyIdField = (fieldName: string): boolean => {
  const idPatterns = /^(id|_id|key|uuid|guid|offset|index|cursor|token)$/i;
  const idSuffixes = /(Id|_id|Key|Uuid|Guid|Token)$/;
  const systemPrefixes = /^(__)/;
  return idPatterns.test(fieldName) || idSuffixes.test(fieldName) || systemPrefixes.test(fieldName);
};

// Toggle UI
{hiddenFieldCount > 0 && (
  <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
    <input
      type="checkbox"
      checked={showHiddenFields}
      onChange={(e) => setShowHiddenFields(e.target.checked)}
      className="rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
    />
    Show {hiddenFieldCount} hidden ID field{hiddenFieldCount !== 1 ? 's' : ''}
  </label>
)}
```

## Combined Field Rows

### Styling for Combined Fields
Use neutral background for rows and blue pill style for the "Combined" badge:

```tsx
// Combined field row - neutral background, no hover effect
<tr className="bg-neutral-100">
  <td className="px-4 py-4 text-sm font-medium text-neutral-900">...</td>
  <td className="px-4 py-4 text-sm text-neutral-600">...</td>
</tr>

// Combined badge - blue pill style for visual distinction
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  Combined
</span>

// Real preview (concatenated sample values with delimiter)
<span className="italic">
  {fields.map(f => f.sampleData || 'N/A').join(delimiter)}
</span>
```

## Modal Dialogs

### ConfirmDialog Component

Use `ConfirmDialog` for destructive actions instead of `window.confirm()`:

```tsx
import ConfirmDialog from '../common/ConfirmDialog';

// State for managing dialog
const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

// Open dialog
const handleDelete = (item: Item) => setDeleteTarget(item);

// Handle confirmation
const handleConfirmDelete = async () => {
  if (deleteTarget) {
    await deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }
};

// JSX
<ConfirmDialog
  isOpen={deleteTarget !== null}
  title="Delete Item"
  message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  variant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```

### ConfirmDialog Props

- `isOpen`: boolean - Controls dialog visibility
- `title`: string - Dialog title
- `message`: string - Confirmation message
- `confirmLabel`: string (default: "Confirm") - Confirm button text
- `cancelLabel`: string (default: "Cancel") - Cancel button text
- `variant`: 'danger' | 'warning' | 'default' - Button color scheme
- `onConfirm`: () => void - Called when user confirms
- `onCancel`: () => void - Called when user cancels

### Modal Styling Pattern

For custom modals, use this portal pattern:

```tsx
import { createPortal } from 'react-dom';

{showModal && createPortal(
  <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-neutral-900 bg-opacity-50 transition-opacity"
      onClick={onCancel}
      aria-hidden="true"
    />

    {/* Modal Container */}
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Title</h3>
          <p className="text-neutral-600">Message content</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <button className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-100">
            Cancel
          </button>
          <button className="px-4 py-2.5 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
)}
```

### Accessibility for Modals

Always include these accessibility attributes:

```tsx
// Dialog container
role="dialog"
aria-modal="true"
aria-labelledby="dialog-title"

// Close button
aria-label="Close dialog"

// Icons
aria-hidden="true"
```

This comprehensive design guide ensures consistency across all pages and components in the BankBridge application. All new pages and components should follow these established patterns. 