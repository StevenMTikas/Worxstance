import React, { useState } from 'react';
import { MapPin, Building2, ExternalLink, ThumbsUp, Check } from 'lucide-react';
import type { RecommendedJob } from './geminiSchema';
import { useJobTracker } from '../../contexts/JobTrackerContext';

interface JobCardProps {
  job: RecommendedJob;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { saveJob, savedJobs } = useJobTracker();
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if job is already saved (simple check by title+company or URL)
  const isSaved = savedJobs.some(j => 
    (job.url && j.url === job.url) || 
    (j.title === job.title && j.company === job.company)
  );

  const handleSave = async () => {
    if (isSaved) return;
    setIsSaving(true);
    try {
      await saveJob({
        title: job.title,
        company: job.company,
        location: job.location,
        salaryRange: job.salaryRange,
        description: job.description,
        url: job.url,
        matchScore: job.matchScore,
        keywords: [] // Could extract from description if needed
      });
    } catch (err) {
      console.error("Failed to save job", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
           <h3 className="font-semibold text-slate-900 line-clamp-2" title={job.title}>
             {job.title}
           </h3>
           <div className="flex items-center text-sm text-slate-500 mt-1">
             <Building2 className="w-3 h-3 mr-1" />
             {job.company}
           </div>
        </div>
        <div className={`flex flex-col items-center px-2 py-1 rounded-lg ${getScoreColor(job.matchScore)}`}>
           <span className="text-sm font-bold">{job.matchScore}%</span>
           <span className="text-[10px] uppercase font-medium">Match</span>
        </div>
      </div>

      <div className="flex items-center text-xs text-slate-500 mb-4 gap-3">
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          {job.location}
        </div>
        {job.salaryRange && job.salaryRange !== 'Not listed' && (
           <div className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
             {job.salaryRange}
           </div>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-grow">
        {job.description}
      </p>

      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
         {job.url ? (
           <a 
             href={job.url} 
             target="_blank" 
             rel="noopener noreferrer"
             className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
           >
             View Job <ExternalLink className="w-3 h-3 ml-1.5" />
           </a>
         ) : (
            <button disabled className="flex-1 px-3 py-2 text-sm text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed">
              No Link Available
            </button>
         )}
         
         <button 
           onClick={handleSave}
           disabled={isSaved || isSaving}
           className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center
             ${isSaved 
               ? 'text-emerald-600 bg-emerald-50 cursor-default' 
               : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
           title={isSaved ? "Saved" : "Save Job"}
         >
           {isSaving ? (
             <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
           ) : isSaved ? (
             <Check className="w-4 h-4" />
           ) : (
             <ThumbsUp className="w-4 h-4" />
           )}
         </button>
      </div>
    </div>
  );
};

export default JobCard;
