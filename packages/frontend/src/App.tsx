import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import NewRequest from './pages/NewRequest';
import AIAssignment from './pages/AIAssignment';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import AdminPanel from './pages/AdminPanel';
import Teams from './pages/Teams';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { authLoading, initAuth } = useAppStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6' }}>
        <div className="mono" style={{ fontSize: 10, color: '#999' }}>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
        <Route path="/" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><ErrorBoundary><Requests /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/requests/new" element={<ProtectedRoute><ErrorBoundary><NewRequest /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><ErrorBoundary><RequestDetail /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/ai-assignment" element={<ProtectedRoute><ErrorBoundary><AIAssignment /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><ErrorBoundary><Agents /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/agents/:id" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><ErrorBoundary><AgentDetail /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><ErrorBoundary><Teams /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={['admin', 'manager']}><ErrorBoundary><Analytics /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin', 'manager']}><ErrorBoundary><Reports /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><ErrorBoundary><AdminPanel /></ErrorBoundary></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
