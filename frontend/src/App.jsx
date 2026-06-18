import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CareerAdvisor from './pages/CareerAdvisor';
import PeerMatching from './pages/PeerMatching';
import History from './pages/History';
import ResumeReviewer from './pages/ResumeReviewer';
import MockInterview from './pages/MockInterview';
import JobBoard from './pages/JobBoard';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white'}}>Loading...</div>;
  
  if (!user) return <Navigate to="/auth" />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="advisor" element={<CareerAdvisor />} />
        <Route path="peers" element={<PeerMatching />} />
        <Route path="history" element={<History />} />
        <Route path="resume" element={<ResumeReviewer />} />
        <Route path="interview" element={<MockInterview />} />
        <Route path="jobs" element={<JobBoard />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
