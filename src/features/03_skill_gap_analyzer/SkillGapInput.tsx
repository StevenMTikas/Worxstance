import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

interface SkillGapInputProps {
  onAnalyze: (jobDescription: string, targetRole: string) => void;
  loading: boolean;
}

const SkillGapInput: React.FC<SkillGapInputProps> = ({ onAnalyze, loading }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long.');
      return;
    }
    setError('');
    onAnalyze(jobDescription, targetRole);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">New Analysis</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="targetRole" className="block text-sm font-medium text-slate-700 mb-1">
            Target Role (Optional)
          </label>
          <input
            id="targetRole"
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Senior Product Manager"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="jobDescription"
            rows={8}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={loading}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={loading} disabled={loading || !jobDescription}>
            Analyze Gaps
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SkillGapInput;

