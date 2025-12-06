import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import MasterProfile from './pages/MasterProfile';
import DiscoveryPage from './features/01_job_discovery/DiscoveryPage';
import ResumeTailorPage from './features/04_ai_resume_tailor/ResumeTailorPage';
import SkillGapAnalyzerPage from './features/03_skill_gap_analyzer/SkillGapAnalyzerPage';
import NetworkingCRM from './features/02_networking/NetworkingCRM';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MasterProfileProvider } from './contexts/MasterProfileContext';
import { JobTrackerProvider } from './contexts/JobTrackerContext';
import { NetworkingProvider } from './contexts/NetworkingContext';

// Protected route wrapper that checks for auth readiness and user presence
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthReady } = useAuth();

  // 1. Wait for auth to initialize
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading Worxstance...</div>
      </div>
    );
  }

  // 2. If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Authenticated
  return children;
};

// Public route that redirects to dashboard if already authenticated
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading Worxstance...</div>
      </div>
    );
  }

  // If already logged in (and not anonymous), redirect to dashboard
  if (user && !user.isAnonymous) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MasterProfileProvider>
        <JobTrackerProvider>
          <NetworkingProvider>
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/" 
                  element={
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
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
                <Route 
                  path="/job-discovery" 
                  element={
                    <ProtectedRoute>
                      <DiscoveryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/skill-gap-analyzer" 
                  element={
                    <ProtectedRoute>
                      <SkillGapAnalyzerPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/resume-tailor" 
                  element={
                    <ProtectedRoute>
                      <ResumeTailorPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/networking" 
                  element={
                    <ProtectedRoute>
                      <NetworkingCRM />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </NetworkingProvider>
        </JobTrackerProvider>
      </MasterProfileProvider>
    </AuthProvider>
  );
};

export default App;
