/**
 * OpenClaw WebSocket Service
 * 
 * Handles WebSocket communication with the OpenClaw gateway.
 * This service provides real-time communication for:
 * - Chat sessions
 * - Agent spawning and monitoring
 * - Gateway status updates
 */

import { io, Socket } from 'socket.io-client';

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
  private socket: Socket | null = null;
  private eventListeners: Map<keyof WebSocketEventMap, Function[]> = new Map();
  private isConnected: boolean = false;
  private gatewayUrl: string = 'http://localhost:18789';
  private apiKey: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  constructor() {
    // Try to load config from localStorage
    this.loadConfig();
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const config = localStorage.getItem('openclaw_config');
      if (config) {
        const parsed = JSON.parse(config);
        if (parsed.gatewayUrl) {
          this.gatewayUrl = parsed.gatewayUrl;
        }
        if (parsed.apiKey) {
          this.apiKey = parsed.apiKey;
        }
      }
    } catch (error) {
      console.error('Failed to load OpenClaw config:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      const config = {
        gatewayUrl: this.gatewayUrl,
        apiKey: this.apiKey,
        lastConnected: new Date().toISOString(),
      };
      localStorage.setItem('openclaw_config', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save OpenClaw config:', error);
    }
  }

  /**
   * Configure the WebSocket connection
   */
  configure(config: { gatewayUrl: string; apiKey: string }): void {
    this.gatewayUrl = config.gatewayUrl;
    this.apiKey = config.apiKey;
    this.saveConfig();
    
    // If already connected, reconnect with new config
    if (this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Connect to the OpenClaw gateway WebSocket
   */
  connect(): void {
    if (this.socket) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    try {
      // Clean up any existing socket
      this.disconnect();

      // Create new socket connection
      this.socket = io(this.gatewayUrl, {
        transports: ['websocket', 'polling'],
        reconnection: false, // We'll handle reconnection manually
        autoConnect: true,
        auth: {
          token: this.apiKey,
        },
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.emit('error', error as Error);
    }
  }

  /**
   * Set up socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to OpenClaw gateway WebSocket');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Subscribe to initial data
      this.subscribeToGatewayStatus();
      this.subscribeToAgentUpdates();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from OpenClaw gateway:', reason);
      this.isConnected = false;
      this.emit('disconnected');
      
      // Attempt reconnection if not intentionally disconnected
      if (reason !== 'io client disconnect') {
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
      
      // Attempt reconnection
      this.attemptReconnection();
    });

    this.socket.on('message', (data: any) => {
      console.log('Received message:', data);
      this.handleIncomingMessage(data);
    });

    this.socket.on('agent:update', (data: any) => {
      console.log('Agent update:', data);
      this.handleAgentUpdate(data);
    });

    this.socket.on('gateway:status', (data: any) => {
      console.log('Gateway status update:', data);
      this.handleGatewayStatus(data);
    });
  }

  /**
   * Handle incoming messages
   */
  private handleIncomingMessage(data: any): void {
    try {
      const message: Message = {
        id: data.id || Date.now().toString(),
        text: data.text || data.content || '',
        sender: data.sender === 'user' ? 'user' : 'assistant',
        timestamp: new Date(data.timestamp || Date.now()),
        sessionId: data.sessionId,
      };
      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse incoming message:', error, data);
    }
  }

  /**
   * Handle agent updates
   */
  private handleAgentUpdate(data: any): void {
    try {
      const agent: AgentSession = {
        id: data.id || '',
        name: data.name || `Agent ${data.id?.slice(0, 8)}`,
        status: data.status || 'stopped',
        task: data.task,
        createdAt: new Date(data.createdAt || Date.now()),
        updatedAt: new Date(data.updatedAt || Date.now()),
      };
      this.emit('agentUpdate', agent);
    } catch (error) {
      console.error('Failed to parse agent update:', error, data);
    }
  }

  /**
   * Handle gateway status updates
   */
  private handleGatewayStatus(data: any): void {
    try {
      const status: GatewayStatus = {
        running: data.running || false,
        version: data.version,
        port: data.port,
        uptime: data.uptime,
        connectedClients: data.connectedClients,
      };
      this.emit('gatewayStatus', status);
    } catch (error) {
      console.error('Failed to parse gateway status:', error, data);
    }
  }

  /**
   * Attempt to reconnect to the WebSocket
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Subscribe to gateway status updates
   */
  private subscribeToGatewayStatus(): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('subscribe', { channel: 'gateway:status' });
  }

  /**
   * Subscribe to agent updates
   */
  private subscribeToAgentUpdates(): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('subscribe', { channel: 'agent:updates' });
  }

  /**
   * Send a message to the OpenClaw gateway
   */
  sendMessage(message: string, sessionId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageData = {
        text: message,
        sessionId: sessionId || 'default',
        timestamp: new Date().toISOString(),
      };

      this.socket.emit('message:send', messageData, (response: any) => {
        if (response && response.success) {
          resolve(response.messageId || Date.now().toString());
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });

      // Set timeout for no response
      setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);
    });
  }

  /**
   * Spawn a new agent
   */
  spawnAgent(task: string, name?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const agentData = {
        task,
        name: name || `Agent ${Date.now().toString(36)}`,
      };

      this.socket.emit('agent:spawn', agentData, (response: any) => {
        if (response && response.success) {
          resolve(response.agentId);
        } else {
          reject(new Error(response?.error || 'Failed to spawn agent'));
        }
      });

      // Set timeout for no response
      setTimeout(() => {
        reject(new Error('Agent spawn timeout'));
      }, 15000);
    });
  }

  /**
   * Get list of running agents
   */
  getAgents(): Promise<AgentSession[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('agent:list', {}, (response: any) => {
        if (response && response.success) {
          const agents: AgentSession[] = response.agents.map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            status: agent.status,
            task: agent.task,
            createdAt: new Date(agent.createdAt),
            updatedAt: new Date(agent.updatedAt),
          }));
          resolve(agents);
        } else {
          reject(new Error(response?.error || 'Failed to get agents'));
        }
      });

      // Set timeout for no response
      setTimeout(() => {
        reject(new Error('Get agents timeout'));
      }, 5000);
    });
  }

  /**
   * Stop an agent
   */
  stopAgent(agentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('agent:stop', { agentId }, (response: any) => {
        if (response && response.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to stop agent'));
        }
      });

      // Set timeout for no response
      setTimeout(() => {
        reject(new Error('Stop agent timeout'));
      }, 5000);
    });
  }

  /**
   * Get agent logs
   */
  getAgentLogs(agentId: string, lines: number = 50): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('agent:logs', { agentId, lines }, (response: any) => {
        if (response && response.success) {
          resolve(response.logs);
        } else {
          reject(new Error(response?.error || 'Failed to get agent logs'));
        }
      });

      // Set timeout for no response
      setTimeout(() => {
        reject(new Error('Get agent logs timeout'));
      }, 5000);
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current configuration
   */
  get config(): { gatewayUrl: string; apiKey: string } {
    return {
      gatewayUrl: this.gatewayUrl,
      apiKey: this.apiKey,
    };
  }

  /**
   * Event emitter/listener methods
   */
  on<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof WebSocketEventMap>(event: K, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }
}

// Create a singleton instance
const openClawWebSocket = new OpenClawWebSocket();
export default openClawWebSocket;