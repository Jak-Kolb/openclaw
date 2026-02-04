import React, { createContext, useContext, ReactNode } from 'react';
import { useOpenClawWebSocket } from '../hooks/useOpenClawWebSocket';

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  gatewayUrl: string;
  apiKey: string;
  connect: (config?: { gatewayUrl: string; apiKey: string }) => Promise<void>;
  disconnect: () => void;
  configure: (config: { gatewayUrl: string; apiKey: string }) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const {
    isConnected,
    isConnecting,
    error,
    gatewayUrl,
    apiKey,
    connect,
    disconnect,
    configure,
  } = useOpenClawWebSocket();

  // Auto-connect on mount with saved config
  React.useEffect(() => {
    if (!isConnected && !isConnecting) {
      // Try to connect with saved configuration
      const savedConfig = localStorage.getItem('openclaw_config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          if (config.gatewayUrl && config.apiKey) {
            connect(config);
          }
        } catch (error) {
          console.error('Failed to parse saved config:', error);
        }
      }
    }
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    isConnecting,
    error,
    gatewayUrl,
    apiKey,
    connect,
    disconnect,
    configure,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};