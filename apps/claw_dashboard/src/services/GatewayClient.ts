/**
 * GatewayClient - OpenClaw Gateway Communication Layer
 * 
 * Provides a clean interface to the OpenClaw gateway via Electron IPC bridge.
 * Replaces direct WebSocket usage with REST-style calls through the main process.
 */

export interface Agent {
  id: string;
  name: string;
  workspace: string;
  model: string;
  isDefault: boolean;
}

export interface Session {
  key: string;
  sessionKey?: string;  // alias for compatibility
  sessionId?: string;
  kind?: string;
  agent?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: number;
  model?: string;
  totalTokens?: number;
  [key: string]: any;  // CLI returns many fields
}

export interface GatewayStatus {
  running: boolean;
  output?: string;
  error?: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnecting' | 'disconnected' | 'error';

type EventHandler = (...args: any[]) => void;

export interface DiagnosticInfo {
  state: ConnectionState;
  lastError: string | null;
  lastDisconnectTime: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  nextRetryIn?: number;
}

/**
 * GatewayClient - Singleton service for gateway communication with auto-reconnect
 */
class GatewayClient {
  private state: ConnectionState = 'disconnected';
  private eventListeners: Map<string, EventHandler[]> = new Map();
  private lastError: string | null = null;
  private lastDisconnectTime: Date | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isManualDisconnect: boolean = false;

  /**
   * Connect to the gateway (verifies IPC and gateway status)
   */
  async connect(): Promise<void> {
    // Clear any existing reconnect timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isManualDisconnect = false;
    this.state = 'connecting';
    this.emit('connecting');

    try {
      // Verify Electron IPC is available
      if (!window.ipc) {
        throw new Error('Electron IPC not available');
      }

      // Test connection by checking gateway status
      const status = await this.gatewayStatus();
      
      if (status.running) {
        this.state = 'connected';
        this.lastError = null;
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.startHeartbeat();
      } else {
        throw new Error('Gateway is not running');
      }
    } catch (error: any) {
      this.state = 'error';
      this.lastError = error.message || 'Connection failed';
      this.lastDisconnectTime = new Date();
      this.emit('error', error);
      
      // Attempt auto-reconnect
      if (!this.isManualDisconnect) {
        this.attemptReconnect();
      }
      
      throw error;
    }
  }

  /**
   * Disconnect (stops heartbeat and reconnect attempts)
   */
  disconnect(): void {
    if (this.state === 'disconnected') return;
    
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.state = 'disconnecting';
    this.emit('disconnecting');
    this.state = 'disconnected';
    this.emit('disconnected');
  }

  /**
   * Manual reconnect (resets retry counter)
   */
  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    this.lastError = null;
    this.isManualDisconnect = false;
    await this.connect();
  }

  /**
   * Get current connection state
   */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /**
   * Get last error message
   */
  get error(): string | null {
    return this.lastError;
  }

  /**
   * Check if currently connected
   */
  get isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Get diagnostic information (for UI)
   */
  get diagnostics(): DiagnosticInfo {
    return {
      state: this.state,
      lastError: this.lastError,
      lastDisconnectTime: this.lastDisconnectTime,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  // ===== Reconnect Logic =====

  /**
   * Calculate exponential backoff delay with jitter
   */
  private getBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1s
    const exponential = baseDelay * Math.pow(2, attempt);
    const maxDelay = 16000; // 16s
    const delay = Math.min(exponential, maxDelay);
    const jitter = delay * 0.25 * (Math.random() * 2 - 1); // ±25%
    return Math.round(delay + jitter);
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async attemptReconnect(): Promise<void> {
    if (this.isManualDisconnect) return;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.state = 'disconnected';
      this.emit('error', new Error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`));
      return;
    }
    
    const delay = this.getBackoffDelay(this.reconnectAttempts);
    this.reconnectAttempts++;
    this.state = 'reconnecting';
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay, maxAttempts: this.maxReconnectAttempts });
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        // Success - reconnectAttempts will be reset in connect()
      } catch (err: any) {
        // connect() already called attemptReconnect() on failure
        // so we don't need to do anything here
      }
    }, delay);
  }

  /**
   * Start heartbeat (pings gateway every 10s)
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(async () => {
      try {
        const status = await this.gatewayStatus();
        if (!status.running) {
          throw new Error('Gateway stopped');
        }
      } catch (err: any) {
        console.warn('[GatewayClient] Heartbeat failed:', err.message);
        this.lastError = err.message;
        this.lastDisconnectTime = new Date();
        this.state = 'disconnected';
        this.stopHeartbeat();
        this.attemptReconnect();
      }
    }, 10000); // 10s
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ===== Gateway Control =====

  async gatewayStatus(): Promise<GatewayStatus> {
    const res = await window.ipc.invoke('gateway:status');
    if (res.error) {
      return { running: false, error: res.error };
    }
    return { running: res.running || false, output: res.output };
  }

  async gatewayStart(): Promise<{ success: boolean; error?: string }> {
    return await window.ipc.invoke('gateway:start');
  }

  async gatewayStop(): Promise<{ success: boolean; error?: string }> {
    return await window.ipc.invoke('gateway:stop');
  }

  async gatewayRestart(): Promise<{ success: boolean; error?: string }> {
    return await window.ipc.invoke('gateway:restart');
  }

  async gatewayLogs(lines = 50): Promise<{ logs?: string; error?: string }> {
    return await window.ipc.invoke('gateway:logs', lines);
  }

  // ===== Agent Management =====

  async listAgents(): Promise<Agent[]> {
    const res = await window.ipc.invoke('agents:list');
    if (!res.success) {
      throw new Error(res.error || 'Failed to list agents');
    }
    return res.agents || [];
  }

  // ===== Session Management =====

  async listSessions(activeMinutes?: number): Promise<Session[]> {
    const res = await window.ipc.invoke('sessions:list', { activeMinutes });
    if (!res.success) {
      throw new Error(res.error || 'Failed to list sessions');
    }
    
    // Normalize session data
    const sessions = (res.sessions?.sessions || res.sessions || []).map((s: any) => ({
      ...s,
      sessionKey: s.key || s.sessionKey,
      key: s.key || s.sessionKey,
    }));
    
    return sessions;
  }

  // ===== Messaging =====

  async sendMessage(sessionId: string, text: string, options?: { thinking?: string }): Promise<{ messageId: string; result?: any }> {
    const res = await window.ipc.invoke('agent:run', {
      sessionId,
      message: text,
      thinking: options?.thinking,
    });
    
    if (!res.success) {
      throw new Error(res.error || 'Failed to send message');
    }
    
    return {
      messageId: res.result?.id || Date.now().toString(),
      result: res.result,
    };
  }

  async spawnSession(args: {
    agentId: string;
    task: string;
    label?: string;
    thinking?: string;
  }): Promise<{ sessionId: string; sessionKey?: string }> {
    const res = await window.ipc.invoke('agent:spawn', {
      agentId: args.agentId,
      message: args.task,
      label: args.label,
      thinking: args.thinking,
    });
    
    if (!res.success) {
      throw new Error(res.error || 'Failed to spawn session');
    }
    
    return {
      sessionId: res.sessionId || res.pid?.toString() || 'unknown',
      sessionKey: res.sessionKey,
    };
  }

  // ===== Event Emitter =====

  on(event: string, handler: EventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  once(event: string, handler: EventHandler): void {
    const wrappedHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(fn => {
      try {
        fn(...args);
      } catch (error) {
        console.error(`[GatewayClient] Event '${event}' handler error:`, error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }
}

// Export singleton instance
const gatewayClient = new GatewayClient();
export default gatewayClient;
