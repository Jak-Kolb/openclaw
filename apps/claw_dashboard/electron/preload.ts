import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Gateway control
  gatewayStatus: () => ipcRenderer.invoke('gateway:status'),
  gatewayStart: () => ipcRenderer.invoke('gateway:start'),
  gatewayStop: () => ipcRenderer.invoke('gateway:stop'),
  gatewayRestart: () => ipcRenderer.invoke('gateway:restart'),
  gatewayLogs: (lines: number) => ipcRenderer.invoke('gateway:logs', lines),

  // Agent management (CLI-backed)
  agentsList: () => ipcRenderer.invoke('agents:list'),
  agentAdd: (args: { name: string; workspace: string; model?: string }) =>
    ipcRenderer.invoke('agents:add', args),
  sessionsList: (args?: { activeMinutes?: number }) => ipcRenderer.invoke('sessions:list', args),
  agentRun: (args: { agentId?: string; message: string; thinking?: string; sessionId?: string }) =>
    ipcRenderer.invoke('agent:run', args),
  agentSpawn: (args: { agentId?: string; message: string; thinking?: string }) =>
    ipcRenderer.invoke('agent:spawn', args),
  sessionPause: (args: { sessionId: string; message?: string }) =>
    ipcRenderer.invoke('session:pause', args),
  
  // Window control
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // Platform info
  platform: process.platform,
  
  // Events
  onGatewayUpdate: (callback: (event: any, data: any) => void) => 
    ipcRenderer.on('gateway:update', callback),
  
  // Notification
  showNotification: (title: string, body: string) => 
    ipcRenderer.send('notification:show', { title, body })
});

// Declare types for TypeScript
declare global {
  interface Window {
    electronAPI: {
      gatewayStatus: () => Promise<any>;
      gatewayStart: () => Promise<any>;
      gatewayStop: () => Promise<any>;
      gatewayRestart: () => Promise<any>;
      gatewayLogs: (lines: number) => Promise<any>;
      agentsList: () => Promise<any>;
      agentAdd: (args: { name: string; workspace: string; model?: string }) => Promise<any>;
      sessionsList: (args?: { activeMinutes?: number }) => Promise<any>;
      agentRun: (args: { agentId?: string; message: string; thinking?: string; sessionId?: string }) => Promise<any>;
      agentSpawn: (args: { agentId?: string; message: string; thinking?: string }) => Promise<any>;
      sessionPause: (args: { sessionId: string; message?: string }) => Promise<any>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      platform: string;
      onGatewayUpdate: (callback: (event: any, data: any) => void) => void;
      showNotification: (title: string, body: string) => void;
    };
  }
}