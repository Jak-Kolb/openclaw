"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
let mainWindow = null;
let tray = null;
let isDev = process.env.NODE_ENV === 'development';
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        // Cross-platform window styling
        frame: true,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 15, y: 10 } } : {}),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
            // Temporary: disable webSecurity in dev for debugging
            webSecurity: false,
            allowRunningInsecureContent: isDev,
        },
        icon: path_1.default.join(__dirname, 'assets/icon.png'),
        show: false, // Don't show until ready
    });
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path_1.default.join(__dirname, './renderer/index.html')}`;
    console.log(`Loading URL: ${startUrl}`);
    // Load the URL with error handling
    mainWindow.loadURL(startUrl).catch((err) => {
        console.error('Failed to load URL:', err);
        // Show error page if window still exists
        if (mainWindow) {
            mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>Failed to load Claw Dashboard</h1>
            <p>Error: ${err.message}</p>
            <p>URL: ${startUrl}</p>
            <p>Make sure the development server is running:</p>
            <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">
              cd ${__dirname}/../
              npm run dev:renderer
            </pre>
            <p>Then reload this window (Ctrl+R)</p>
          </body>
        </html>
      `);
        }
    });
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // Open dev tools in development
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'right' });
        // Log all console messages
        mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
            console.log(`[Renderer ${level}] ${message}`);
        });
    }
    // Handle failed page loads
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Create application menu
    const menu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Claw Dashboard',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ]
        }
    ]);
    electron_1.Menu.setApplicationMenu(menu);
};
const createTray = () => {
    const iconPath = path_1.default.join(__dirname, 'assets/tray-icon.png');
    const trayIcon = electron_1.nativeImage.createFromPath(iconPath);
    tray = new electron_1.Tray(trayIcon.resize({ width: 16, height: 16 }));
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Open Claw Dashboard',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
                else {
                    createWindow();
                }
            }
        },
        {
            label: 'Gateway Status',
            click: () => {
                // Check gateway status
                (0, child_process_1.exec)('openclaw gateway status', (error, stdout) => {
                    if (error) {
                        console.log('Gateway not running');
                    }
                    else {
                        console.log('Gateway running:', stdout);
                    }
                });
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('Claw Dashboard');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
};
// Helper to run openclaw with a safe PATH
const runOpenClaw = (command, args = []) => {
    const bin = process.env.OPENCLAW_BIN || 'openclaw';
    const full = [bin, ...args].join(' ');
    return full;
};
const execOpenClaw = (args) => {
    const bin = process.env.OPENCLAW_BIN || 'openclaw';
    return new Promise((resolve) => {
        (0, child_process_1.execFile)(bin, args, { env: process.env }, (error, stdout) => {
            if (error)
                resolve({ error: error.message });
            else
                resolve({ stdout: stdout?.toString() || '' });
        });
    });
};
// IPC Handlers for gateway control
electron_1.ipcMain.handle('gateway:status', async () => {
    const res = await execOpenClaw(['gateway', 'status']);
    if (res.error)
        return { running: false, output: res.error };
    return { running: true, output: res.stdout };
});
electron_1.ipcMain.handle('gateway:start', async () => {
    const res = await execOpenClaw(['gateway', 'start']);
    if (res.error)
        return { success: false, error: res.error };
    return { success: true, output: res.stdout };
});
electron_1.ipcMain.handle('gateway:stop', async () => {
    const res = await execOpenClaw(['gateway', 'stop']);
    if (res.error)
        return { success: false, error: res.error };
    return { success: true, output: res.stdout };
});
electron_1.ipcMain.handle('gateway:restart', async () => {
    const res = await execOpenClaw(['gateway', 'restart']);
    if (res.error)
        return { success: false, error: res.error };
    return { success: true, output: res.stdout };
});
electron_1.ipcMain.handle('gateway:logs', async (event, lines = 50) => {
    return new Promise((resolve) => {
        const logPath = path_1.default.join(electron_1.app.getPath('home'), '.openclaw', 'logs', 'gateway.log');
        fs_1.default.readFile(logPath, 'utf8', (error, data) => {
            if (error) {
                resolve({ error: error.message });
            }
            else {
                const linesArray = data.split('\n');
                const lastLines = linesArray.slice(-lines).join('\n');
                resolve({ logs: lastLines });
            }
        });
    });
});
// IPC Handlers for agent management (CLI-backed)
electron_1.ipcMain.handle('agents:list', async () => {
    const res = await execOpenClaw(['agents', 'list']);
    if (res.error)
        return { success: false, error: res.error };
    try {
        // Parse plain text output from `openclaw agents list`
        const lines = (res.stdout || '').split('\n');
        const agents = [];
        let currentAgent = null;
        for (const line of lines) {
            const trimmed = line.trim();
            // Agent name line (e.g., "- main" or "- head (default)")
            if (trimmed.startsWith('- ')) {
                if (currentAgent) {
                    agents.push(currentAgent);
                }
                const nameWithDefault = trimmed.substring(2).trim();
                const isDefault = nameWithDefault.includes('(default)');
                const name = nameWithDefault.replace(/\s*\(default\).*$/, '').trim();
                currentAgent = {
                    id: name,
                    name: name,
                    isDefault: isDefault,
                    workspace: '',
                    model: ''
                };
            }
            // Workspace line
            else if (trimmed.startsWith('Workspace:') && currentAgent) {
                currentAgent.workspace = trimmed.substring('Workspace:'.length).trim();
            }
            // Model line
            else if (trimmed.startsWith('Model:') && currentAgent) {
                currentAgent.model = trimmed.substring('Model:'.length).trim();
            }
        }
        // Push last agent
        if (currentAgent) {
            agents.push(currentAgent);
        }
        return { success: true, agents };
    }
    catch (parseError) {
        return { success: false, error: parseError.message, raw: res.stdout };
    }
});
electron_1.ipcMain.handle('sessions:list', async (event, args) => {
    const active = args?.activeMinutes;
    const cmd = ['sessions', '--json'];
    if (active)
        cmd.push('--active', String(active));
    const res = await execOpenClaw(cmd);
    if (res.error)
        return { success: false, error: res.error };
    try {
        const sessions = JSON.parse(res.stdout || '{}');
        return { success: true, sessions };
    }
    catch (parseError) {
        return { success: false, error: parseError.message, raw: res.stdout };
    }
});
electron_1.ipcMain.handle('agent:run', async (event, args) => {
    const { agentId, message, thinking, sessionId } = args || {};
    if (!message) {
        return { success: false, error: 'Message is required' };
    }
    const cmd = ['agent', '--message', JSON.stringify(message)];
    if (agentId)
        cmd.push('--agent', agentId);
    if (sessionId)
        cmd.push('--session-id', sessionId);
    if (thinking)
        cmd.push('--thinking', thinking);
    cmd.push('--json');
    const res = await execOpenClaw(cmd);
    if (res.error)
        return { success: false, error: res.error };
    try {
        const result = JSON.parse(res.stdout || '{}');
        return { success: true, result };
    }
    catch (parseError) {
        return { success: true, result: res.stdout };
    }
});
electron_1.ipcMain.handle('agent:spawn', async (event, args) => {
    const { agentId, message, thinking } = args || {};
    if (!message) {
        return { success: false, error: 'Message is required' };
    }
    const bin = process.env.OPENCLAW_BIN || 'openclaw';
    const spawnArgs = ['agent', '--message', message];
    if (agentId)
        spawnArgs.push('--agent', agentId);
    if (thinking)
        spawnArgs.push('--thinking', thinking);
    spawnArgs.push('--json');
    try {
        const child = (0, child_process_1.spawn)(bin, spawnArgs, {
            env: process.env,
            detached: true,
            stdio: 'ignore',
        });
        child.unref();
        return { success: true, pid: child.pid };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
electron_1.ipcMain.handle('agents:add', async (event, args) => {
    const { name, workspace, model } = args || {};
    if (!name || !workspace)
        return { success: false, error: 'name and workspace required' };
    const cmd = ['agents', 'add', name, '--non-interactive', '--workspace', JSON.stringify(workspace)];
    if (model)
        cmd.push('--model', model);
    cmd.push('--json');
    const res = await execOpenClaw(cmd);
    if (res.error)
        return { success: false, error: res.error };
    return { success: true, result: res.stdout };
});
electron_1.ipcMain.handle('session:pause', async (event, args) => {
    const { sessionId, message } = args || {};
    if (!sessionId)
        return { success: false, error: 'sessionId required' };
    // Soft pause: send a pause instruction to the session
    const cmd = ['agent', '--session-id', sessionId, '--message', JSON.stringify(message || 'pause'), '--json'];
    const res = await execOpenClaw(cmd);
    if (res.error)
        return { success: false, error: res.error };
    return { success: true, result: res.stdout };
});
// App lifecycle
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Handle external links
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            electron_1.shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
});
