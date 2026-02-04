import { useState, useEffect, useCallback } from 'react';
import openClawWebSocket, { Message, AgentSession, GatewayStatus } from '../services/OpenClawWebSocket';

interface UseOpenClawWebSocketReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Configuration
  gatewayUrl: string;
  apiKey: string;
  
  // Data
  messages: Message[];
  agents: AgentSession[];
  gatewayStatus: GatewayStatus | null;
  
  // Methods
  connect: (config?: { gatewayUrl: string; apiKey: string }) => Promise<void>;
  disconnect: () => void;
  configure: (config: { gatewayUrl: string; apiKey: string }) => void;
  sendMessage: (text: string, sessionId?: string) => Promise<string>;
  spawnAgent: (task: string, name?: string) => Promise<string>;
  getAgents: () => Promise<AgentSession[]>;
  stopAgent: (agentId: string) => Promise<void>;
  getAgentLogs: (agentId: string, lines?: number) => Promise<string>;
  clearMessages: () => void;
}

export const useOpenClawWebSocket = (): UseOpenClawWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(openClawWebSocket.connected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  
  const { gatewayUrl, apiKey } = openClawWebSocket.config;

  // Handle connection events
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      console.log('WebSocket connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setIsConnecting(false);
      console.log('WebSocket disconnected');
    };

    const handleError = (error: Error) => {
      setError(error.message);
      setIsConnecting(false);
      console.error('WebSocket error:', error);
    };

    const handleMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleAgentUpdate = (agent: AgentSession) => {
      setAgents(prev => {
        const index = prev.findIndex(a => a.id === agent.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = agent;
          return updated;
        } else {
          return [...prev, agent];
        }
      });
    };

    const handleGatewayStatus = (status: GatewayStatus) => {
      setGatewayStatus(status);
    };

    // Subscribe to events
    openClawWebSocket.on('connected', handleConnected);
    openClawWebSocket.on('disconnected', handleDisconnected);
    openClawWebSocket.on('error', handleError);
    openClawWebSocket.on('message', handleMessage);
    openClawWebSocket.on('agentUpdate', handleAgentUpdate);
    openClawWebSocket.on('gatewayStatus', handleGatewayStatus);

    // Initial connection attempt
    if (!isConnected && !isConnecting) {
      connect();
    }

    // Cleanup
    return () => {
      openClawWebSocket.off('connected', handleConnected);
      openClawWebSocket.off('disconnected', handleDisconnected);
      openClawWebSocket.off('error', handleError);
      openClawWebSocket.off('message', handleMessage);
      openClawWebSocket.off('agentUpdate', handleAgentUpdate);
      openClawWebSocket.off('gatewayStatus', handleGatewayStatus);
    };
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async (config?: { gatewayUrl: string; apiKey: string }) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      if (config) {
        openClawWebSocket.configure(config);
      }
      
      openClawWebSocket.connect();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect');
      setIsConnecting(false);
      throw error;
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    openClawWebSocket.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Configure WebSocket
  const configure = useCallback((config: { gatewayUrl: string; apiKey: string }) => {
    openClawWebSocket.configure(config);
  }, []);

  // Send a message
  const sendMessage = useCallback(async (text: string, sessionId?: string) => {
    if (!isConnected) {
      throw new Error('Not connected to WebSocket');
    }
    
    try {
      const messageId = await openClawWebSocket.sendMessage(text, sessionId);
      return messageId;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    }
  }, [isConnected]);

  // Spawn a new agent
  const spawnAgent = useCallback(async (task: string, name?: string) => {
    if (!isConnected) {
      throw new Error('Not connected to WebSocket');
    }
    
    try {
      const agentId = await openClawWebSocket.spawnAgent(task, name);
      return agentId;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to spawn agent');
      throw error;
    }
  }, [isConnected]);

  // Get list of agents
  const getAgents = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Not connected to WebSocket');
    }
    
    try {
      const agentList = await openClawWebSocket.getAgents();
      setAgents(agentList);
      return agentList;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get agents');
      throw error;
    }
  }, [isConnected]);

  // Stop an agent
  const stopAgent = useCallback(async (agentId: string) => {
    if (!isConnected) {
      throw new Error('Not connected to WebSocket');
    }
    
    try {
      await openClawWebSocket.stopAgent(agentId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to stop agent');
      throw error;
    }
  }, [isConnected]);

  // Get agent logs
  const getAgentLogs = useCallback(async (agentId: string, lines: number = 50) => {
    if (!isConnected) {
      throw new Error('Not connected to WebSocket');
    }
    
    try {
      const logs = await openClawWebSocket.getAgentLogs(agentId, lines);
      return logs;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get agent logs');
      throw error;
    }
  }, [isConnected]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // Configuration
    gatewayUrl,
    apiKey,
    
    // Data
    messages,
    agents,
    gatewayStatus,
    
    // Methods
    connect,
    disconnect,
    configure,
    sendMessage,
    spawnAgent,
    getAgents,
    stopAgent,
    getAgentLogs,
    clearMessages,
  };
};