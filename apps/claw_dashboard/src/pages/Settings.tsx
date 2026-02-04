import { useState } from 'react';
import {
  Cog6ToothIcon,
  BeakerIcon,
  BellIcon,
  PaintBrushIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Settings = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [autoStart, setAutoStart] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [gatewayPort, setGatewayPort] = useState('8080');
  const [apiKey, setApiKey] = useState('');
  const [logRetention, setLogRetention] = useState('7');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSave = () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const handleTestConnection = () => {
    alert('Connection test would be implemented with backend integration');
  };

  const themes = [
    { id: 'light', name: 'Light', icon: SunIcon, description: 'Light theme for daytime' },
    { id: 'dark', name: 'Dark', icon: MoonIcon, description: 'Dark theme for nighttime' },
    { id: 'system', name: 'System', icon: ComputerDesktopIcon, description: 'Follow system theme' },
  ];

  const settingsSections = [
    {
      title: 'Appearance',
      icon: PaintBrushIcon,
      settings: [
        {
          name: 'Theme',
          description: 'Choose your preferred color theme',
          control: (
            <div className="flex space-x-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={clsx(
                    'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                    theme === t.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <t.icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{t.name}</span>
                </button>
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: 'Behavior',
      icon: Cog6ToothIcon,
      settings: [
        {
          name: 'Auto-start with system',
          description: 'Start Claw Dashboard automatically when you log in',
          control: (
            <button
              onClick={() => setAutoStart(!autoStart)}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                autoStart ? 'bg-green-500' : 'bg-gray-300'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  autoStart ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          ),
        },
        {
          name: 'Minimize to system tray',
          description: 'Minimize to tray instead of closing when clicking X',
          control: (
            <button
              onClick={() => setMinimizeToTray(!minimizeToTray)}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                minimizeToTray ? 'bg-green-500' : 'bg-gray-300'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  minimizeToTray ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          ),
        },
        {
          name: 'Show notifications',
          description: 'Show desktop notifications for important events',
          control: (
            <button
              onClick={() => setNotifications(!notifications)}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                notifications ? 'bg-green-500' : 'bg-gray-300'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  notifications ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          ),
        },
      ],
    },
    {
      title: 'Gateway',
      icon: BeakerIcon,
      settings: [
        {
          name: 'Gateway Port',
          description: 'Port number for the OpenClaw gateway service',
          control: (
            <div className="max-w-xs">
              <input
                type="text"
                value={gatewayPort}
                onChange={(e) => setGatewayPort(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="input"
              />
            </div>
          ),
        },
        {
          name: 'API Key',
          description: 'Your OpenRouter API key for AI services',
          control: (
            <div className="max-w-md">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="input"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use system configuration
              </p>
            </div>
          ),
        },
        {
          name: 'Log Retention',
          description: 'Number of days to keep gateway logs',
          control: (
            <div className="max-w-xs">
              <select
                value={logRetention}
                onChange={(e) => setLogRetention(e.target.value)}
                className="input"
              >
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="0">Forever</option>
              </select>
            </div>
          ),
        },
      ],
    },
    {
      title: 'Notifications',
      icon: BellIcon,
      settings: [
        {
          name: 'Gateway Status Alerts',
          description: 'Notify when gateway starts, stops, or crashes',
          control: (
            <div className="max-w-xs">
              <select className="input" defaultValue="all">
                <option value="all">All events</option>
                <option value="errors">Errors only</option>
                <option value="none">No notifications</option>
              </select>
            </div>
          ),
        },
        {
          name: 'Chat Mentions',
          description: 'Notify when mentioned in chat',
          control: (
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </button>
          ),
        },
        {
          name: 'Update Notifications',
          description: 'Notify when updates are available',
          control: (
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your Claw Dashboard preferences</p>
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Settings saved successfully!
            </span>
          </div>
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Failed to save settings. Please try again.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Sections */}
        <div className="lg:col-span-2 space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title} className="card p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                  <section.icon className="w-6 h-6 text-gray-700" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
              
              <div className="space-y-6">
                {section.settings.map((setting, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-gray-200 last:border-0"
                  >
                    <div className="mb-4 md:mb-0 md:mr-6">
                      <div className="font-medium text-gray-900">{setting.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{setting.description}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {setting.control}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar - Actions and info */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="w-full btn-primary"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => {
                  // Reset to defaults
                  setTheme('system');
                  setAutoStart(true);
                  setNotifications(true);
                  setMinimizeToTray(true);
                  setGatewayPort('8080');
                  setApiKey('');
                  setLogRetention('7');
                }}
                className="w-full btn-secondary"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleTestConnection}
                className="w-full btn-secondary"
              >
                Test Gateway Connection
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Info</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Version</div>
                <div className="mt-1 text-gray-900">1.0.0</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Electron</div>
                <div className="mt-1 text-gray-900">v28.1.0</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">OpenClaw</div>
                <div className="mt-1 text-gray-900">2026.2.1</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Platform</div>
                <div className="mt-1 text-gray-900">
                  {window.electronAPI?.platform || 'Web'}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card p-6 border border-red-200">
            <h2 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (confirm('This will reset all application data including logs and settings. Are you sure?')) {
                    alert('Reset would be implemented with backend integration');
                  }
                }}
                className="w-full btn-danger"
              >
                Reset Application Data
              </button>
              <button
                onClick={() => {
                  if (confirm('This will uninstall Claw Dashboard from your system. Are you sure?')) {
                    alert('Uninstall would be implemented with system integration');
                  }
                }}
                className="w-full btn-secondary border border-red-300 text-red-700 hover:bg-red-50"
              >
                Uninstall Application
              </button>
              <p className="text-xs text-gray-600 mt-4">
                These actions cannot be undone. Please proceed with caution.
              </p>
            </div>
          </div>

          {/* Help Links */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Help & Support</h2>
            <div className="space-y-3">
              <a
                href="https://docs.openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Documentation</div>
                <div className="text-sm text-gray-600 mt-1">Complete user guide</div>
              </a>
              <a
                href="https://github.com/openclaw/openclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">GitHub Issues</div>
                <div className="text-sm text-gray-600 mt-1">Report bugs or request features</div>
              </a>
              <a
                href="https://discord.com/invite/clawd"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Discord Community</div>
                <div className="text-sm text-gray-600 mt-1">Get help from the community</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;