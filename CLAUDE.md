# Claude Code Instructions for BankBridge

## Project Overview

BankBridge is an Electron desktop app that bridges bank statement formats to Monarch Money's import requirements. It provides template-based import/export mapping, duplicate detection, and automated Excel/CSV export generation.

## Required Reading

Before making changes, read these docs in order:
1. `DESIGN_GUIDE.md` - UI/UX patterns, Tailwind classes, component styling
2. `PARSING_STRATEGY.md` - File parsing hooks, presets, error handling
3. `TESTING_GUIDE.md` - Test structure, coverage requirements, patterns
4. `TEMPLATE_STORAGE.md` - How templates are persisted
5. `ELECTRON_INPUT_FIXES.md` - Electron-specific performance considerations

## Core Principles

### Always Ask Questions
When given a task, surface any:
- Unanswered questions or ambiguities
- Gaps in requirements or logic
- Assumptions that need validation
- Alternative approaches worth considering

Do this BEFORE starting implementation.

### Keep It Simple
- Prefer simple solutions over clever ones
- No premature optimization
- No unnecessary abstractions
- Only build what's requested

### Documentation Must Stay Current
When implementing features or making design changes:
- Update relevant documentation files
- Add new docs for new features
- Keep examples accurate and working

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit types for function parameters and returns
- Use Zod for runtime validation
- Prefer pure functions where possible

### UI/UX
- Follow patterns in `DESIGN_GUIDE.md`
- Use existing Tailwind classes and presets
- Match existing component patterns
- Use `electronInput` class for form inputs

### Error Handling
- Try/catch with actionable error messages
- Use Winston for logging
- Surface errors to users clearly
- Generate reject files for invalid data

### Performance
- Use worker threads for heavy parsing (see `SmartParse.ts`)
- Streaming for large files
- Debounce rapid user inputs
- Avoid unnecessary re-renders (React.memo, useCallback)

## Testing Requirements

- **Coverage**: 90% statements, 85% branches, 90% functions, 90% lines
- Unit tests for services and utilities
- Component tests with React Testing Library
- Test edge cases and error scenarios
- Run `npm test` before committing

## File Organization

```
src/
├── components/     # React components by feature
│   ├── [Feature]/
│   │   ├── __tests__/
│   │   └── *.tsx
├── services/       # Business logic, pure functions
├── models/         # TypeScript interfaces
├── ui/hooks/       # React hooks
├── main/           # Electron main process
└── utils/          # Helper utilities
```

## Git Commits
- Descriptive messages explaining "why"
- Logical, atomic changes
- Run tests before committing

## Commands

```bash
npm run start      # Dev mode (Vite + Electron)
npm test           # Run tests
npm run test:coverage  # Tests with coverage report
npm run typecheck  # TypeScript check
npm run build      # Production build
```

## When Uncertain

ASK before:
- Deleting or renaming existing code
- Adding new dependencies
- Changing data schemas or storage
- Modifying IPC contracts
- Making architectural decisions with multiple valid approaches
