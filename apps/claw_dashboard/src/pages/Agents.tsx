import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpenClawWebSocket } from '../hooks/useOpenClawWebSocket';
import { useChat } from '../contexts/ChatContext';
import {
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Agents = () => {
  const { 
    isConnected, 
    agents: wsAgents, 
    spawnAgent: wsSpawnAgent, 
    getAgents,
    error: wsError 
  } = useOpenClawWebSocket();
  const navigate = useNavigate();
  const { addMessage, ensureAgentTab, registerLocalSession, localSessions } = useChat();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [newTask, setNewTask] = useState('');
  const [newAgentId, setNewAgentId] = useState('');
  const [thinking, setThinking] = useState<'off' | 'minimal' | 'low' | 'medium' | 'high'>('low');
  const [isSpawning, setIsSpawning] = useState(false);
  const [spawnError, setSpawnError] = useState<string | null>(null);

  const [agentName, setAgentName] = useState('');
  const [agentWorkspace, setAgentWorkspace] = useState('/home/jakjak04/Desktop/claw_workspace');
  const [agentModel, setAgentModel] = useState('');
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [addAgentError, setAddAgentError] = useState<string | null>(null);

  // Sync agents from WebSocket
  useEffect(() => {
    if (wsAgents && wsAgents.length > 0) {
      const formattedAgents = wsAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        emoji: '🤖',
        model: 'default',
        workspace: '/home/jakjak04/Desktop/claw_workspace',
        isDefault: agent.id === 'main',
      }));
      setAgents(formattedAgents);
    }
  }, [wsAgents]);

  // Load agents on mount and when connected
  useEffect(() => {
    if (isConnected) {
      refresh();
    }
  }, [isConnected]);

  const activeSessions = useMemo(() => {
    const now = Date.now();
    
    // Use local sessions only for now (WebSocket sessions not implemented yet)
    const local = localSessions
      .filter(s => now - s.startedAt <= 10 * 60 * 1000)
      .map(s => ({
        key: s.key,
        updatedAt: s.startedAt,
        model: 'local',
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        source: 'local' as const,
        agentId: s.agentId,
      }));

    const combined = [...local];
    const seen = new Set<string>();
    return combined.filter(s => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [localSessions]);

  const refresh = async () => {
    if (!isConnected) {
      setError('Not connected to WebSocket');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const agentList = await getAgents();
      const formattedAgents = agentList.map(agent => ({
        id: agent.id,
        name: agent.name,
        emoji: '🤖',
        model: 'default',
        workspace: '/home/jakjak04/Desktop/claw_workspace',
        isDefault: agent.id === 'main',
      }));
      setAgents(formattedAgents);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSpawnAgent = async () => {
    if (!newTask.trim()) {
      setSpawnError('Please enter a task for the agent');
      return;
    }

    if (!isConnected) {
      setSpawnError('Not connected to WebSocket');
      return;
    }

    if (newAgentId && !agents.some(a => a.id === newAgentId)) {
      setSpawnError(`Unknown agent id "${newAgentId}". Available: ${agents.map(a => a.id).join(', ') || 'main'}`);
      return;
    }

    setIsSpawning(true);
    setSpawnError(null);

    const targetId = newAgentId || 'main';
    const taskText = newTask.trim();
    
    ensureAgentTab(targetId);
    addMessage(targetId, {
      id: `${Date.now()}-task`,
      text: `Task assigned via WebSocket: ${taskText}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
    });

    const sessionKey = `agent:${targetId}:main`;
    registerLocalSession({
      key: sessionKey,
      agentId: targetId,
      task: taskText,
      startedAt: Date.now(),
      status: 'running',
    });

    setNewTask('');
    setIsSpawning(false);

    try {
      // Use WebSocket to spawn agent
      const agentId = await wsSpawnAgent(taskText, `Agent-${Date.now()}`);
      
      addMessage(targetId, {
        id: `${Date.now()}-plan`,
        text: `Agent spawned via WebSocket with ID: ${agentId}. Task: ${taskText}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      });

      // Refresh agents list
      await refresh();
    } catch (err: any) {
      setSpawnError(err.message || 'Failed to spawn agent via WebSocket');
    }
  };

  const handleAddAgent = async () => {
    if (!agentName.trim()) {
      setAddAgentError('Agent name is required');
      return;
    }

    setIsAddingAgent(true);
    setAddAgentError(null);

    try {
      // Note: Adding agents via WebSocket is not currently supported
      // This would require a new WebSocket method or using CLI
      setAddAgentError('Adding agents via WebSocket is not yet supported. Use CLI instead.');
      setAgentName('');
      setAgentModel('');
    } catch (err: any) {
      setAddAgentError(err.message || 'Failed to add agent');
    } finally {
      setIsAddingAgent(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAge = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600">Create and monitor OpenClaw agent sessions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={clsx(
            'flex items-center px-3 py-1 rounded-full text-sm font-medium',
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          )}>
            {isConnected ? (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                WebSocket Connected
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                WebSocket Offline
              </>
            )}
          </div>
          <button onClick={refresh} className="btn-secondary" disabled={!isConnected}>
            <ArrowPathIcon className={clsx('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {(error || wsError) && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error || wsError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Spawn Task</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Agent ID (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. main"
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to use default agent</p>
              </div>

              <div>
                <label className="label">Thinking Level</label>
                <select className="input" value={thinking} onChange={(e) => setThinking(e.target.value as any)}>
                  <option value="off">off</option>
                  <option value="minimal">minimal</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>

              <div>
                <label className="label">Task</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Describe the task for the agent..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
              </div>

              {spawnError && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                  {spawnError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Spawns via WebSocket (real-time)</div>
                <button
                  onClick={handleSpawnAgent}
                  disabled={isSpawning || !newTask.trim()}
                  className="btn-primary"
                >
                  {isSpawning ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Spawning...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Spawn Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions (last 10 min)</h2>
            {activeSessions.length === 0 ? (
              <div className="text-gray-500 text-sm">No active sessions in the last 10 minutes.</div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((s) => (
                  <div key={s.key} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{s.key}</div>
                        <div className="text-xs text-gray-500">{formatTime(s.updatedAt)} • {formatAge(s.updatedAt)}</div>
                        <div className="text-xs text-gray-400">source: {s.source}</div>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 inline" />
                        <span className="ml-1">active</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Model: {s.model || 'default'} • Tokens: {s.totalTokens ?? 0} • In: {s.inputTokens ?? 0} • Out: {s.outputTokens ?? 0}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="btn-secondary text-xs opacity-50 cursor-not-allowed"
                        onClick={() => setError('Pausing sessions via WebSocket is not yet supported.')}
                        title="Pausing sessions via WebSocket is not yet supported"
                      >
                        <PauseIcon className="w-4 h-4 mr-1" />
                        Pause
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Agents</h2>
            {agents.length === 0 ? (
              <div className="text-gray-500 text-sm">No agents configured.</div>
            ) : (
              <div className="space-y-3">
                {agents.map((a) => (
                  <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{a.emoji || '🤖'} {a.name || a.id}</div>
                    <div className="text-xs text-gray-600">ID: {a.id}</div>
                    <div className="text-xs text-gray-600">Model: {a.model || 'default'}</div>
                    {a.isDefault && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        default
                      </span>
                    )}
                    <div className="mt-3">
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => navigate(`/chat?agent=${encodeURIComponent(a.id)}`)}
                      >
                        Open Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Agent</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              </div>
              <div>
                <label className="label">Workspace</label>
                <input className="input" value={agentWorkspace} onChange={(e) => setAgentWorkspace(e.target.value)} />
              </div>
              <div>
                <label className="label">Model (optional)</label>
                <input className="input" value={agentModel} onChange={(e) => setAgentModel(e.target.value)} />
              </div>
              {addAgentError && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                  {addAgentError}
                </div>
              )}
              <button className="btn-primary" onClick={handleAddAgent} disabled={isAddingAgent}>
                {isAddingAgent ? 'Adding...' : 'Create Agent'}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Uses WebSocket connection to gateway (port 8080)</li>
              <li>• Sessions show only activity in last 10 minutes</li>
              <li>• Real-time agent spawning via WebSocket</li>
              <li>• Adding agents requires CLI (WebSocket not yet supported)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agents;
