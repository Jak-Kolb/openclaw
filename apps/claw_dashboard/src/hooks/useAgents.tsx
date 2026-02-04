import { useCallback, useEffect, useState } from 'react';

export interface AgentInfo {
  id: string;
  name?: string;
  emoji?: string;
  model?: string;
  workspace?: string;
  isDefault?: boolean;
}

export interface SessionInfo {
  key: string;
  kind: string;
  updatedAt: number;
  model?: string;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
}

interface UseAgentsReturn {
  loading: boolean;
  error: string | null;
  agents: AgentInfo[];
  sessions: SessionInfo[];
  refresh: () => Promise<void>;
  spawn: (task: string, agentId?: string, thinking?: string) => Promise<string>;
  addAgent: (name: string, workspace: string, model?: string) => Promise<void>;
  pauseSession: (sessionId: string, message?: string) => Promise<void>;
}

export const useAgents = (): UseAgentsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  const refresh = useCallback(async () => {
    if (!window.electronAPI) {
      setError('Electron API not available');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [agentsRes, sessionsRes] = await Promise.all([
        window.electronAPI.agentsList(),
        window.electronAPI.sessionsList(),
      ]);

      if (!agentsRes.success) throw new Error(agentsRes.error || 'Failed to load agents');
      if (!sessionsRes.success) throw new Error(sessionsRes.error || 'Failed to load sessions');

      const parsedAgents = (agentsRes.agents || []).map((a: any) => ({
        id: a.id,
        name: a.identityName,
        emoji: a.identityEmoji,
        model: a.model,
        workspace: a.workspace,
        isDefault: a.isDefault,
      }));

      const parsedSessions = (sessionsRes.sessions?.sessions || []).map((s: any) => ({
        key: s.key,
        kind: s.kind,
        updatedAt: s.updatedAt,
        model: s.model,
        totalTokens: s.totalTokens,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
      }));

      setAgents(parsedAgents);
      setSessions(parsedSessions);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, []);

  const spawn = useCallback(async (task: string, agentId?: string, thinking?: string) => {
    if (!window.electronAPI) throw new Error('Electron API not available');
    setError(null);

    const res = await window.electronAPI.agentRun({
      agentId: agentId || 'main',
      message: task,
      thinking,
    });

    if (!res.success) {
      throw new Error(res.error || 'Failed to spawn agent');
    }

    const outputText =
      res.result?.payloads?.[0]?.text ||
      res.result?.message ||
      res.result?.text ||
      res.result?.output ||
      (typeof res.result === 'string' ? res.result : JSON.stringify(res.result));

    await refresh();
    return outputText || 'No response text returned.';
  }, [refresh]);

  const addAgent = useCallback(async (name: string, workspace: string, model?: string) => {
    if (!window.electronAPI) throw new Error('Electron API not available');
    setError(null);

    const res = await window.electronAPI.agentAdd({ name, workspace, model });
    if (!res.success) {
      throw new Error(res.error || 'Failed to add agent');
    }

    await refresh();
  }, [refresh]);

  const pauseSession = useCallback(async (sessionId: string, message?: string) => {
    if (!window.electronAPI) throw new Error('Electron API not available');
    setError(null);

    const res = await window.electronAPI.sessionPause({ sessionId, message });
    if (!res.success) {
      throw new Error(res.error || 'Failed to pause session');
    }

    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000); // poll active sessions
    return () => clearInterval(interval);
  }, [refresh]);

  return { loading, error, agents, sessions, refresh, spawn, addAgent, pauseSession };
};
