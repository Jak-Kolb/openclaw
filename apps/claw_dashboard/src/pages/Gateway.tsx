import { useState } from 'react';
import { useGateway } from '../hooks/useGateway';
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Gateway = () => {
  const { 
    status, 
    startGateway, 
    stopGateway, 
    restartGateway, 
    checkStatus 
  } = useGateway();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'start':
          await startGateway();
          break;
        case 'stop':
          await stopGateway();
          break;
        case 'restart':
          await restartGateway();
          break;
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatStatusOutput = (output: string) => {
    if (!output) return 'No status information available.';
    return output.trim();
  };

  const gatewayDetails = [
    { label: 'Status', value: status.running ? 'Running' : 'Stopped', type: 'status' },
    { label: 'PID', value: 'N/A', type: 'info' },
    { label: 'Uptime', value: 'N/A', type: 'info' },
    { label: 'Memory', value: 'N/A', type: 'info' },
    { label: 'Port', value: '8080', type: 'info' },
    { label: 'Host', value: 'localhost', type: 'info' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gateway Control</h1>
        <p className="text-gray-600">Manage your OpenClaw gateway service</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Status and controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={clsx(
                  'p-3 rounded-lg',
                  status.running ? 'bg-green-100' : 'bg-red-100'
                )}>
                  <ServerIcon className={clsx(
                    'w-6 h-6',
                    status.running ? 'text-green-600' : 'text-red-600'
                  )} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Gateway Status</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={clsx(
                      'flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      status.running 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    )}>
                      {status.running ? (
                        <>
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Running
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          Stopped
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {status.loading ? 'Checking...' : 'Last checked: Just now'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => checkStatus()}
                disabled={status.loading}
                className="btn-secondary"
              >
                <ArrowPathIcon className={clsx('w-4 h-4 mr-2', status.loading && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {/* Status details grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {gatewayDetails.map((detail) => (
                <div key={detail.label} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600">{detail.label}</div>
                  <div className={clsx(
                    'mt-1 text-lg font-semibold',
                    detail.type === 'status' && (
                      status.running ? 'text-green-700' : 'text-red-700'
                    )
                  )}>
                    {detail.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Status output */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-300">Status Output</div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
                {formatStatusOutput(status.output)}
              </pre>
            </div>

            {/* Error display */}
            {status.error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{status.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Control Panel</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Button */}
              <button
                onClick={() => handleAction('start')}
                disabled={status.running || actionLoading === 'start'}
                className={clsx(
                  'flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all',
                  status.running || actionLoading === 'start'
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300'
                )}
              >
                <div className={clsx(
                  'p-3 rounded-full mb-3',
                  status.running || actionLoading === 'start'
                    ? 'bg-gray-200'
                    : 'bg-green-100'
                )}>
                  <PlayIcon className={clsx(
                    'w-6 h-6',
                    status.running || actionLoading === 'start'
                      ? 'text-gray-400'
                      : 'text-green-600'
                  )} />
                </div>
                <div className="font-medium text-gray-900">Start Gateway</div>
                <div className="text-sm text-gray-600 mt-1 text-center">
                  {actionLoading === 'start' ? 'Starting...' : 'Launch the gateway service'}
                </div>
              </button>

              {/* Stop Button */}
              <button
                onClick={() => handleAction('stop')}
                disabled={!status.running || actionLoading === 'stop'}
                className={clsx(
                  'flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all',
                  !status.running || actionLoading === 'stop'
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300'
                )}
              >
                <div className={clsx(
                  'p-3 rounded-full mb-3',
                  !status.running || actionLoading === 'stop'
                    ? 'bg-gray-200'
                    : 'bg-red-100'
                )}>
                  <StopIcon className={clsx(
                    'w-6 h-6',
                    !status.running || actionLoading === 'stop'
                      ? 'text-gray-400'
                      : 'text-red-600'
                  )} />
                </div>
                <div className="font-medium text-gray-900">Stop Gateway</div>
                <div className="text-sm text-gray-600 mt-1 text-center">
                  {actionLoading === 'stop' ? 'Stopping...' : 'Stop the running gateway'}
                </div>
              </button>

              {/* Restart Button */}
              <button
                onClick={() => handleAction('restart')}
                disabled={!status.running || actionLoading === 'restart'}
                className={clsx(
                  'flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all',
                  !status.running || actionLoading === 'restart'
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300'
                )}
              >
                <div className={clsx(
                  'p-3 rounded-full mb-3',
                  !status.running || actionLoading === 'restart'
                    ? 'bg-gray-200'
                    : 'bg-blue-100'
                )}>
                  <ArrowPathIcon className={clsx(
                    'w-6 h-6',
                    !status.running || actionLoading === 'restart'
                      ? 'text-gray-400'
                      : 'text-blue-600',
                    actionLoading === 'restart' && 'animate-spin'
                  )} />
                </div>
                <div className="font-medium text-gray-900">Restart Gateway</div>
                <div className="text-sm text-gray-600 mt-1 text-center">
                  {actionLoading === 'restart' ? 'Restarting...' : 'Restart the gateway service'}
                </div>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Gateway Tips</h3>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• The gateway must be running to communicate with Jarvis</li>
                    <li>• Restarting the gateway reloads configuration changes</li>
                    <li>• Check logs for debugging if the gateway fails to start</li>
                    <li>• Default port is 8080 - ensure it's not blocked by firewall</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Info and quick stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Current Status</div>
                <div className={clsx(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  status.running ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                )}>
                  {status.running ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Auto Refresh</div>
                <div className="text-sm font-medium text-gray-900">30 seconds</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Last Action</div>
                <div className="text-sm font-medium text-gray-900">-</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Connection Test</div>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Test Now
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {status.running ? (
                <>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-900">Gateway started</div>
                      <div className="text-gray-500">Just now</div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-900">Status checked</div>
                      <div className="text-gray-500">30 seconds ago</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900">Gateway stopped</div>
                    <div className="text-gray-500">-</div>
                  </div>
                </div>
              )}
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-300 mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">Dashboard opened</div>
                  <div className="text-gray-500">Just now</div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
            <div className="space-y-3">
              <a
                href="https://docs.openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Documentation</div>
                <div className="text-sm text-gray-600 mt-1">Read the official docs</div>
              </a>
              <a
                href="https://github.com/openclaw/openclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">GitHub</div>
                <div className="text-sm text-gray-600 mt-1">View source code</div>
              </a>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Command Reference</div>
                <div className="text-sm text-gray-600 mt-1">
                  <code className="bg-gray-200 px-2 py-1 rounded">openclaw gateway status</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gateway;