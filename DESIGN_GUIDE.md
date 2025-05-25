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

### Key Components:

#### 1. Page Header
- **Location**: Outside the white container
- **Styling**: `mb-8` for spacing
- **Content**: Page title, description, and primary action button
- **Pattern**: 
  ```tsx
  <div className="flex justify-between items-center mb-4">
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold">Page Title</h2>
      <p className="text-neutral-600">Page description</p>
    </div>
    <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200">
      Primary Action
    </button>
  </div>
  ```

#### 2. White Container
- **Styling**: `bg-white rounded-lg shadow-sm p-6 space-y-6`
- **Purpose**: Groups related content (search, filters, table)
- **Spacing**: `space-y-6` between child elements

#### 3. Search and Filters
- **Location**: First element inside white container
- **Styling**: No additional container needed
- **Pattern**: Horizontal layout with search input and filter dropdowns

#### 4. Data Tables
- **Component**: Use `DataTable` component for consistency
- **Footer**: Always include footer with item counts
- **Styling**: `bordered={false}` when inside white container

## Button Styling

### Primary Buttons
```tsx
className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200"
```

### Secondary Buttons
```tsx
className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
```

### Tertiary Buttons
```tsx
className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-all duration-200"
```

## Form Input Styling

### Standard Input
```tsx
className="w-full px-4 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
```

### Search Input with Icon
```tsx
<div className="relative">
  <input className="w-full px-4 py-2 pl-10 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
    {/* Search icon */}
  </svg>
</div>
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

### Border and Corner Styling

All DataTables (except `simple` and `minimal` presets) include:
- ✅ **Outer borders** - Clean border around the entire table
- ✅ **Rounded corners** - Modern `rounded-lg` styling
- ✅ **Header borders** - Bottom border separating header from content
- ✅ **Row dividers** - Subtle borders between table rows

The `containerBordered` prop only controls whether the table has a shadow:
- `containerBordered={true}` - Includes `shadow-sm` for standalone tables
- `containerBordered={false}` - No shadow, for tables inside white containers

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

## Color Palette

### Neutral Colors
- `neutral-50` - Light backgrounds, hover states
- `neutral-100` - Subtle backgrounds
- `neutral-200` - Borders, dividers
- `neutral-600` - Secondary text
- `neutral-700` - Dark secondary text
- `neutral-900` - Primary text, dark buttons

### Status Colors
- `green-100` / `green-800` - Success states, default badges
- `blue-600` / `blue-800` - Links, info states
- `red-50` / `red-600` - Error states, danger actions

## Typography

### Headings
- `text-2xl font-semibold` - Page titles
- `text-lg font-semibold` - Section titles
- `text-sm font-semibold` - Labels, table headers

### Body Text
- `text-neutral-900` - Primary text
- `text-neutral-600` - Secondary text
- `text-neutral-500` - Tertiary text
- `text-sm` - Standard body text
- `text-xs` - Small text, badges

## Spacing

### Container Spacing
- `p-6` - Standard container padding
- `p-8` - Large container padding
- `space-y-6` - Standard vertical spacing between sections
- `mb-8` - Standard margin below headers

### Component Spacing
- `gap-4` - Standard gap between form elements
- `gap-2` - Small gap between buttons
- `space-x-3` - Standard horizontal spacing

## Transitions

### Standard Transition
```tsx
className="transition-all duration-200"
```

### Color Transitions
```tsx
className="transition-colors duration-200"
```

## Examples

### Import Templates Page
- ✅ Follows standard layout pattern
- ✅ Header outside container
- ✅ Search and table inside white container
- ✅ Proper button styling
- ✅ Table footer with counts

### Export Templates Page
- ✅ Follows standard layout pattern
- ✅ Header outside container
- ✅ Search and table inside white container
- ✅ Proper button styling
- ✅ Table footer with counts

This design guide ensures consistency across all pages in the BankBridge application. 