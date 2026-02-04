# Claw Dashboard

A polished desktop application for managing OpenClaw gateway and communicating with your AI assistant, Jarvis.

## Features

- **Gateway Control**: Start, stop, restart, and monitor the OpenClaw gateway
- **Chat Interface**: Communicate directly with Jarvis (AI assistant)
- **Log Viewer**: Real-time monitoring and filtering of gateway logs
- **Dashboard**: Overview of gateway status and quick actions
- **Settings**: Customize appearance, behavior, and gateway configuration
- **System Tray**: Minimize to system tray with quick access

## Screenshots

*(Screenshots will be added after building)*

## 🚀 Quick Start

### **Method 1: One-Click Desktop Launcher**
```bash
# Install desktop shortcut (first time only):
./install.sh

# Then double-click "Claw Dashboard" on your desktop
# OR find it in your applications menu
```

### **Method 2: Terminal Launcher**
```bash
# Run the launcher script:
./launch.sh

# This will:
# 1. Start Vite dev server (http://localhost:3000)
# 2. Launch Electron desktop app
# 3. Open DevTools for debugging
```

### **Method 3: Manual Development**
```bash
# Install dependencies (first time only):
npm install

# Start development servers:
npm run dev

# OR run separately:
npm run dev:renderer  # React dev server
npm run electron-dev  # Electron app (separate terminal)
```

## 🛠️ Troubleshooting

### **If you get dependency warnings:**
```bash
# Install missing dependencies:
npm install react-router-dom
```

### **If the build fails:**
```bash
# Try a clean install:
rm -rf node_modules package-lock.json
npm install
```

### **For immediate testing:**
```bash
# The simplest working method:
cd /home/jakjak04/Desktop/claw_workspace/claw-dashboard
npm install
npm run dev
```

## 🎯 One-Line Setup
```bash
cd /home/jakjak04/Desktop/claw_workspace/claw-dashboard && npm install && npm run dev
```

## Project Structure

```
claw-dashboard/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry point
│   ├── preload.ts     # Preload script for IPC
│   └── assets/        # Icons and assets
├── src/               # React application
│   ├── components/    # Reusable UI components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── types/        # TypeScript type definitions
│   ├── App.tsx       # Main application component
│   └── main.tsx      # React entry point
├── public/            # Static assets
└── dist/              # Build output (generated)
```

## Development

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Tailwind CSS + Headless UI
- **Desktop**: Electron 28
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router

### Key Dependencies

- `@headlessui/react`: Accessible UI components
- `@heroicons/react`: Icon library
- `socket.io-client`: WebSocket communication (future)
- `react-hook-form`: Form handling
- `zod`: Schema validation

## Architecture

### Electron Process Architecture

1. **Main Process** (`electron/main.ts`):
   - Manages application lifecycle
   - Controls system tray
   - Handles IPC for gateway commands
   - Manages windows

2. **Renderer Process** (React App):
   - Provides the user interface
   - Communicates with main process via IPC
   - Manages local state and routing

3. **Preload Script** (`electron/preload.ts`):
   - Securely exposes Electron APIs to renderer
   - Provides type-safe IPC communication

### Gateway Integration

The app communicates with the OpenClaw gateway through:
- IPC calls to the main process
- Main process executes shell commands (`openclaw gateway ...`)
- Real-time status polling and log monitoring

## API Integration (Planned)

Future versions will include:
- Direct REST API communication with gateway
- WebSocket for real-time updates
- Authentication and secure API keys
- Plugin system for extending functionality

## Building and Packaging

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run electron
```

### Package for Distribution
```bash
npm run package
```

Supported platforms:
- **Windows**: NSIS installer
- **macOS**: DMG package
- **Linux**: AppImage

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GATEWAY_HOST=localhost
VITE_GATEWAY_PORT=8080
VITE_API_KEY=your_api_key_here
```

### Settings

The application settings are stored in:
- **Electron**: `app.getPath('userData')/config.json`
- **React**: Local state with persistence to local storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: [docs.openclaw.ai](https://docs.openclaw.ai)
- **GitHub**: [openclaw/openclaw](https://github.com/openclaw/openclaw)
- **Discord**: [Claw Community](https://discord.com/invite/clawd)

## Roadmap

- [ ] Real WebSocket integration with gateway
- [ ] Plugin system for custom integrations
- [ ] Multi-language support
- [ ] Advanced log analytics
- [ ] Mobile companion app
- [ ] Cloud sync for settings
- [ ] Automated updates