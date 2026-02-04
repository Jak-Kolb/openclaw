#!/bin/bash

# Reset and Reinstall Claw Dashboard
# Complete clean reinstall

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Reset & Reinstall Claw Dashboard"
echo "==================================="

# Step 1: Uninstall
echo "1️⃣  Uninstalling current setup..."
"$SCRIPT_DIR/uninstall.sh" --full

echo ""
echo "2️⃣  Installing fresh..."
echo ""

# Step 2: Fresh dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing fresh dependencies..."
    npm install
else
    echo "📦 Using existing dependencies"
fi

# Step 3: Build (optional)
echo "🔨 Building application..."
npm run build:renderer
npm run build:main
echo "✅ Build complete"

# Step 4: Install shortcuts
echo "📋 Installing desktop shortcuts..."
"$SCRIPT_DIR/install.sh"

echo ""
echo "==================================="
echo "✅ Reset complete!"
echo ""
echo "🚀 To launch:"
echo "   ./launch.sh"
echo ""
echo "💻 Or double-click 'Claw Dashboard' on desktop"
echo "🌐 Or access via: http://localhost:3000"
echo ""
echo "🔧 If issues persist:"
echo "   rm -rf node_modules"
echo "   npm install"
echo "   ./reset-setup.sh"