import { useEffect, useState } from 'react';
import gatewayClient from '../services/GatewayClient';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export default function ConnectionDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(gatewayClient.diagnostics);
  
  useEffect(() => {
    const updateDiagnostics = () => {
      setDiagnostics(gatewayClient.diagnostics);
    };
    
    gatewayClient.on('connected', updateDiagnostics);
    gatewayClient.on('disconnected', updateDiagnostics);
    gatewayClient.on('reconnecting', updateDiagnostics);
    gatewayClient.on('error', updateDiagnostics);
    
    // Poll every 1s to update display
    const interval = setInterval(updateDiagnostics, 1000);
    
    return () => {
      gatewayClient.off('connected', updateDiagnostics);
      gatewayClient.off('disconnected', updateDiagnostics);
      gatewayClient.off('reconnecting', updateDiagnostics);
      gatewayClient.off('error', updateDiagnostics);
      clearInterval(interval);
    };
  }, []);
  
  const getStateInfo = () => {
    switch (diagnostics.state) {
      case 'connected':
        return { icon: CheckCircleIcon, color: 'green', text: 'Connected' };
      case 'connecting':
        return { icon: ArrowPathIcon, color: 'yellow', text: 'Connecting...' };
      case 'reconnecting':
        return { icon: ArrowPathIcon, color: 'yellow', text: 'Reconnecting...' };
      case 'disconnected':
        return { icon: XCircleIcon, color: 'red', text: 'Disconnected' };
      case 'error':
        return { icon: ExclamationTriangleIcon, color: 'red', text: 'Error' };
      default:
        return { icon: XCircleIcon, color: 'gray', text: 'Unknown' };
    }
  };
  
  const stateInfo = getStateInfo();
  const StateIcon = stateInfo.icon;
  
  return (
    <div className={clsx(
      'flex items-center space-x-3 px-4 py-2 rounded-lg border',
      stateInfo.color === 'green' && 'bg-green-50 border-green-200',
      stateInfo.color === 'yellow' && 'bg-yellow-50 border-yellow-200',
      stateInfo.color === 'red' && 'bg-red-50 border-red-200',
      stateInfo.color === 'gray' && 'bg-gray-50 border-gray-200'
    )}>
      <StateIcon className={clsx(
        'w-5 h-5',
        stateInfo.color === 'green' && 'text-green-600',
        stateInfo.color === 'yellow' && 'text-yellow-600 animate-spin',
        stateInfo.color === 'red' && 'text-red-600',
        stateInfo.color === 'gray' && 'text-gray-600'
      )} />
      
      <div className="flex-1">
        <div className={clsx(
          'text-sm font-medium',
          stateInfo.color === 'green' && 'text-green-800',
          stateInfo.color === 'yellow' && 'text-yellow-800',
          stateInfo.color === 'red' && 'text-red-800',
          stateInfo.color === 'gray' && 'text-gray-800'
        )}>
          {stateInfo.text}
        </div>
        
        {diagnostics.lastError && (
          <div className="text-xs text-red-600 mt-1">
            {diagnostics.lastError}
          </div>
        )}
        
        {diagnostics.state === 'reconnecting' && (
          <div className="text-xs text-yellow-600 mt-1">
            Attempt {diagnostics.reconnectAttempts}/{diagnostics.maxReconnectAttempts}
          </div>
        )}
      </div>
      
      {(diagnostics.state === 'disconnected' || diagnostics.state === 'error') && (
        <button
          onClick={() => gatewayClient.reconnect()}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
