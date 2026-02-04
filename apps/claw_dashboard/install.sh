#!/bin/bash

# Claw Dashboard Installer
# Sets up desktop launcher and shortcuts

APP_NAME="Claw Dashboard"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$HOME/Desktop"
APPS_DIR="$HOME/.local/share/applications"

echo "📦 Setting up $APP_NAME..."

# Make launcher executable
chmod +x "$SCRIPT_DIR/launch.sh"
echo "✅ Made launcher executable"

# Create desktop shortcut
echo "📋 Creating desktop shortcut..."
DESKTOP_FILE="$DESKTOP_DIR/claw-dashboard.desktop"
cp "$SCRIPT_DIR/claw-dashboard.desktop" "$DESKTOP_FILE"
chmod +x "$DESKTOP_FILE"
echo "✅ Created desktop shortcut: $DESKTOP_FILE"

# Add to applications menu
echo "📂 Adding to applications menu..."
mkdir -p "$APPS_DIR"
cp "$SCRIPT_DIR/claw-dashboard.desktop" "$APPS_DIR/"
chmod +x "$APPS_DIR/claw-dashboard.desktop"
echo "✅ Added to applications menu: $APPS_DIR/claw-dashboard.desktop"

# Update desktop database (for some desktop environments)
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPS_DIR"
    echo "✅ Updated desktop database"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 You can now launch $APP_NAME by:"
echo "   1. Double-clicking the desktop shortcut"
echo "   2. Searching for 'Claw Dashboard' in your app launcher"
echo "   3. Running: $SCRIPT_DIR/launch.sh"
echo ""
echo "📝 First-time setup:"
echo "   cd $SCRIPT_DIR"
echo "   npm install"
echo "   ./launch.sh"
echo ""
echo "💡 The app will:"
echo "   - Start Vite dev server on http://localhost:3000"
echo "   - Launch Electron desktop app"
echo "   - Open DevTools for debugging"