// Global TypeScript declarations for Electron

interface Window {
  // Generic IPC interface
  ipc: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, callback: (...args: any[]) => void) => void;
  };

  // Legacy electronAPI (kept for backwards compatibility)
  electronAPI: {
    // Gateway control
    gatewayStatus: () => Promise<any>;
    gatewayStart: () => Promise<any>;
    gatewayStop: () => Promise<any>;
    gatewayRestart: () => Promise<any>;
    gatewayLogs: (lines: number) => Promise<any>;
    
    // Agent management (CLI-backed)
    agentsList: () => Promise<any>;
    agentAdd: (args: { name: string; workspace: string; model?: string }) => Promise<any>;
    sessionsList: (args?: { activeMinutes?: number }) => Promise<any>;
    agentRun: (args: { agentId?: string; message: string; thinking?: string; sessionId?: string }) => Promise<any>;
    agentSpawn: (args: { agentId?: string; message: string; thinking?: string }) => Promise<any>;
    sessionPause: (args: { sessionId: string; message?: string }) => Promise<any>;
    
    // Window control
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    
    // Platform info
    platform: string;
    
    // Events
    onGatewayUpdate: (callback: (event: any, data: any) => void) => void;
    
    // Notification
    showNotification: (title: string, body: string) => void;
  };
}