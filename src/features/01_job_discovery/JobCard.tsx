import React, { useState } from 'react';
import { MapPin, Building2, ExternalLink, ThumbsUp, Check, ChevronDown, ChevronUp, Search, BookmarkPlus } from 'lucide-react';
import type { RecommendedJob } from './geminiSchema';
import { useJobTracker } from '../../contexts/JobTrackerContext';
import { analyzeJobUrl, createJobSearchUrl } from './urlUtils';

interface JobCardProps {
  job: RecommendedJob;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { saveJob, savedJobs } = useJobTracker();
  const [isSaving, setIsSaving] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Add early return if job data is incomplete
  if (!job || !job.title || !job.company) {
    console.warn('JobCard received incomplete job data:', job);
    return null; // Don't render incomplete job cards
  }
  
  // Check if job is already saved (simple check by title+company or URL)
  const isSaved = savedJobs.some(j => 
    (job.url && j.url === job.url) || 
    (j.title === job.title && j.company === job.company)
  );

  const handleSave = async () => {
    if (isSaved) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await saveJob({
        title: job.title,
        company: job.company,
        location: job.location,
        salaryRange: job.salaryRange || 'Not listed',
        description: job.description,
        url: job.url,
        matchScore: job.matchScore,
        keywords: [] // Could extract from description if needed
      });
      setSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save job", err);
      setSaveError(err.message || 'Failed to save job. Please try again.');
      // Hide error message after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  };

  // Analyze URL quality
  const urlAnalysis = analyzeJobUrl(job.url, {
    title: job.title,
    company: job.company,
    location: job.location
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow relative">
      <div className="flex justify-between items-start mb-3">
        <div>
           <h3 className="font-semibold text-slate-900 line-clamp-2" title={job.title || 'No title'}>
             {job.title || 'Untitled Position'}
           </h3>
           <div className="flex items-center text-sm text-slate-500 mt-1">
             <Building2 className="w-3 h-3 mr-1" />
             {job.company || 'Company not specified'}
           </div>
        </div>
        <div 
          className={`flex flex-col items-center px-2 py-1 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${getScoreColor(job.matchScore || 0)}`}
          onClick={() => setShowBreakdown(!showBreakdown)}
          title="Click to see match breakdown"
        >
           <span className="text-sm font-bold">{job.matchScore || 0}%</span>
           <span className="text-[10px] uppercase font-medium">Match</span>
        </div>
      </div>

      <div className="flex items-center text-xs text-slate-500 mb-4 gap-3">
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          {job.location || 'Location not specified'}
        </div>
        {job.salaryRange && job.salaryRange !== 'Not listed' && (
           <div className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
             {job.salaryRange}
           </div>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-grow">
        {job.description || 'No description available.'}
      </p>

      {/* Match Breakdown Section */}
      {showBreakdown && job.scoreBreakdown && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
            <span>Match Breakdown</span>
            <button 
              onClick={() => setShowBreakdown(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-1.5 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Skills Match:</span>
              <span className="font-medium">{job.scoreBreakdown.skillsMatch}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Experience Level:</span>
              <span className="font-medium">{job.scoreBreakdown.experienceMatch}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Role Relevance:</span>
              <span className="font-medium">{job.scoreBreakdown.roleRelevance}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Location:</span>
              <span className="font-medium">{job.scoreBreakdown.locationMatch}%</span>
            </div>
          </div>

          {/* Matched Skills */}
          {(job.scoreBreakdown.matchedRequiredSkills.length > 0 || 
            job.scoreBreakdown.matchedPreferredSkills.length > 0) && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-700 mb-1">Your Matching Skills:</div>
              {job.scoreBreakdown.matchedRequiredSkills.length > 0 && (
                <div className="mb-1">
                  <span className="text-[10px] text-slate-500">Required:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {job.scoreBreakdown.matchedRequiredSkills.slice(0, 5).map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.scoreBreakdown.matchedPreferredSkills.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500">Preferred:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {job.scoreBreakdown.matchedPreferredSkills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Missing Skills */}
          {(job.scoreBreakdown.missingRequiredSkills.length > 0 || 
            job.scoreBreakdown.missingPreferredSkills.length > 0) && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-amber-700 mb-1">Skills to Develop:</div>
              {job.scoreBreakdown.missingRequiredSkills.length > 0 && (
                <div className="mb-1">
                  <span className="text-[10px] text-amber-600">Required:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {job.scoreBreakdown.missingRequiredSkills.slice(0, 5).map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.scoreBreakdown.missingPreferredSkills.length > 0 && (
                <div>
                  <span className="text-[10px] text-amber-600">Preferred:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {job.scoreBreakdown.missingPreferredSkills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Score Calculation Info */}
          {job.aiMatchScore !== undefined && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-[10px] text-slate-500">
                Score: {job.matchScore}% (calculated: {job.scoreBreakdown.overallScore}%, AI: {job.aiMatchScore}%)
              </div>
            </div>
          )}

          {/* AI Rationale */}
          {job.matchRationale && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-700 mb-1">Why this match:</div>
              <p className="text-xs text-slate-600 leading-relaxed">{job.matchRationale}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
         {saveSuccess && (
           <div className="bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg shadow-sm text-center animate-fade-in">
             ✓ Added to Dashboard!
           </div>
         )}
         {saveError && (
           <div className="bg-rose-500 text-white text-xs px-3 py-2 rounded-lg shadow-sm text-center animate-fade-in">
             ⚠️ {saveError}
           </div>
         )}
         
         {job.url && !urlAnalysis.isProblematic ? (
           // Good URL - show normal button
           <a 
             href={job.url} 
             target="_blank" 
             rel="noopener noreferrer"
             className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
           >
             View Job <ExternalLink className="w-3 h-3 ml-1.5" />
           </a>
         ) : job.url && urlAnalysis.isProblematic ? (
           // Problematic URL - show warning and fallback
           <div className="flex flex-col gap-2">
             <div className="text-xs text-amber-600 text-center">
               ⚠️ {urlAnalysis.reason}
             </div>
             <div className="flex gap-2">
               <a 
                 href={job.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                 title="Try this link (may not work)"
               >
                 Try Link <ExternalLink className="w-3 h-3 ml-1.5" />
               </a>
               <a
                 href={createJobSearchUrl({ title: job.title, company: job.company, location: job.location })}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                 title="Search for this job on Google"
               >
                 <Search className="w-4 h-4" />
               </a>
             </div>
           </div>
         ) : (
           // No URL - show search option
           <div className="flex flex-col gap-2">
             <div className="text-xs text-slate-500 text-center">
               No direct link available
             </div>
             <a
               href={createJobSearchUrl({ title: job.title, company: job.company, location: job.location })}
               target="_blank"
               rel="noopener noreferrer"
               className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
               title="Search for this job on Google"
             >
               <Search className="w-4 h-4 mr-1.5" />
               Search for Job
             </a>
           </div>
         )}
         
         <button 
           onClick={handleSave}
           disabled={isSaved || isSaving}
           className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium
             ${isSaved 
               ? 'text-emerald-600 bg-emerald-50 cursor-default border border-emerald-200' 
               : isSaving
               ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
               : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow'}`}
           title={isSaved ? "Already saved to dashboard" : "Add this job to your dashboard"}
         >
           {isSaving ? (
             <>
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               <span>Saving...</span>
             </>
           ) : isSaved ? (
             <>
               <Check className="w-4 h-4" />
               <span>Saved to Dashboard</span>
             </>
           ) : (
             <>
               <BookmarkPlus className="w-4 h-4" />
               <span>Add to Dashboard</span>
             </>
           )}
         </button>
      </div>
    </div>
  );
};

export default JobCard;
