"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Generic IPC interface (cleaner API)
electron_1.contextBridge.exposeInMainWorld('ipc', {
    invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
    send: (channel, ...args) => electron_1.ipcRenderer.send(channel, ...args),
    on: (channel, callback) => electron_1.ipcRenderer.on(channel, callback),
});
// Legacy electronAPI (kept for backwards compatibility)
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Gateway control
    gatewayStatus: () => electron_1.ipcRenderer.invoke('gateway:status'),
    gatewayStart: () => electron_1.ipcRenderer.invoke('gateway:start'),
    gatewayStop: () => electron_1.ipcRenderer.invoke('gateway:stop'),
    gatewayRestart: () => electron_1.ipcRenderer.invoke('gateway:restart'),
    gatewayLogs: (lines) => electron_1.ipcRenderer.invoke('gateway:logs', lines),
    // Agent management (CLI-backed)
    agentsList: () => electron_1.ipcRenderer.invoke('agents:list'),
    agentAdd: (args) => electron_1.ipcRenderer.invoke('agents:add', args),
    sessionsList: (args) => electron_1.ipcRenderer.invoke('sessions:list', args),
    agentRun: (args) => electron_1.ipcRenderer.invoke('agent:run', args),
    agentSpawn: (args) => electron_1.ipcRenderer.invoke('agent:spawn', args),
    sessionPause: (args) => electron_1.ipcRenderer.invoke('session:pause', args),
    // Window control
    minimizeWindow: () => electron_1.ipcRenderer.send('window:minimize'),
    maximizeWindow: () => electron_1.ipcRenderer.send('window:maximize'),
    closeWindow: () => electron_1.ipcRenderer.send('window:close'),
    // Platform info
    platform: process.platform,
    // Events
    onGatewayUpdate: (callback) => electron_1.ipcRenderer.on('gateway:update', callback),
    // Notification
    showNotification: (title, body) => electron_1.ipcRenderer.send('notification:show', { title, body })
});
