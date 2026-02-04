#!/bin/bash


APP_NAME="Claw Dashboard"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$HOME/Desktop"
APPS_DIR="$HOME/.local/share/applications"
ICON_PATH="$SCRIPT_DIR/electron/assets/icon.png"

echo "📦 Setting up $APP_NAME..."

# 1. Make launcher executable
chmod +x "$SCRIPT_DIR/launch.sh"
echo "✅ Made launcher executable"

# 2. Generate a dynamic .desktop file with correct paths
echo "📝 Generating application shortcut..."
cat > "$SCRIPT_DIR/claw-dashboard.desktop" << EOL
[Desktop Entry]
Version=1.0
Type=Application
Name=Claw Dashboard
Comment=OpenClaw Gateway Management Dashboard
Exec=$SCRIPT_DIR/launch.sh
Icon=$ICON_PATH
Terminal=false
Categories=Development;Utility;
StartupNotify=true
Keywords=openclaw;gateway;ai;assistant;dashboard
EOL

# 3. Create desktop shortcut
echo "📋 Creating desktop shortcut..."
cp "$SCRIPT_DIR/claw-dashboard.desktop" "$DESKTOP_DIR/claw-dashboard.desktop"
chmod +x "$DESKTOP_DIR/claw-dashboard.desktop"
echo "✅ Created desktop shortcut"

# 4. Add to applications menu
echo "📂 Adding to applications menu..."
mkdir -p "$APPS_DIR"
cp "$SCRIPT_DIR/claw-dashboard.desktop" "$APPS_DIR/claw-dashboard.desktop"
chmod +x "$APPS_DIR/claw-dashboard.desktop"
echo "✅ Added to applications menu"

# 5. Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPS_DIR"
    echo "✅ Updated desktop database"
fi

echo ""
echo "🎉 Setup complete!"
echo "🚀 You can now launch $APP_NAME via the Desktop shortcut or App Menu."