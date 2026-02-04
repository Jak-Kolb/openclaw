import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGateway } from '../hooks/useGateway';
import { useChat } from '../contexts/ChatContext';
import {
  PaperAirplaneIcon,
  UserIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

const Chat = () => {
  const { status } = useGateway();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = searchParams.get('agent') || 'main';
  const { agentIds, messagesByAgent, addMessage, ensureAgentTab } = useChat();

  const messages = messagesByAgent[agentId] || [];

  useEffect(() => {
    ensureAgentTab(agentId);
  }, [agentId, ensureAgentTab]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    addMessage(agentId, {
      ...userMessage,
      timestamp: new Date().toISOString(),
    });
    setInput('');
    setIsLoading(true);

    try {
      if (!window.electronAPI?.agentRun) {
        throw new Error('Agent API not available');
      }

      const res = await window.electronAPI.agentRun({
        agentId,
        message: userMessage.text,
        thinking: 'low',
      });

      if (!res.success) {
        throw new Error(res.error || 'Agent request failed');
      }

      // Try to parse a text response from the CLI result
      const outputText =
        res.result?.payloads?.[0]?.text ||
        res.result?.message ||
        res.result?.text ||
        res.result?.output ||
        (typeof res.result === 'string' ? res.result : JSON.stringify(res.result));

      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: outputText || 'No response text returned.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      addMessage(agentId, response);
    } catch (err: any) {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${err.message || 'Failed to contact agent'}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      addMessage(agentId, response);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { text: 'Check gateway status', emoji: '⚡' },
    { text: 'How do I restart the gateway?', emoji: '🔄' },
    { text: 'Show me the latest logs', emoji: '📊' },
    { text: 'What can you help me with?', emoji: '🤔' },
  ];

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
            <p className="text-gray-600">Chat with individual agents</p>
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
                  Gateway Connected
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  Gateway Offline
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Container - Main area */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Agent Tabs */}
          <div className="card p-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {agentIds.length === 0 && (
                <div className="text-sm text-gray-500">No agent chats yet</div>
              )}
              {agentIds.map((id) => (
                <button
                  key={id}
                  onClick={() => setSearchParams({ agent: id })}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium',
                    id === agentId ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
          {/* Chat messages */}
          <div className="flex-1 card p-6 mb-6 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={clsx(
                      'flex',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[80%] rounded-2xl p-4',
                        message.sender === 'user'
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        {message.sender === 'assistant' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">J</span>
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              {message.sender === 'user' ? 'You' : 'Jarvis'}
                            </div>
                            <div className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                          <div className="whitespace-pre-wrap">{message.text}</div>
                        </div>
                        {message.sender === 'user' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-2xl rounded-bl-none p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">J</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="card p-6">
            {/* Quick actions */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Quick actions</div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(action.text)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                  >
                    <span className="mr-2">{action.emoji}</span>
                    {action.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input form */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={status.running 
                    ? "Type your message here... (Press Enter to send)" 
                    : "Gateway is offline. Start the gateway to chat..."
                  }
                  disabled={!status.running || isLoading}
                  className={clsx(
                    'input pr-12',
                    (!status.running || isLoading) && 'opacity-50 cursor-not-allowed'
                  )}
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !status.running}
                className={clsx(
                  'btn-primary px-6',
                  (!input.trim() || isLoading || !status.running) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            
            {!status.running && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    The gateway is offline. Start it from the Gateway page to enable chat.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Chat info and history */}
        <div className="space-y-6">
          {/* Chat Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat Information</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Assistant</div>
                <div className="flex items-center mt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center mr-3">
                    <span className="text-white font-bold">J</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Jarvis</div>
                    <div className="text-sm text-gray-600">AI Assistant</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Model</div>
                <div className="mt-1 text-gray-900">DeepSeek V3.2</div>
                <div className="text-sm text-gray-600">via OpenRouter</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Messages</div>
                <div className="mt-1 text-gray-900">{messages.length} total</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Connection</div>
                <div className={clsx(
                  'mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  status.running 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                )}>
                  {status.running ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          </div>

          {/* Chat History */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Chats</h2>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Clear
              </button>
            </div>
            <div className="space-y-3">
              {messages.slice(-3).reverse().map((message) => (
                <div
                  key={message.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => {
                    // Scroll to message
                    const element = document.getElementById(`message-${message.id}`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-900">
                      {message.sender === 'user' ? 'You' : 'Jarvis'}
                    </div>
                    <div className="text-xs text-gray-500">{formatTime(message.timestamp)}</div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{message.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Tips */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat Tips</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <SparklesIcon className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  Ask me to check or control the gateway status
                </div>
              </div>
              <div className="flex items-start">
                <SparklesIcon className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  Request help with development tasks
                </div>
              </div>
              <div className="flex items-start">
                <SparklesIcon className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  Ask about OpenClaw configuration and setup
                </div>
              </div>
              <div className="flex items-start">
                <SparklesIcon className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  Use quick actions for common questions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;