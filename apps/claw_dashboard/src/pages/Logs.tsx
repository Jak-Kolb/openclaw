import { useState, useEffect } from 'react';
import { useGateway } from '../hooks/useGateway';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Logs = () => {
  const { logs, fetchLogs } = useGateway();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lines, setLines] = useState(50);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs(lines);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, lines, fetchLogs]);

  const handleRefresh = () => {
    fetchLogs(lines);
  };

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-logs-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    // This would need backend implementation to clear logs
    alert('Log clearing would be implemented with backend integration');
  };

  const filteredLogs = logs
    .split('\n')
    .filter(line => {
      if (!searchTerm) return true;
      return line.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .filter(line => {
      if (filterLevel === 'all') return true;
      const levelMatch = line.match(/\[(INFO|WARN|ERROR|DEBUG)\]/);
      return levelMatch && levelMatch[1] === filterLevel;
    });

  const logLevels = [
    { id: 'all', name: 'All', color: 'bg-gray-100 text-gray-800', count: logs.split('\n').length },
    { id: 'INFO', name: 'Info', color: 'bg-blue-100 text-blue-800', count: logs.split('\n').filter(l => l.includes('[INFO]')).length },
    { id: 'WARN', name: 'Warning', color: 'bg-yellow-100 text-yellow-800', count: logs.split('\n').filter(l => l.includes('[WARN]')).length },
    { id: 'ERROR', name: 'Error', color: 'bg-red-100 text-red-800', count: logs.split('\n').filter(l => l.includes('[ERROR]')).length },
    { id: 'DEBUG', name: 'Debug', color: 'bg-purple-100 text-purple-800', count: logs.split('\n').filter(l => l.includes('[DEBUG]')).length },
  ];

  const formatLogLine = (line: string) => {
    if (!line.trim()) return line;
    
    // Color code log levels
    let coloredLine = line;
    if (line.includes('[INFO]')) {
      coloredLine = `<span class="text-blue-600 font-medium">[INFO]</span>${line.substring(6)}`;
    } else if (line.includes('[WARN]')) {
      coloredLine = `<span class="text-yellow-600 font-medium">[WARN]</span>${line.substring(6)}`;
    } else if (line.includes('[ERROR]')) {
      coloredLine = `<span class="text-red-600 font-medium">[ERROR]</span>${line.substring(6)}`;
    } else if (line.includes('[DEBUG]')) {
      coloredLine = `<span class="text-purple-600 font-medium">[DEBUG]</span>${line.substring(7)}`;
    }
    
    // Highlight search term
    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      coloredLine = coloredLine.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    }
    
    return coloredLine;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gateway Logs</h1>
            <p className="text-gray-600">Monitor and analyze OpenClaw gateway activity</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="btn-secondary"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleDownload}
              className="btn-secondary"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={handleClear}
              className="btn-danger"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main logs area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls */}
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="label">Search Logs</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for text in logs..."
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Lines to show */}
              <div>
                <label className="label">Lines to Show</label>
                <select
                  value={lines}
                  onChange={(e) => setLines(Number(e.target.value))}
                  className="input"
                >
                  <option value={20}>20 lines</option>
                  <option value={50}>50 lines</option>
                  <option value={100}>100 lines</option>
                  <option value={200}>200 lines</option>
                  <option value={500}>500 lines</option>
                </select>
              </div>

              {/* Auto refresh */}
              <div>
                <label className="label">Auto Refresh</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={clsx(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      autoRefresh ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {autoRefresh ? 'On (5s)' : 'Off'}
                  </span>
                  {autoRefresh && (
                    <ClockIcon className="w-4 h-4 text-gray-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Log level filters */}
            <div className="mt-6">
              <div className="flex items-center mb-3">
                <FunnelIcon className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by Level</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {logLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setFilterLevel(level.id)}
                    className={clsx(
                      'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      filterLevel === level.id
                        ? level.color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {level.name}
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white bg-opacity-50">
                      {level.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logs display */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DocumentTextIcon className="w-5 h-5 text-gray-300 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-100">Log Output</h2>
                </div>
                <div className="text-sm text-gray-400">
                  {filteredLogs.length} lines
                  {searchTerm && ` matching "${searchTerm}"`}
                  {filterLevel !== 'all' && ` (${filterLevel} only)`}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-950 p-6">
              <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((line, index) => (
                    <div key={index} className="hover:bg-gray-900 px-2 py-1 rounded">
                      <div className="flex">
                        <div className="text-gray-500 w-12 flex-shrink-0 text-right pr-3 select-none">
                          {index + 1}
                        </div>
                        <div 
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: formatLogLine(line) }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No logs to display</p>
                    {searchTerm && (
                      <p className="text-sm mt-2">Try clearing your search or filter</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Stats and info */}
        <div className="space-y-6">
          {/* Log Stats */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Statistics</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Total Lines</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{logs.split('\n').length}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Last Updated</div>
                <div className="mt-1 text-gray-900">Just now</div>
                <div className="text-sm text-gray-600">Auto-refresh: {autoRefresh ? 'On' : 'Off'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">File Size</div>
                <div className="mt-1 text-gray-900">N/A</div>
                <div className="text-sm text-gray-600">Logs loaded in memory</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Filtered Lines</div>
                <div className="mt-1 text-gray-900">{filteredLogs.length}</div>
                <div className="text-sm text-gray-600">
                  Showing {((filteredLogs.length / (logs.split('\n').length || 1)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Log Levels Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Levels</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">INFO</div>
                  <div className="text-sm text-gray-600">Informational messages</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">WARN</div>
                  <div className="text-sm text-gray-600">Warning messages</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">ERROR</div>
                  <div className="text-sm text-gray-600">Error conditions</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">DEBUG</div>
                  <div className="text-sm text-gray-600">Debug information</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  fetchLogs(50);
                }}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Reset Filters</div>
                <div className="text-sm text-gray-600 mt-1">Clear all filters and search</div>
              </button>
              <button
                onClick={() => setFilterLevel('ERROR')}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Show Errors Only</div>
                <div className="text-sm text-gray-600 mt-1">Filter to ERROR level logs</div>
              </button>
              <button
                onClick={() => {
                  setSearchTerm('gateway');
                  setFilterLevel('all');
                }}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Search "gateway"</div>
                <div className="text-sm text-gray-600 mt-1">Find gateway-related entries</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;