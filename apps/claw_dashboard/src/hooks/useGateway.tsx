import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface GatewayStatus {
  running: boolean;
  output: string;
  loading?: boolean;
  error?: string;
}

interface GatewayContextType {
  status: GatewayStatus;
  checkStatus: () => Promise<void>;
  startGateway: () => Promise<void>;
  stopGateway: () => Promise<void>;
  restartGateway: () => Promise<void>;
  logs: string;
  fetchLogs: (lines?: number) => Promise<void>;
}

const GatewayContext = createContext<GatewayContextType | undefined>(undefined);

export const useGateway = () => {
  const context = useContext(GatewayContext);
  if (!context) {
    throw new Error('useGateway must be used within a GatewayProvider');
  }
  return context;
};

interface GatewayProviderProps {
  children: ReactNode;
}

export const GatewayProvider = ({ children }: GatewayProviderProps) => {
  const [status, setStatus] = useState<GatewayStatus>({ 
    running: false, 
    output: '',
    loading: false 
  });
  const [logs, setLogs] = useState<string>('');

  const checkStatus = async () => {
    if (!window.electronAPI) return;
    
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const result = await window.electronAPI.gatewayStatus();
      setStatus({ 
        running: result.running, 
        output: result.output,
        loading: false 
      });
    } catch (error) {
      setStatus({
        running: false,
        output: 'Failed to check gateway status',
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const startGateway = async () => {
    if (!window.electronAPI) return;
    
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const result = await window.electronAPI.gatewayStart();
      if (result.success) {
        // Wait a moment then check status
        setTimeout(checkStatus, 1000);
      } else {
        setStatus(prev => ({ 
          ...prev, 
          loading: false,
          error: result.error 
        }));
      }
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const stopGateway = async () => {
    if (!window.electronAPI) return;
    
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const result = await window.electronAPI.gatewayStop();
      if (result.success) {
        // Wait a moment then check status
        setTimeout(checkStatus, 1000);
      } else {
        setStatus(prev => ({ 
          ...prev, 
          loading: false,
          error: result.error 
        }));
      }
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const restartGateway = async () => {
    if (!window.electronAPI) return;
    
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const result = await window.electronAPI.gatewayRestart();
      if (result.success) {
        // Wait a moment then check status
        setTimeout(checkStatus, 1000);
      } else {
        setStatus(prev => ({ 
          ...prev, 
          loading: false,
          error: result.error 
        }));
      }
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const fetchLogs = async (lines: number = 50) => {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.gatewayLogs(lines);
      if (result.logs) {
        setLogs(result.logs);
      } else if (result.error) {
        setLogs(`Error fetching logs: ${result.error}`);
      }
    } catch (error) {
      setLogs(`Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Check status on mount
  useEffect(() => {
    checkStatus();
    fetchLogs();
    
    // Set up periodic status checks
    const interval = setInterval(checkStatus, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const value: GatewayContextType = {
    status,
    checkStatus,
    startGateway,
    stopGateway,
    restartGateway,
    logs,
    fetchLogs,
  };

  return (
    <GatewayContext.Provider value={value}>
      {children}
    </GatewayContext.Provider>
  );
};