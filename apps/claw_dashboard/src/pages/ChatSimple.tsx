import { useState, useRef, useEffect } from 'react';
import gatewayClient, { Session } from '../services/GatewayClient';
import ConnectionDiagnostics from '../components/ConnectionDiagnostics';
import {
  PaperAirplaneIcon,
  UserIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatSimple = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const list = await gatewayClient.listSessions();
        setSessions(list);
        if (list.length > 0 && !selectedSession) {
          setSelectedSession(list[0].sessionKey || list[0].key);
        }
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err);
        setError(err.message);
      }
    };
    fetchSessions();
    
    // Refresh sessions every 30s
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedSession || sending) return;
    
    setSending(true);
    setError(null);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    
    try {
      await gatewayClient.sendMessage(selectedSession, messageText);
      
      // Poll for response (MVP: wait 2s, show placeholder)
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: '(Response polling not yet implemented - see T-007 for streaming support)',
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 2000);
    } catch (err: any) {
      console.error('Send failed:', err.message);
      setError(err.message);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${err.message}`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
            <p className="text-gray-600">Send messages to OpenClaw agents</p>
          </div>
          
          {/* Session Selector */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Session:</label>
            <select
              value={selectedSession || ''}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {sessions.length === 0 && (
                <option value="">No sessions available</option>
              )}
              {sessions.map((session) => (
                <option key={session.key} value={session.sessionKey || session.key}>
                  {session.key} {session.model && `(${session.model})`}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                const list = await gatewayClient.listSessions();
                setSessions(list);
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh sessions"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Connection Diagnostics */}
        <ConnectionDiagnostics />
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <SparklesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Send a message to get started</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'flex items-start space-x-3',
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.sender === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-blue-600" />
              </div>
            )}
            
            <div
              className={clsx(
                'max-w-2xl px-4 py-3 rounded-lg',
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              <p
                className={clsx(
                  'text-xs mt-1',
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                )}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
            
            {message.sender === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sending || !selectedSession}
              placeholder={
                !selectedSession
                  ? 'Select a session first...'
                  : sending
                  ? 'Sending...'
                  : 'Type your message...'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !inputText.trim() || !selectedSession}
            className={clsx(
              'px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors',
              sending || !inputText.trim() || !selectedSession
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <span>{sending ? 'Sending...' : 'Send'}</span>
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSimple;
