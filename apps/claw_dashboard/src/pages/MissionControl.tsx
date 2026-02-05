import { useEffect, useState } from 'react';
import gatewayClient, { type Agent, type Session } from '../services/GatewayClient';
import { useSessionHierarchy } from '../contexts/SessionContext';
import {
  ServerIcon,
  RocketLaunchIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const MissionControl = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { mapping, getChildren, addSpawn } = useSessionHierarchy();
  
  // Spawn form state
  const [showSpawnForm, setShowSpawnForm] = useState(false);
  const [spawnAgent, setSpawnAgent] = useState('head');
  const [spawnTask, setSpawnTask] = useState('');
  const [spawnLabel, setSpawnLabel] = useState('');
  const [spawning, setSpawning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentList, sessionList] = await Promise.all([
        gatewayClient.listAgents(),
        gatewayClient.listSessions(),
      ]);
      setAgents(agentList);
      setSessions(sessionList);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Group sessions by agent (parse from session key)
  const sessionsByAgent: Record<string, Session[]> = {};
  sessions.forEach((session) => {
    // Session key format: "agent:AGENT_ID:..."
    const match = session.key?.match(/^agent:([^:]+):/);
    const agentId = match ? match[1] : 'unknown';
    if (!sessionsByAgent[agentId]) {
      sessionsByAgent[agentId] = [];
    }
    sessionsByAgent[agentId].push(session);
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSpawn = async () => {
    if (!spawnTask.trim() || spawning) return;
    
    setSpawning(true);
    setError(null);
    
    try {
      const res = await gatewayClient.spawnSession({
        agentId: spawnAgent,
        task: spawnTask,
        label: spawnLabel || undefined,
      });
      
      // Record in hierarchy (parent is the default agent session - we'll use head:main for now)
      // TODO: Allow user to select parent session
      const parentSession = sessions.find(s => s.key?.includes('head:main'));
      if (parentSession && res.sessionKey) {
        addSpawn(parentSession.sessionKey || parentSession.key, res.sessionKey, spawnLabel);
      }
      
      // Reset form
      setShowSpawnForm(false);
      setSpawnTask('');
      setSpawnLabel('');
      
      // Refresh sessions
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      setError(`Spawn failed: ${err.message}`);
    } finally {
      setSpawning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Control</h1>
          <p className="text-gray-600">Agents and active sessions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSpawnForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Spawn Session</span>
          </button>
          <span className="text-sm text-gray-500">
            Last refresh: {formatTime(lastRefresh)}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Refresh now"
          >
            <ArrowPathIcon className={clsx('w-5 h-5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Spawn Form Modal */}
      {showSpawnForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Spawn New Session</h2>
              <button
                onClick={() => setShowSpawnForm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent
                </label>
                <select
                  value={spawnAgent}
                  onChange={(e) => setSpawnAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.isDefault && '(default)'} - {agent.model.split('/').pop()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task
                </label>
                <textarea
                  value={spawnTask}
                  onChange={(e) => setSpawnTask(e.target.value)}
                  placeholder="Describe the task for this session..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label (optional)
                </label>
                <input
                  type="text"
                  value={spawnLabel}
                  onChange={(e) => setSpawnLabel(e.target.value)}
                  placeholder="e.g., T-001-impl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowSpawnForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSpawn}
                  disabled={spawning || !spawnTask.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {spawning ? 'Spawning...' : 'Spawn Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Agents Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CpuChipIcon className="w-6 h-6 mr-2 text-blue-600" />
          Available Agents ({agents.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => {
            const agentSessions = sessionsByAgent[agent.id] || [];
            return (
              <div
                key={agent.id}
                className={clsx(
                  'card p-4 border-l-4',
                  agent.isDefault ? 'border-l-blue-500' : 'border-l-gray-300'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  {agent.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      default
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="truncate" title={agent.workspace}>
                    📁 {agent.workspace.split('/').pop()}
                  </div>
                  <div className="truncate" title={agent.model}>
                    🤖 {agent.model.split('/').pop()}
                  </div>
                  <div className="flex items-center space-x-1 mt-2">
                    <ServerIcon className="w-4 h-4" />
                    <span className="font-medium">{agentSessions.length} session(s)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sessions Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <RocketLaunchIcon className="w-6 h-6 mr-2 text-green-600" />
          Active Sessions ({sessions.length})
        </h2>
        
        {sessions.length === 0 && (
          <div className="card p-8 text-center text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active sessions</p>
          </div>
        )}
        
        {Object.keys(sessionsByAgent)
          .sort()
          .map((agentId) => {
            const agentSessions = sessionsByAgent[agentId];
            const agent = agents.find((a) => a.id === agentId);
            
            return (
              <div key={agentId} className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  {agentId} {agent?.isDefault && '(default)'}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {agentSessions.length} session(s)
                  </span>
                </h3>
                
                <div className="space-y-2">
                  {agentSessions.map((session) => {
                    const sessionKey = session.sessionKey || session.key;
                    const children = getChildren(sessionKey);
                    const hasChildren = children.length > 0;
                    
                    return (
                      <div key={sessionKey} className="space-y-2">
                        {/* Parent Session */}
                        <div className="card p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-mono text-sm text-gray-900 flex items-center">
                                {sessionKey}
                                {hasChildren && (
                                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                    {children.length} child{children.length > 1 ? 'ren' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                                {session.kind && (
                                  <span className="px-2 py-1 bg-gray-100 rounded">
                                    {session.kind}
                                  </span>
                                )}
                                {session.model && (
                                  <span title={session.model}>
                                    🤖 {session.model.split('/').pop()}
                                  </span>
                                )}
                                {session.totalTokens && (
                                  <span>
                                    🎯 {session.totalTokens.toLocaleString()} tokens
                                  </span>
                                )}
                                {session.updatedAt && (
                                  <span title={formatTimestamp(session.updatedAt)}>
                                    🕐 {Math.floor((Date.now() - session.updatedAt) / 60000)}m ago
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Child Sessions (indented) */}
                        {hasChildren && (
                          <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
                            {children.map((childKey) => {
                              const childSession = sessions.find(s => (s.sessionKey || s.key) === childKey);
                              if (!childSession) {
                                return (
                                  <div key={childKey} className="text-xs text-gray-400 italic">
                                    {childKey} (session ended)
                                  </div>
                                );
                              }
                              
                              const childLabel = mapping[childKey]?.label;
                              
                              return (
                                <div key={childKey} className="card p-3 bg-gray-50">
                                  <div className="font-mono text-xs text-gray-700">
                                    {childLabel && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded mr-2 not-italic font-medium">
                                        {childLabel}
                                      </span>
                                    )}
                                    {childKey}
                                  </div>
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                    {childSession.model && (
                                      <span>{childSession.model.split('/').pop()}</span>
                                    )}
                                    {childSession.totalTokens && (
                                      <span>{childSession.totalTokens.toLocaleString()} tokens</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MissionControl;
