#!/bin/bash

# Claw Dashboard Uninstaller
# Removes desktop shortcuts and stops running processes

APP_NAME="Claw Dashboard"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🗑️  Uninstalling $APP_NAME..."

# Stop running processes
echo "🛑 Stopping running instances..."
pkill -f "electron.*claw-dashboard" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
echo "✅ Stopped running processes"

# Remove desktop shortcut
DESKTOP_SHORTCUT="$HOME/Desktop/claw-dashboard.desktop"
if [ -f "$DESKTOP_SHORTCUT" ]; then
    rm -f "$DESKTOP_SHORTCUT"
    echo "✅ Removed desktop shortcut"
else
    echo "ℹ️  No desktop shortcut found"
fi

# Remove from applications menu
APPS_SHORTCUT="$HOME/.local/share/applications/claw-dashboard.desktop"
if [ -f "$APPS_SHORTCUT" ]; then
    rm -f "$APPS_SHORTCUT"
    echo "✅ Removed from applications menu"
    # Update desktop database
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$HOME/.local/share/applications"
        echo "✅ Updated desktop database"
    fi
else
    echo "ℹ️  Not in applications menu"
fi

# Clean up log files
echo "🧹 Cleaning up log files..."
rm -f "$SCRIPT_DIR/vite.log" 2>/dev/null || true
rm -f "$SCRIPT_DIR/electron.log" 2>/dev/null || true
echo "✅ Cleaned logs"

# Optional: Remove built files
if [ "$1" = "--full" ]; then
    echo "🧨 Removing built files..."
    rm -rf "$SCRIPT_DIR/dist" 2>/dev/null || true
    rm -rf "$SCRIPT_DIR/release" 2>/dev/null || true
    echo "✅ Removed built files"
fi

# Optional: Remove node_modules
if [ "$1" = "--full" ] || [ "$1" = "--clean" ]; then
    echo "🧨 Removing dependencies..."
    rm -rf "$SCRIPT_DIR/node_modules" 2>/dev/null || true
    echo "✅ Removed dependencies"
fi

echo ""
echo "🎉 Uninstall complete!"
echo ""
echo "📁 The application files remain in:"
echo "   $SCRIPT_DIR"
echo ""
echo "🔄 To reinstall:"
echo "   cd $SCRIPT_DIR"
echo "   ./install.sh"
echo ""
echo "⚙️  Options:"
echo "   ./uninstall.sh           # Remove shortcuts only"
echo "   ./uninstall.sh --full    # Remove everything except source"
echo "   ./uninstall.sh --clean   # Remove shortcuts and dependencies"