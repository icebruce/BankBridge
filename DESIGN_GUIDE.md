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
```tsx
className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-all duration-200"
```

### Icon Buttons
```tsx
className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
```

### Back Arrow Buttons
```tsx
className="mr-3 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
```

## Form Styling

### Form Layout Patterns

#### Horizontal Form Layout
```tsx
<div className="flex items-center space-x-4">
  <div className="flex-1">
    <label className="block text-sm font-semibold text-neutral-600 mb-1">Label</label>
    <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
  </div>
  <div className="flex-1">
    <label className="block text-sm font-semibold text-neutral-600 mb-1">Label</label>
    <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
  </div>
</div>
```

#### Vertical Form Layout
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-semibold text-neutral-600 mb-1">Label</label>
    <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
  </div>
</div>
```

### Form Input Styling

#### Standard Input
```tsx
className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
```

#### Select Dropdown
```tsx
className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
```

#### Search Input with Icon
```tsx
<div className="relative">
  <input 
    className="w-full px-4 py-2 pl-10 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
      <option>All Categories</option>
    </select>
  </div>
  <div className="w-48">
    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
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
- `yellow-100` / `yellow-800` - Warning states

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

This comprehensive design guide ensures consistency across all pages and components in the BankBridge application. All new pages and components should follow these established patterns. 