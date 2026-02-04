#!/bin/bash

# Claw Dashboard Launcher
# Simple one-command launcher

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "🚀 Launching Claw Dashboard..."

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing instances
pkill -f "electron.*claw-dashboard" 2>/dev/null || true
# pkill -f "vite" 2>/dev/null || true

# Start everything with dev:all
echo "⚡ Starting application..."
echo "🌐 Dev server: http://localhost:3000"
echo "💻 Desktop app: Starting..."
echo ""
echo "🔧 If you see issues:"
echo "   - Press Ctrl+Shift+I in app for DevTools"
echo "   - Check console for errors"
echo "   - Or access web version: http://localhost:3000"

# Run the combined dev command
export PATH="$PATH:/home/jakjak04/.local/share/pnpm"
export OPENCLAW_BIN="/home/jakjak04/.local/share/pnpm/openclaw"
NODE_ENV=development npm run dev:all