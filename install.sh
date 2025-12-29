#!/bin/bash
#
# Install the date-browser plugin into an Obsidian vault by creating a relative symlink.
#
# Usage:
#   ./install.sh /path/to/vault
#   ./install.sh ../testvault
#

set -e

PLUGIN_ID="date-browser"

if [ -z "$1" ]; then
    echo "Usage: $0 <vault-path>"
    echo ""
    echo "Examples:"
    echo "  $0 ../testvault"
    echo "  $0 ~/Documents/MyVault"
    exit 1
fi

VAULT_PATH="$1"

# Resolve to absolute path for validation
VAULT_ABS=$(cd "$VAULT_PATH" 2>/dev/null && pwd) || {
    echo "Error: Vault path does not exist: $VAULT_PATH"
    exit 1
}

# Check if it looks like an Obsidian vault
if [ ! -d "$VAULT_ABS/.obsidian" ]; then
    echo "Error: $VAULT_PATH does not appear to be an Obsidian vault (no .obsidian folder)"
    exit 1
fi

# Get the directory where this script lives (the plugin source)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR_NAME="$(basename "$SCRIPT_DIR")"

# Create plugins directory if it doesn't exist
PLUGINS_DIR="$VAULT_ABS/.obsidian/plugins"
mkdir -p "$PLUGINS_DIR"

# Target symlink location
LINK_PATH="$PLUGINS_DIR/$PLUGIN_ID"

# Check if already installed
if [ -e "$LINK_PATH" ]; then
    if [ -L "$LINK_PATH" ]; then
        EXISTING_TARGET=$(readlink "$LINK_PATH")
        echo "Plugin already installed at: $LINK_PATH"
        echo "  -> $EXISTING_TARGET"
        echo ""
        read -p "Replace existing symlink? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 0
        fi
        rm "$LINK_PATH"
    else
        echo "Error: $LINK_PATH exists but is not a symlink. Remove it manually if you want to reinstall."
        exit 1
    fi
fi

# Calculate relative path from plugins dir to plugin source
# We need to go from .obsidian/plugins/date-browser -> ../../..<path-to-plugin>
RELATIVE_PATH=$(python3 -c "import os.path; print(os.path.relpath('$SCRIPT_DIR', '$PLUGINS_DIR'))")

# Create the relative symlink
cd "$PLUGINS_DIR"
ln -s "$RELATIVE_PATH" "$PLUGIN_ID"

echo "Installed $PLUGIN_ID to $VAULT_PATH"
echo ""
echo "Symlink created:"
echo "  $LINK_PATH -> $RELATIVE_PATH"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run build' (or 'npm run dev' for development)"
echo "  2. In Obsidian, go to Settings -> Community Plugins"
echo "  3. Disable Safe Mode if prompted"
echo "  4. Enable '$PLUGIN_ID'"
