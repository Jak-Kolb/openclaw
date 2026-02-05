import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
// import Dashboard from './pages/Dashboard';
import Gateway from './pages/Gateway';
// import Chat from './pages/Chat';
import ChatSimple from './pages/ChatSimple';
import MissionControl from './pages/MissionControl';
// import Agents from './pages/Agents';
// import Logs from './pages/Logs';
// import Settings from './pages/Settings';
import { GatewayProvider } from './hooks/useGateway';
import { ChatProvider } from './contexts/ChatContext';
import { SessionProvider } from './contexts/SessionContext';

function App() {
  return (
    <GatewayProvider>
      <SessionProvider>
        <ChatProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/mission-control" replace />} />
                <Route path="/mission-control" element={<MissionControl />} />
                <Route path="/chat" element={<ChatSimple />} />
                <Route path="/gateway" element={<Gateway />} />
              </Routes>
            </Layout>
          </Router>
        </ChatProvider>
      </SessionProvider>
    </GatewayProvider>
  );
}

export default App;