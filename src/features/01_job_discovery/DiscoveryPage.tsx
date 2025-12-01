import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchForm from './SearchForm';
import JobCard from './JobCard';
import type { JobDiscoverySearchData } from './schemas';
import { useGemini } from '../../hooks/useGemini';
import { JobDiscoveryResponseSchema, type JobDiscoveryResponse, type RecommendedJob } from './geminiSchema';
import { useMasterProfile } from '../../contexts/MasterProfileContext';

const DiscoveryPage: React.FC = () => {
  const { profile } = useMasterProfile();
  const { callModel, loading, error } = useGemini();
  const [results, setResults] = useState<RecommendedJob[]>([]);

  const handleSearch = async (data: JobDiscoverySearchData) => {
    // Clear previous results
    setResults([]);

    const systemInstruction = `
      You are an expert Career Coach and Job Researcher.
      Your task is to find and recommend active job listings that match a user's criteria and their Master Profile.
      
      Inputs:
      1. User Search Criteria (Role, Location, Remote Pref)
      2. User Master Profile Summary (Skills, Experience)
      
      Capabilities:
      - Use Google Search Grounding to find REAL, ACTIVE job listings from the last 7 days.
      - Prioritize "Apply on Company Site" links or major boards (LinkedIn, Indeed, etc.).
      - Do not invent jobs. If no exact matches are found, find the closest adjacent roles.
      
      Output:
      Return a structured JSON list of 5-7 recommended jobs.
      For each job, calculate a "Match Score" based on how well the user's skills align with the typical requirements for that role.
    `;

    const userContext = profile ? `
      User Skills: ${profile.skills.join(', ')}
      User Experience: ${profile.experience.map(e => `${e.role} at ${e.company}`).join(', ')}
    ` : 'User Profile: Not provided (General Search)';

    const prompt = `
      Find active job listings for:
      Role: ${data.role}
      Location: ${data.location}
      Remote Only: ${data.isRemote}
      Experience Level: ${data.experienceLevel || 'Any'}
      
      ${userContext}
    `;

    // The 'tools' parameter enables Google Search Grounding
    const response = await callModel<JobDiscoveryResponse>({
      prompt,
      systemInstruction,
      responseSchema: JobDiscoveryResponseSchema,
      tools: [{ google_search: {} } as any], 
      temperature: 0.7 
    });

    if (response && response.recommendedJobs) {
      setResults(response.recommendedJobs);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Discovery</h1>
            <p className="mt-1 text-slate-600">Find high-signal opportunities matching your profile.</p>
          </div>
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>

        <SearchForm 
          onSearch={handleSearch} 
          isLoading={loading} 
        />
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
            Error: {error}
          </div>
        )}

        <div className="space-y-4">
           {results.length > 0 ? (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {results.map((job, idx) => (
                 <JobCard key={idx} job={job} />
               ))}
             </div>
           ) : (
             !loading && (
               <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                 Enter search criteria above to see results.
               </div>
             )
           )}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;
