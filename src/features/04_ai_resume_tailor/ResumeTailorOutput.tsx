import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Copy, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { ResumeTailorResponse } from './geminiSchema';
import type { MasterProfile } from '../../lib/types';
import { generateMarkdown } from '../../lib/exportUtils';

interface ResumeTailorOutputProps {
  originalProfile: MasterProfile;
  result: ResumeTailorResponse;
  onReset: () => void;
}

const ResumeTailorOutput: React.FC<ResumeTailorOutputProps> = ({ originalProfile, result, onReset }) => {
  const [expandedExp, setExpandedExp] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const downloadMarkdown = () => {
    const mdContent = generateMarkdown(originalProfile, result);
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tailored_Resume_${originalProfile.fullName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header / Score Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 grid md:grid-cols-4 gap-8">
          <div className={`col-span-1 flex flex-col items-center justify-center p-6 rounded-2xl border ${getScoreColor(result.matchScore)}`}>
            <span className="text-5xl font-bold">{result.matchScore}%</span>
            <span className="text-sm font-semibold uppercase tracking-wider mt-2">Match Score</span>
          </div>
          
          <div className="col-span-3 space-y-4">
            <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Analysis Result</h2>
                  <p className="text-slate-600 leading-relaxed">{result.matchRationale}</p>
               </div>
               <button
                 onClick={downloadMarkdown}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
               >
                 <Download className="w-4 h-4" />
                 Download .md
               </button>
            </div>
            
            {result.missingKeywords.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-700 text-sm block mb-2">Missing Keywords Detected:</span>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map(kw => (
                        <span key={kw} className="px-2 py-1 bg-white border border-rose-200 text-rose-700 text-xs rounded-md font-medium shadow-sm">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison: Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Professional Summary</h3>
          <button 
            onClick={() => copyToClipboard(result.optimizedSummary)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> Copy Optimized
          </button>
        </div>
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-6">
            <span className="text-xs font-bold text-slate-400 uppercase mb-3 block">Original</span>
            <p className="text-sm text-slate-500 leading-relaxed">
              {originalProfile.summary || "No summary provided in profile."}
            </p>
          </div>
          <div className="p-6 bg-indigo-50/30">
            <span className="text-xs font-bold text-indigo-600 uppercase mb-3 block flex items-center gap-2">
              <CheckCircle className="w-3 h-3" /> Optimized
            </span>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {result.optimizedSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison: Experience */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 px-2">Experience Optimization</h3>
        
        {result.optimizedExperience.map((optExp) => {
          const originalExp = originalProfile.experience.find(e => e.id === optExp.id);
          const isExpanded = expandedExp === optExp.id;

          return (
            <div key={optExp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
              <button 
                onClick={() => setExpandedExp(isExpanded ? null : optExp.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-semibold text-slate-900">{optExp.role}</h4>
                  <p className="text-sm text-slate-500">{optExp.company}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-medium">
                    {isExpanded ? 'Hide Details' : 'View Optimization'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                 <div className="border-t border-slate-100 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                   {/* Original */}
                   <div className="p-6 space-y-4">
                     <span className="text-xs font-bold text-slate-400 uppercase block">Original Bullets</span>
                     <ul className="space-y-3">
                       {originalExp?.achievements.map((bullet, idx) => (
                         <li key={idx} className="text-sm text-slate-500 leading-relaxed list-disc list-outside ml-4">
                           {bullet}
                         </li>
                       )) || <li className="text-sm text-slate-400 italic">No bullets found</li>}
                     </ul>
                   </div>

                   {/* Optimized */}
                   <div className="p-6 space-y-4 bg-indigo-50/30">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-600 uppercase block flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" /> Optimized Bullets
                        </span>
                        <button 
                          onClick={() => copyToClipboard(optExp.optimizedAchievements.join('\n'))}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Copy All
                        </button>
                     </div>
                     <ul className="space-y-3">
                       {optExp.optimizedAchievements.map((bullet, idx) => (
                         <li key={idx} className="text-sm text-slate-800 font-medium leading-relaxed list-disc list-outside ml-4">
                           {bullet}
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-2 px-6 py-3 rounded-lg border border-transparent hover:bg-slate-100 transition-colors"
        >
          &larr; Start New Analysis
        </button>
      </div>
    </div>
  );
};

export default ResumeTailorOutput;

