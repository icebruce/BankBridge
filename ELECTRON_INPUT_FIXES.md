# Electron Input Responsiveness Fixes

This document outlines the fixes applied to resolve text input lag and responsiveness issues in the Electron desktop app.

## Issues Identified

1. **Outdated Electron Security Settings**: Using deprecated `nodeIntegration: true` and `contextIsolation: false`
2. **Missing Performance Optimizations**: No hardware acceleration or input-specific optimizations
3. **React Re-render Issues**: Unnecessary component re-renders causing input lag
4. **CSS Performance Issues**: Missing Electron-specific CSS optimizations

## Fixes Applied

### 1. Electron Main Process Optimizations (`src/main.ts`)

```typescript
// Updated BrowserWindow configuration
const win = new BrowserWindow({
  width: 1200,
  height: 900,
  webPreferences: {
    nodeIntegration: false,        // Security improvement
    contextIsolation: true,        // Security improvement
    sandbox: false,
    webSecurity: true,
    experimentalFeatures: true,    // Performance boost
    backgroundThrottling: false,   // Prevent input throttling
  },
  show: false,                     // Prevent visual flash
  titleBarStyle: 'default',
});

// Show window only when ready
win.once('ready-to-show', () => {
  win.show();
  if (win.isFocusable()) {
    win.focus();
  }
});

// Inject Electron-specific CSS optimizations
win.webContents.on('dom-ready', () => {
  win.webContents.insertCSS(`
    input, textarea, select {
      -webkit-user-select: text !important;
      -webkit-app-region: no-drag !important;
      pointer-events: auto !important;
    }
  `);
});
```

### 2. React Component Optimizations

**Memoized Components**: Used `React.memo()` for `SortableRow` to prevent unnecessary re-renders.

**Optimized State Updates**: Used `React.useCallback()` for event handlers:

```typescript
const handleFieldChange = React.useCallback((id: string, property: keyof FieldType, value: string) => {
  setFields(prevFields => prevFields.map(field => 
    field.id === id ? { ...field, [property]: value } : field
  ));
}, []);
```

### 3. CSS Performance Optimizations

Added Electron-specific CSS classes in `NewTemplateEditor.module.css`:

```css
.electronInput {
  -webkit-user-select: text !important;
  -webkit-app-region: no-drag !important;
  pointer-events: auto !important;
  will-change: contents;
  transform: translateZ(0);
}

.tableContainer {
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
}

.dragHandle {
  -webkit-user-select: none;
  user-select: none;
  -webkit-app-region: no-drag;
}
```

## Testing the Fixes

### 1. Start the Electron App
```bash
npm run start
```

### 2. Test Input Responsiveness
1. Navigate to Export Templates
2. Click "New Template"
3. Test typing in:
   - Template name field
   - Description field
   - Field name inputs in the table
   - Format inputs

### 3. Expected Behavior
- ✅ Text inputs should respond immediately to typing
- ✅ No lag when typing or selecting text
- ✅ Cursor should move smoothly
- ✅ Copy/paste should work normally
- ✅ Tab navigation should work

## Common Electron Input Issues & Solutions

### Issue: Input lag or delayed typing
**Solution**: Ensure `-webkit-app-region: no-drag` is applied to input elements

### Issue: Text selection not working
**Solution**: Add `-webkit-user-select: text` to input elements

### Issue: Focus issues
**Solution**: Ensure `pointer-events: auto` and proper focus management

### Issue: Performance during drag operations
**Solution**: Use `will-change` and `transform: translateZ(0)` for hardware acceleration

## Additional Performance Tips

1. **Disable Hardware Acceleration** (if issues persist):
   ```typescript
   app.disableHardwareAcceleration();
   ```

2. **Increase Memory Limits**:
   ```typescript
   app.commandLine.appendSwitch('max-old-space-size', '4096');
   ```

3. **Disable Background Throttling**:
   ```typescript
   webPreferences: {
     backgroundThrottling: false
   }
   ```

## Browser vs Electron Differences

| Feature | Browser | Electron |
|---------|---------|----------|
| Input Performance | Native | Requires optimization |
| Hardware Acceleration | Automatic | Manual configuration |
| Security Context | Sandboxed | Configurable |
| CSS Rendering | Optimized | Needs webkit prefixes |

## Debugging Input Issues

### 1. Enable DevTools
The app automatically opens DevTools in development mode.

### 2. Check Console for Errors
Look for:
- React warnings about re-renders
- CSS errors
- JavaScript errors during input events

### 3. Performance Profiling
Use Chrome DevTools Performance tab to identify:
- Long tasks during input events
- Excessive re-renders
- Layout thrashing

### 4. Test in Browser First
Always test the same functionality in a regular browser to isolate Electron-specific issues.

## Rollback Instructions

If the fixes cause issues, you can rollback by:

1. **Revert Electron settings**:
   ```typescript
   webPreferences: {
     nodeIntegration: true,
     contextIsolation: false,
   }
   ```

2. **Remove CSS optimizations**: Remove `electronInput` class usage

3. **Remove React optimizations**: Remove `React.useCallback` and `React.memo`

## Future Improvements

1. **Implement Virtual Scrolling** for large field lists
2. **Add Debouncing** for rapid input changes
3. **Consider Web Workers** for heavy computations
4. **Implement Progressive Enhancement** for better fallbacks 