import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MasterProfile from './pages/MasterProfile';
import { AuthProvider } from './contexts/AuthContext';
import { MasterProfileProvider } from './contexts/MasterProfileContext';

// Simple protected route placeholder (will be enhanced with real auth check later)
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  // TODO: Check auth state from AuthContext
  const isAuthenticated = true; // Temporary mock
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MasterProfileProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master-profile" 
              element={
                <ProtectedRoute>
                  <MasterProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </MasterProfileProvider>
    </AuthProvider>
  );
};

export default App;
