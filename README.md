# Date Browser

An Obsidian plugin that provides an alternate view for browsing notes with date-prefixed filenames (YYYY-MM-DD).

## Features

- **Date-filtered view**: Shows only notes whose filenames begin with `YYYY-MM-DD`
- **Sorted by date**: Most recent dates appear first
- **Directory-agnostic**: Notes are displayed regardless of their folder location
- **Left sidebar integration**: Appears as a custom view in Obsidian's left sidebar
- **Live updates**: Automatically refreshes when files are created, deleted, or renamed

## Installation

### From Obsidian Community Plugins

*(Coming soon)*

### Manual Installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder in your vault: `.obsidian/plugins/date-browser/`
3. Copy the downloaded files into this folder
4. Restart Obsidian
5. Enable the plugin in Settings → Community Plugins

## Development Setup

### Prerequisites

- Node.js v16 or higher
- npm

### Getting Started

```bash
# Clone the repository
git clone <repo-url> date-browser
cd date-browser

# Install dependencies
npm install

# Start development mode (watches for changes)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Installing to a Vault (Development)

Use the install script to create a relative symlink to your test vault:

```bash
# Install to a vault (uses relative symlinks)
./install.sh ../testvault
./install.sh ~/Documents/MyVault
```

The script will:
- Validate the vault path
- Create the `.obsidian/plugins` directory if needed
- Create a relative symlink (e.g., `../../../alternate-browse`)
- Prompt before replacing existing installations

#### Manual Symlinking

If you prefer to create symlinks manually:

**macOS / Linux:**
```bash
# From the vault's plugins directory
cd /path/to/vault/.obsidian/plugins
ln -s ../../../alternate-browse date-browser
```

**Windows (PowerShell as Administrator):**
```powershell
cd C:\path\to\vault\.obsidian\plugins
New-Item -ItemType SymbolicLink -Path "date-browser" -Target "..\..\..\alternate-browse"
```

### Development Workflow

1. Run `./install.sh ../your-test-vault` to install
2. Run `npm run dev` to start esbuild in watch mode
3. Make changes to TypeScript files in `src/`
4. Press `Ctrl/Cmd + R` in Obsidian to reload and see changes
5. (Optional) Install the [Hot Reload plugin](https://github.com/pjeby/hot-reload) for automatic reloading

### Verifying the Symlink

```bash
# Check symlink exists and points correctly
ls -la "/path/to/vault/.obsidian/plugins/"

# Should show:
# date-browser -> ../../../alternate-browse
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Plugin not appearing | Ensure `manifest.json` exists with valid `id` |
| "Plugin failed to load" | Check Obsidian console (Ctrl+Shift+I) for errors |
| Changes not reflecting | Reload Obsidian, verify esbuild is running |
| Symlink permission denied | Run terminal as administrator (Windows) |

## Usage

Once installed and enabled:

1. Click the calendar icon in the left ribbon, or
2. Use the command palette: "Open Daily Notes view"

The view will appear in the left sidebar showing all notes with `YYYY-MM-DD` filename prefixes.

### Click Behavior

- **Click**: Opens the note in the current pane
- **Ctrl/Cmd + Click**: Opens the note in a new tab

## File Naming Convention

The plugin looks for notes with filenames starting with the pattern `YYYY-MM-DD`:

| Filename | Shown |
|----------|-------|
| `2024-01-15.md` | ✓ |
| `2024-01-15 Meeting Notes.md` | ✓ |
| `2024-01-15-daily-standup.md` | ✓ |
| `Meeting Notes.md` | ✗ |
| `notes-2024-01-15.md` | ✗ |

## Architecture

```
src/
├── main.ts                    # Plugin entry point
├── views/
│   └── DailyNotesView.ts      # Sidebar view implementation
├── services/
│   ├── DateNoteScanner.ts     # Vault scanning and sorting
│   └── DateParser.ts          # Date extraction (pure function)
├── models/
│   └── DailyNoteItem.ts       # Data model
└── interfaces/
    └── VaultAdapter.ts        # Abstraction for testing
```

### Testing

Business logic is separated from Obsidian APIs for easy unit testing:

```bash
npm test
```

Tests cover:
- `DateParser`: Date extraction and validation
- `DateNoteScanner`: File filtering and sorting

## Future Plans

- Support for date-prefixed headings within notes (e.g., `## 2024-01-15 Meeting`)
- Grouping by month/year
- Search/filter within the view

## License

MIT
