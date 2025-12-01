import React from 'react';
import type { SkillGapAnalysisOutput } from './schemas';

interface GapReportViewerProps {
  report: SkillGapAnalysisOutput;
}

const GapReportViewer: React.FC<GapReportViewerProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Analysis Summary</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-500">Match Score:</span>
            <span className={`text-2xl font-bold ${getScoreColor(report.matchScore)}`}>
              {report.matchScore}%
            </span>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed">{report.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Missing Skills */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <span className="bg-red-100 text-red-700 p-1 rounded mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </span>
            Missing / Weak Skills
          </h3>
          {report.missingSkills.length === 0 ? (
            <p className="text-slate-500 italic">No significant skill gaps identified!</p>
          ) : (
            <div className="space-y-4">
              {report.missingSkills.map((item, index) => (
                <div key={index} className="border-l-4 border-red-400 pl-3 py-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-slate-900">{item.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.priority.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matching Skills */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <span className="bg-green-100 text-green-700 p-1 rounded mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
            Matching Skills
          </h3>
          {report.matchingSkills.length === 0 ? (
            <p className="text-slate-500 italic">No exact matches found yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {report.matchingSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GapReportViewer;
