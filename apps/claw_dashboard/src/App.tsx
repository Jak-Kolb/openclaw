import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Gateway from './pages/Gateway';
import Chat from './pages/Chat';
import Agents from './pages/Agents';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import { GatewayProvider } from './hooks/useGateway';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <GatewayProvider>
      <ChatProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gateway" element={<Gateway />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </ChatProvider>
    </GatewayProvider>
  );
}

export default App;