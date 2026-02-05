import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface LocalSession {
  key: string;
  agentId: string;
  task: string;
  startedAt: number;
  status: 'running' | 'completed' | 'error';
}

interface ChatState {
  [agentId: string]: ChatMessage[];
}

interface ChatContextType {
  agentIds: string[];
  messagesByAgent: ChatState;
  addMessage: (agentId: string, message: ChatMessage) => void;
  ensureAgentTab: (agentId: string) => void;
  clearAgent: (agentId: string) => void;
  registerLocalSession: (session: LocalSession) => void;
  localSessions: LocalSession[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'claw_chat_state';
const LOCAL_SESSIONS_KEY = 'claw_local_sessions';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messagesByAgent, setMessagesByAgent] = useState<ChatState>({});
  const [localSessions, setLocalSessions] = useState<LocalSession[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setMessagesByAgent(JSON.parse(raw));
      }
      const rawSessions = localStorage.getItem(LOCAL_SESSIONS_KEY);
      if (rawSessions) {
        setLocalSessions(JSON.parse(rawSessions));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesByAgent));
  }, [messagesByAgent]);

  useEffect(() => {
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(localSessions));
  }, [localSessions]);

  const addMessage = (agentId: string, message: ChatMessage) => {
    setMessagesByAgent(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), message],
    }));
  };

  const ensureAgentTab = (agentId: string) => {
    setMessagesByAgent(prev => {
      if (prev[agentId]) return prev;
      return {
        ...prev,
        [agentId]: [],
      };
    });
  };

  const clearAgent = (agentId: string) => {
    setMessagesByAgent(prev => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  };

  const registerLocalSession = (session: LocalSession) => {
    setLocalSessions(prev => {
      const exists = prev.find(s => s.key === session.key);
      if (exists) return prev;
      return [session, ...prev];
    });
  };

  const agentIds = useMemo(() => Object.keys(messagesByAgent), [messagesByAgent]);

  return (
    <ChatContext.Provider value={{ agentIds, messagesByAgent, addMessage, ensureAgentTab, clearAgent, registerLocalSession, localSessions }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
