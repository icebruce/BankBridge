# BankBridge

An Electron desktop application that bridges the gap between various bank statement formats and Monarch Money's import requirements.

## Problem

Monarch Money lacks native integrations with many banks, forcing users to:
- Manually export data from their banks
- Transform it to match Monarch's expected format
- Manually deduplicate transactions

This is time-consuming and error-prone.

## Solution

BankBridge automates this workflow with:
- **Template-based mapping** - Define how source fields map to target fields
- **Intelligent duplicate detection** - Identify and handle duplicate transactions
- **Master data management** - Maintain reference data for consistent processing
- **Automated export generation** - Generate Monarch-compatible CSV/Excel files

## Features

### Import Templates
- Map source file columns to standardized fields
- Field combinations (merge multiple source fields)
- Data type detection (text, number, currency, date, boolean)
- Support for multiple accounts and file types

### Export Templates
- Define output field mappings
- Format transformations
- Multiple export formats (CSV, JSON, etc.)

### File Processing
- High-performance streaming parser
- Handles large files without blocking UI
- Real-time progress tracking
- Comprehensive error reporting with reject files

### Master Data (Planned)
- Reference data management
- Lookup tables for consistent categorization

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Build | Vite |
| Testing | Vitest + React Testing Library |
| Parsing | fast-csv, stream-json |
| Validation | Zod |
| Logging | Winston |

## Getting Started

### Prerequisites
- Node.js v16+
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run start
```

### Testing
```bash
npm test                # Run tests
npm run test:coverage   # With coverage report
npm run test:ui         # Visual test runner
```

### Build
```bash
npm run build
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ IPC Handlers│  │Worker Thread│  │ File System     │ │
│  │             │◄─┤ (SmartParse)│  │ Storage         │ │
│  └──────┬──────┘  └─────────────┘  └─────────────────┘ │
└─────────┼───────────────────────────────────────────────┘
          │ IPC
┌─────────▼───────────────────────────────────────────────┐
│                  Electron Renderer Process              │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  React Application               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │   │
│  │  │ Import   │ │ Export   │ │ Process Files    │ │   │
│  │  │ Templates│ │ Templates│ │                  │ │   │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │            Services Layer                 │   │   │
│  │  │  templateService, SmartParse, etc.       │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Storage: localStorage (templates)                      │
└─────────────────────────────────────────────────────────┘
```

## Documentation

- [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) - UI/UX patterns and styling
- [PARSING_STRATEGY.md](./PARSING_STRATEGY.md) - File parsing strategy
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing approach
- [TEMPLATE_STORAGE.md](./TEMPLATE_STORAGE.md) - Template persistence
- [ELECTRON_INPUT_FIXES.md](./ELECTRON_INPUT_FIXES.md) - Electron optimizations

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines.
