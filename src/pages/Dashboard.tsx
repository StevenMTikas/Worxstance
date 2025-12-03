import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JobTrackingDashboard from '../components/JobTrackingDashboard';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const tools = [
    {
      id: '01_job_discovery',
      name: 'Job Discovery',
      description: 'Find and track relevant job opportunities with AI search grounding.',
      path: '/job-discovery',
      status: 'MVP Wave 1',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
    {
      id: '04_ai_resume_tailor',
      name: 'AI Resume Tailor',
      description: 'Tailor your resume to specific job descriptions for higher match rates.',
      path: '/resume-tailor',
      status: 'MVP Wave 1',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
    {
      id: 'master_profile',
      name: 'Master Profile',
      description: 'The single source of truth for your experience, education, and skills.',
      path: '/master-profile',
      status: 'Core Data',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700'
    }
  ];

  const comingSoon = [
    { name: 'Networking CRM', path: '/networking' },
    { name: 'Skill Gap Analyzer', path: '/skill-gap' },
    { name: 'Cover Letter Generator', path: '/cover-letter' },
    { name: 'STAR Story Builder', path: '/star-stories' },
    { name: 'Mock Interview Simulator', path: '/mock-interview' },
    { name: 'Post-Interview Follow-up', path: '/follow-up' },
    { name: 'Offer Negotiator', path: '/negotiator' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Worxstance Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Welcome back{user?.isAnonymous ? ' (Guest)' : user?.email ? `, ${user.email}` : ''}. Select a tool to get started.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Logout
          </button>
        </header>

        <JobTrackingDashboard />

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Active Tools (MVP)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link 
                key={tool.id} 
                to={tool.path}
                className="block group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className={`absolute top-4 right-4 text-xs px-2 py-1 rounded-full border ${tool.color} font-medium`}>
                  {tool.status}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-slate-600">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Coming Soon</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {comingSoon.map((tool) => (
              <div key={tool.name} className="bg-slate-100 p-4 rounded-lg border border-slate-200 opacity-60 cursor-not-allowed">
                <span className="text-sm font-medium text-slate-500">{tool.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
