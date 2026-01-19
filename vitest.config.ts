/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Run SmartParse tests in Node environment (requires fs access)
    environmentMatchGlobs: [
      ['src/services/__tests__/SmartParse.test.ts', 'node'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'src/main.ts', // Electron main process
        'src/main.tsx', // React entry point (bootstrapping)
        'src/preload.ts', // Electron preload script
        'src/main/**', // Electron main process handlers
        'src/components/Debug/**', // Debug panel (dev only)
        'src/components/examples/**', // Styling examples (dev only)
        'src/components/ExampleComponent.tsx', // CSS Modules example
        'src/services/SmartParse.worker.ts', // Web worker (tested via integration)
        'src/services/storageLocation.ts', // File system utilities (Electron-only)
        'src/services/templateDebugUtils.ts', // Debug utilities (dev only)
        'src/services/fileParser.js', // Legacy stub (not used)
        'scripts/**', // Build scripts
        '**/index.ts', // Re-export files
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 75,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}) 