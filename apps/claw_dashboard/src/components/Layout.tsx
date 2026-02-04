import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ServerIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Gateway', href: '/gateway', icon: ServerIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Agents', href: '/agents', icon: UserGroupIcon },
    { name: 'Logs', href: '/logs', icon: DocumentTextIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={clsx(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Window controls area - draggable */}
        <div className="window-drag h-12 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 window-no-drag">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold">⚡</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-gray-900">Claw Dashboard</span>
            )}
          </div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="window-no-drag p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={clsx(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )} />
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* App version */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Claw Dashboard v1.0.0
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Window title bar */}
        <div className="window-drag h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="text-sm font-medium text-gray-700">
            {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
          </div>
          
          <div className="flex items-center space-x-2 window-no-drag">
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title="Minimize"
            >
              <MinusIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title="Maximize"
            >
              <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;