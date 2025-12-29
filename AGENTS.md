# AGENTS.md

Guidelines for AI agents working on this codebase.

## Project Overview

**Date Browser** is an Obsidian plugin that displays notes with `YYYY-MM-DD` filename prefixes in a dedicated sidebar view, sorted by date descending.

## Architecture

```
src/
├── main.ts                      # Plugin entry point, registers view and events
├── views/
│   └── DailyNotesView.ts        # ItemView subclass for sidebar UI
├── services/
│   ├── DateParser.ts            # Pure functions for date extraction
│   └── DateNoteScanner.ts       # Scans vault, filters and sorts notes
├── models/
│   └── DailyNoteItem.ts         # Data model interfaces
└── interfaces/
    └── VaultAdapter.ts          # Abstraction over Obsidian Vault API
```

### Key Design Decisions

1. **Separation of concerns**: Business logic (`DateParser`, `DateNoteScanner`) is decoupled from Obsidian APIs via the `VaultAdapter` interface. This enables unit testing without mocking Obsidian.

2. **Pure functions for parsing**: `DateParser` contains pure functions with no side effects, making them trivially testable.

3. **View refresh on vault events**: The plugin listens to `create`, `delete`, and `rename` events to keep the view in sync.

## Testing

Tests live in `test/` and use Jest with ts-jest.

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

### What's tested
- `DateParser`: Date extraction, validation, sort key generation
- `DateNoteScanner`: Filtering, sorting, directory-agnostic behavior

### What's NOT tested
- `DailyNotesView`: Tightly coupled to Obsidian DOM APIs
- `main.ts`: Trivial registration code

### Test utilities
- `test/fakes/FakeVaultAdapter.ts`: Test double for vault operations
- `test/__mocks__/obsidian.ts`: Minimal mock for imports

## Build & Development

```bash
npm install           # Install dependencies
npm run dev           # Watch mode (auto-rebuild)
npm run build         # Production build
./install.sh <vault>  # Symlink to a vault (uses relative paths)
```

The build outputs `main.js` in the project root (required by Obsidian).

## Code Conventions

- **TypeScript strict mode**: `noImplicitAny` and `strictNullChecks` enabled
- **No default exports** except for `main.ts` (required by Obsidian)
- **Interfaces over classes** for data models
- **Explicit return types** on public functions

## Adding Features

### To add a new filter/sort option:
1. Add logic to `DateNoteScanner`
2. Add tests in `test/DateNoteScanner.test.ts`
3. Update `DailyNotesView.redraw()` to use new functionality

### To add heading extraction (future):
1. Implement `scanForDatedHeadings()` in `DateNoteScanner`
2. Create `HeadingItem` model in `src/models/`
3. Use `VaultAdapter.readFile()` to get note content
4. Reuse `DateParser.parseHeading()` for date extraction

## File Naming

The plugin matches files starting with `YYYY-MM-DD`:
- `2024-01-15.md` ✓
- `2024-01-15 Meeting.md` ✓
- `2024-01-15-standup.md` ✓
- `Meeting 2024-01-15.md` ✗ (date not at start)
