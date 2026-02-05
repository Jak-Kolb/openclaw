import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SessionMapping {
  [sessionId: string]: {
    parentId?: string;
    childIds: string[];
    label?: string;
  };
}

interface SessionContextType {
  mapping: SessionMapping;
  addSpawn: (parentId: string, childId: string, label?: string) => void;
  getChildren: (sessionId: string) => string[];
  getParent: (sessionId: string) => string | undefined;
  clearMapping: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessionHierarchy = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionHierarchy must be used within SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [mapping, setMapping] = useState<SessionMapping>(() => {
    try {
      const stored = localStorage.getItem('openclaw_session_hierarchy');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist to localStorage whenever mapping changes
  useEffect(() => {
    try {
      localStorage.setItem('openclaw_session_hierarchy', JSON.stringify(mapping));
    } catch (err) {
      console.error('Failed to persist session hierarchy:', err);
    }
  }, [mapping]);

  const addSpawn = (parentId: string, childId: string, label?: string) => {
    setMapping((prev) => {
      const updated = { ...prev };
      
      // Initialize parent if needed
      if (!updated[parentId]) {
        updated[parentId] = { childIds: [] };
      }
      
      // Initialize child if needed
      if (!updated[childId]) {
        updated[childId] = { childIds: [], parentId, label };
      } else {
        updated[childId].parentId = parentId;
        if (label) updated[childId].label = label;
      }
      
      // Add child to parent's list if not already there
      if (!updated[parentId].childIds.includes(childId)) {
        updated[parentId].childIds.push(childId);
      }
      
      return updated;
    });
  };

  const getChildren = (sessionId: string): string[] => {
    return mapping[sessionId]?.childIds || [];
  };

  const getParent = (sessionId: string): string | undefined => {
    return mapping[sessionId]?.parentId;
  };

  const clearMapping = () => {
    setMapping({});
    localStorage.removeItem('openclaw_session_hierarchy');
  };

  const value: SessionContextType = {
    mapping,
    addSpawn,
    getChildren,
    getParent,
    clearMapping,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
