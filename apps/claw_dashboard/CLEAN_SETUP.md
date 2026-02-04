# Clean Setup - Claw Dashboard

## Files Kept (Essential)
```
claw-dashboard/
├── src/                    # React application source
├── electron/              # Electron main process
├── dist/                  # Built files
├── node_modules/          # Dependencies
├── package.json           # Project config
├── launch.sh             # Main launcher script
├── install.sh            # Desktop shortcut setup
├── claw-dashboard.desktop # Desktop entry
└── README.md             # Documentation
```

## Files Removed (Redundant)
- `build.sh` - Use `npm run build` instead
- `build-simple.sh` - Redundant
- `Claw Dashboard.command` - macOS only, not needed on Linux
- `create-desktop-shortcut.sh` - Functionality merged into install.sh
- `launch-app.sh` - Superseded by launch.sh
- `test-electron.sh` - Testing script
- `monitor-agent.sh` - Moved to workspace root (not needed in app)

## How to Use

### First Time Setup:
```bash
cd /home/jakjak04/Desktop/claw_workspace/claw-dashboard
npm install
./install.sh
```

### Run the App:
```bash
./launch.sh
```
OR
Double-click "Claw Dashboard" on your desktop
OR
Search for "Claw Dashboard" in applications menu

### Development:
```bash
npm run dev:renderer      # Start Vite dev server
npm run dev:main          # Start TypeScript compiler (watch)
npm run electron          # Start Electron app
# OR
npm run dev:all           # Start everything together
```

## Troubleshooting

### White Screen in Electron:
1. Press `Ctrl+Shift+I` to open DevTools
2. Check Console tab for errors
3. Access web version: http://localhost:3000

### Server Not Starting:
```bash
# Check if Vite is running:
curl http://localhost:3000

# Kill and restart:
pkill -f "vite" && pkill -f "electron"
./launch.sh
```

### Desktop Shortcut Not Working:
```bash
# Re-run installer:
./install.sh

# Or run manually:
./launch.sh
```