---
name: frontend-design
description: Helps with UI/UX design decisions, component styling with Tailwind CSS, modal/dialog patterns, and design consistency. Invoked when discussing UI design, layouts, styling, modals, forms, or when fixing UI issues.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# Frontend Design Skill for BankBridge

## Design Documentation Reference
Always check `DESIGN_GUIDE.md` for established patterns before implementing UI.

## Core Design Principles

1. **Consistency** - Match existing component patterns in the codebase
2. **Accessibility** - Semantic HTML, proper color contrast, keyboard navigation
3. **Electron-specific** - Use `electronInput` class for all form inputs
4. **Clean modals** - Use React Portal (`createPortal`) for modals to avoid z-index issues

## Modal/Dialog Best Practices

### Always Use React Portal for Modals
```tsx
import { createPortal } from 'react-dom';

// Render modal via portal to avoid z-index conflicts
{showModal && createPortal(
  <MyModal onClose={handleClose} />,
  document.body
)}
```

### Modal Structure Pattern
```tsx
<div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
  {/* Backdrop */}
  <div className="fixed inset-0 bg-neutral-900 bg-opacity-50" onClick={onClose} />

  {/* Modal Container - centers the modal */}
  <div className="flex min-h-full items-center justify-center p-4">
    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">{children}</div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
        <button className="px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg">Cancel</button>
        <button className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg">Save</button>
      </div>
    </div>
  </div>
</div>
```

### Modal Features to Include
- Escape key to close
- Click backdrop to close
- Focus trap (optional)
- Proper aria attributes

## Button Patterns

### Primary Button
```tsx
className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
```

### Secondary Button
```tsx
className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
```

### Danger Button
```tsx
className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
```

### Icon Button
```tsx
className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
```

## Form Input Patterns

### Standard Input
```tsx
className="electronInput w-full px-3 py-2.5 border border-neutral-300 rounded-lg
  text-neutral-900 placeholder-neutral-400
  hover:border-neutral-400
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
```

### Input with Error
```tsx
className="electronInput w-full px-3 py-2.5 border rounded-lg
  border-red-300 bg-red-50
  focus:outline-none focus:ring-2 focus:ring-red-500"
```

### Select Dropdown
```tsx
<select
  className="electronInput w-full px-3 py-2.5 border border-neutral-300 rounded-lg appearance-none bg-white"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem'
  }}
>
```

### Form Label
```tsx
<label className="block text-sm font-medium text-neutral-700 mb-1.5">
  Label <span className="text-red-500">*</span>
</label>
```

### Error Message
```tsx
<p className="text-red-600 text-sm mt-1.5">{error}</p>
```

## Table Patterns

### Table Container
```tsx
<div className="bg-white rounded-lg shadow-sm border border-neutral-200">
  {/* Header */}
  <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
    <h3 className="text-lg font-semibold">Title</h3>
    <button>Add Button</button>
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full">...</table>
  </div>
</div>
```

### Table Header Row
```tsx
<tr className="bg-neutral-50 border-y border-neutral-200">
  <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
    Column
  </th>
</tr>
```

### Table Body Row
```tsx
<tr className="hover:bg-neutral-50 transition-colors border-b border-neutral-100">
  <td className="py-3.5 px-6">{content}</td>
</tr>
```

## Badge/Pill Patterns

### Status Badges
```tsx
// Blue
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"

// Green
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"

// Purple
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"

// Amber
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
```

## Alert/Message Patterns

### Success Message
```tsx
<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
  {message}
</div>
```

### Error Message
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
  {message}
</div>
```

### Warning Message
```tsx
<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
  {message}
</div>
```

## Empty State Pattern
```tsx
<div className="text-center py-12">
  <div className="text-neutral-400 mb-3">
    <svg className="w-12 h-12 mx-auto">{/* icon */}</svg>
  </div>
  <p className="text-neutral-600 mb-4">No items found</p>
  <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
    Add your first item
  </button>
</div>
```

## Color Palette Quick Reference

### Neutrals
- `neutral-50` - Light backgrounds, hover states
- `neutral-100` - Subtle backgrounds
- `neutral-200` - Borders, dividers
- `neutral-300` - Secondary borders
- `neutral-400` - Icons, muted elements
- `neutral-500` - Tertiary text
- `neutral-600` - Secondary text
- `neutral-700` - Body text
- `neutral-900` - Primary text, headings

### Status Colors
- Red: `red-50/200/600/700` - Errors, destructive
- Green: `green-50/200/700` - Success
- Amber: `amber-50/200/700/800` - Warnings
- Blue: `blue-50/200/500/600` - Info, focus, links

## Spacing Reference

- `p-4`, `p-6` - Container padding
- `px-6 py-4` - Modal header/footer
- `px-6 py-5` - Modal body
- `gap-3` - Button groups
- `mb-1.5` - Label to input
- `mt-1.5` - Input to error message
- `space-y-5` - Form field vertical spacing

## Common Issues to Avoid

1. **Modal z-index conflicts** - Always use `createPortal` and `z-50`
2. **Missing electronInput class** - Required for Electron input responsiveness
3. **Inconsistent button styles** - Use the established patterns above
4. **Missing transitions** - Add `transition-colors` for hover effects
5. **Poor focus states** - Always include `focus:ring-2 focus:ring-blue-500`
