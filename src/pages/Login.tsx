import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-slate-900">Sign in to Worxstance</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your account to access your workspace and job-search tools.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;


