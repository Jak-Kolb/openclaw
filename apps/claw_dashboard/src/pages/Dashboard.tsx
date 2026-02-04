import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGateway } from '../hooks/useGateway';
import {
  ServerIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Dashboard = () => {
  const { status, checkStatus } = useGateway();

  // Format status output for display
  const formatStatusOutput = (output: string) => {
    if (!output) return 'No status available';
    
    // Clean up the output
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 5) // Show first 5 lines
      .join('\n');
  };

  const stats = [
    {
      name: 'Gateway Status',
      value: status.running ? 'Running' : 'Stopped',
      icon: ServerIcon,
      color: status.running ? 'text-green-600' : 'text-red-600',
      bgColor: status.running ? 'bg-green-100' : 'bg-red-100',
      href: '/gateway',
      description: status.running ? 'Gateway is active and accepting connections' : 'Gateway is not running',
    },
    {
      name: 'Last Check',
      value: 'Just now',
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/gateway',
      description: 'Status checked automatically',
    },
    {
      name: 'Chat Sessions',
      value: '1',
      icon: ChatBubbleLeftRightIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/chat',
      description: 'Active chat session with Jarvis',
    },
    {
      name: 'Active Agents',
      value: '1',
      icon: UserGroupIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      href: '/agents',
      description: 'Agent session running in background',
    },
    {
      name: 'Log Lines',
      value: '50',
      icon: DocumentTextIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/logs',
      description: 'Latest logs available',
    },
  ];

  const quickActions = [
    {
      title: 'Start Gateway',
      description: 'Launch the OpenClaw gateway service',
      icon: CheckCircleIcon,
      action: 'start',
      disabled: status.running,
      href: '/gateway',
    },
    {
      title: 'Stop Gateway',
      description: 'Stop the running gateway service',
      icon: XCircleIcon,
      action: 'stop',
      disabled: !status.running,
      href: '/gateway',
    },
    {
      title: 'Restart Gateway',
      description: 'Restart the gateway service',
      icon: ArrowPathIcon,
      action: 'restart',
      disabled: !status.running,
      href: '/gateway',
    },
    {
      title: 'Check Status',
      description: 'Refresh gateway status',
      icon: ServerIcon,
      action: 'check',
      href: '/gateway',
    },
    {
      title: 'Spawn Agent',
      description: 'Launch a new agent session',
      icon: UserGroupIcon,
      action: 'spawn',
      href: '/agents',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your OpenClaw gateway and sessions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card p-5 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
              </div>
              <div className={clsx('p-3 rounded-lg', stat.bgColor)}>
                <stat.icon className={clsx('w-6 h-6', stat.color)} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Gateway Status Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gateway Status</h2>
            <p className="text-sm text-gray-600">Current status of the OpenClaw gateway</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={clsx(
              'flex items-center px-3 py-1 rounded-full text-sm font-medium',
              status.running 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            )}>
              {status.running ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Running
                </>
              ) : (
                <>
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Stopped
                </>
              )}
            </div>
            <button
              onClick={checkStatus}
              disabled={status.loading}
              className="btn-secondary text-sm"
            >
              <ArrowPathIcon className={clsx('w-4 h-4', status.loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {formatStatusOutput(status.output)}
            </pre>
          </div>
          
          {status.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">Error: {status.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={clsx(
                'card p-5 hover:shadow-md transition-all duration-200',
                action.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={(e) => {
                if (action.disabled) {
                  e.preventDefault();
                }
              }}
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <action.icon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium text-gray-900">Start Gateway</h3>
            </div>
            <p className="text-sm text-gray-600">
              Ensure the gateway is running to connect with Jarvis and other services.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h3 className="font-medium text-gray-900">Chat with Jarvis</h3>
            </div>
            <p className="text-sm text-gray-600">
              Use the chat interface to communicate directly with your AI assistant.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h3 className="font-medium text-gray-900">Monitor Logs</h3>
            </div>
            <p className="text-sm text-gray-600">
              Check logs for debugging and monitoring gateway activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;