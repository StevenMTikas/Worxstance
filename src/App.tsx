import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MasterProfile from './pages/MasterProfile';
import DiscoveryPage from './features/01_job_discovery/DiscoveryPage';
import ResumeTailorPage from './features/04_ai_resume_tailor/ResumeTailorPage';
import SkillGapAnalyzerPage from './features/03_skill_gap_analyzer/SkillGapAnalyzerPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MasterProfileProvider } from './contexts/MasterProfileContext';
import { JobTrackerProvider } from './contexts/JobTrackerContext';

// Protected route wrapper that checks for auth readiness and user presence
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthReady } = useAuth();

  // 1. Wait for auth to initialize (check token, anonymous sign-in, etc.)
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading Worxstance...</div>
      </div>
    );
  }

  // 2. Once ready, if no user, redirect to login (should theoretically not happen with auto-anon, but good safety)
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 3. Authenticated
  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MasterProfileProvider>
        <JobTrackerProvider>
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
              
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </JobTrackerProvider>
      </MasterProfileProvider>
    </AuthProvider>
  );
};

export default App;
