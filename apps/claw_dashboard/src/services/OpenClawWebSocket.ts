/**
 * OpenClaw WebSocket Service
 * Handles WebSocket communication with the OpenClaw gateway.
 * REFACTORED: Uses native WebSocket instead of Socket.IO to fix "server error"
 */

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  sessionId?: string;
}

export interface AgentSession {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  task?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GatewayStatus {
  running: boolean;
  version?: string;
  port?: number;
  uptime?: number;
  connectedClients?: number;
}

export interface WebSocketEventMap {
  'connected': () => void;
  'disconnected': () => void;
  'error': (error: Error) => void;
  'message': (message: Message) => void;
  'agentUpdate': (agent: AgentSession) => void;
  'gatewayStatus': (status: GatewayStatus) => void;
}

class OpenClawWebSocket {
  private socket: WebSocket | null = null;
  private eventListeners: Map<keyof WebSocketEventMap, Function[]> = new Map();
  private isConnected: boolean = false;
  // FIXED: Port 18789 (Standard OpenClaw) + ws:// protocol
  private gatewayUrl: string = 'ws://localhost:18789'; 
  private apiKey: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const config = localStorage.getItem('openclaw_config');
      if (config) {
        const parsed = JSON.parse(config);
        if (parsed.gatewayUrl) {
          // Force ws:// protocol for the connection
          this.gatewayUrl = parsed.gatewayUrl.replace('http', 'ws');
        }
        if (parsed.apiKey) {
          this.apiKey = parsed.apiKey;
        }
      }
    } catch (error) {
      console.error('Failed to load OpenClaw config:', error);
    }
  }

  private saveConfig(): void {
    try {
      const config = {
        // Save as http for UI consistency
        gatewayUrl: this.gatewayUrl.replace('ws', 'http'),
        apiKey: this.apiKey,
        lastConnected: new Date().toISOString(),
      };
      localStorage.setItem('openclaw_config', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save OpenClaw config:', error);
    }
  }

  configure(config: { gatewayUrl: string; apiKey: string }): void {
    this.gatewayUrl = config.gatewayUrl.replace('http', 'ws');
    this.apiKey = config.apiKey;
    this.saveConfig();
    
    if (this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }

  connect(): void {
    // Prevent double connections
    if (this.socket) return;

    try {
      this.disconnect();

      // FIXED: Pass token in query string (Standard for OpenClaw)
      const url = new URL(this.gatewayUrl);
      if (this.apiKey) {
        url.searchParams.append('token', this.apiKey);
      }

      console.log(`Connecting to ${url.toString()}...`);
      this.socket = new WebSocket(url.toString());

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.emit('error', error as Error);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('Connected to OpenClaw gateway');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onclose = (event) => {
      console.log('Disconnected:', event.reason);
      this.isConnected = false;
      this.emit('disconnected');
      this.socket = null;
      this.attemptReconnection();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', new Error('Connection error'));
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        
        // Handle standard OpenClaw message types
        if (data.type === 'message' || data.text) {
          this.handleIncomingMessage(data);
        } else if (data.type === 'agent_update' || data.status) {
          this.handleAgentUpdate(data);
        } else if (data.type === 'gateway_status' || data.uptime) {
          this.handleGatewayStatus(data);
        }
      } catch (e) {
        console.warn('Failed to parse message:', event.data);
      }
    };
  }

  private handleIncomingMessage(data: any): void {
    const message: Message = {
      id: data.id || Date.now().toString(),
      text: data.text || data.payload?.text || '',
      sender: data.sender === 'user' ? 'user' : 'assistant',
      timestamp: new Date(),
      sessionId: data.sessionId,
    };
    this.emit('message', message);
  }

  private handleAgentUpdate(data: any): void {
    const agent: AgentSession = {
      id: data.id || '',
      name: data.name || 'Agent',
      status: data.status || 'stopped',
      task: data.task,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.emit('agentUpdate', agent);
  }

  private handleGatewayStatus(data: any): void {
    const status: GatewayStatus = {
      running: true,
      version: data.version,
      port: 18789,
      uptime: data.uptime,
    };
    this.emit('gatewayStatus', status);
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms...`);
    setTimeout(() => {
      if (!this.isConnected) this.connect();
    }, delay);
  }

  sendMessage(message: string, sessionId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected'));
        return;
      }

      // Standard OpenClaw format
      const payload = JSON.stringify({
        type: 'message',
        text: message,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      });

      this.socket.send(payload);
      resolve(Date.now().toString());
    });
  }
  
  spawnAgent(task: string, name?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected'));
        return;
      }
      
      this.socket.send(JSON.stringify({
        type: 'spawn',
        task,
        name
      }));
      resolve('pending-id'); 
    });
  }

  getAgents(): Promise<AgentSession[]> {
     return Promise.resolve([]);
  }

  stopAgent(agentId: string): Promise<void> {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'stop', agentId }));
    }
    return Promise.resolve();
  }

  getAgentLogs(agentId: string): Promise<string> {
    return Promise.resolve('Logs not available via raw WS yet');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  get connected(): boolean { return this.isConnected; }
  get config() { return { gatewayUrl: this.gatewayUrl, apiKey: this.apiKey }; }

  on<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
    this.eventListeners.get(event)!.push(listener);
  }

  off<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit<K extends keyof WebSocketEventMap>(event: K, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try { (listener as Function)(...args); } 
        catch (e) { console.error(e); }
      });
    }
  }
}

const openClawWebSocket = new OpenClawWebSocket();
export default openClawWebSocket;