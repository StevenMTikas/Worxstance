import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ResumeTailorInput from './ResumeTailorInput';
import ResumeTailorOutput from './ResumeTailorOutput';
import type { ResumeTailorInputData } from './schemas';
import { useGemini } from '../../hooks/useGemini';
import { ResumeTailorResponseSchema, type ResumeTailorResponse } from './geminiSchema';
import { useMasterProfile } from '../../contexts/MasterProfileContext';

const ResumeTailorPage: React.FC = () => {
  const { profile } = useMasterProfile();
  const { callModel, loading: aiLoading, error: aiError } = useGemini();
  const [result, setResult] = useState<ResumeTailorResponse | null>(null);

  const handleAnalyze = async (data: ResumeTailorInputData) => {
    if (!profile) {
      alert("Please complete your Master Profile first.");
      return;
    }

    const systemInstruction = `
      You are an expert Resume Writer and Career Coach. 
      Your task is to tailor a user's Master Profile to specifically match a target Job Description (JD).
      
      Inputs:
      1. User's Master Profile (JSON)
      2. Target Job Description (Text)
      
      Guidelines:
      - Analyze the JD for key skills, qualifications, and cultural values.
      - Rewrite the "Summary" to align with the JD's hook.
      - Rewrite "Achievements" for each experience entry. highlight relevant results, use strong action verbs, and incorporate keywords from the JD.
      - DO NOT invent false information. Only optimize existing facts.
      - Identify missing keywords that the user should consider adding if true.
      - Calculate a Match Score (0-100).
      
      Output:
      Return strictly structured JSON matching the provided schema.
    `;

    const prompt = `
      TARGET JOB DESCRIPTION:
      ${data.jobDescription}
      
      USER MASTER PROFILE:
      ${JSON.stringify(profile, null, 2)}
    `;

    const response = await callModel<ResumeTailorResponse>({
      prompt,
      systemInstruction,
      responseSchema: ResumeTailorResponseSchema,
      temperature: 0.4 // Lower temperature for more factual/consistent output
    });

    if (response) {
      setResult(response);
      console.log("Tailored Resume Result:", response);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Resume Tailor</h1>
            <p className="mt-1 text-slate-600">Optimize your resume for specific job descriptions.</p>
          </div>
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>

        {aiError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
            Error: {aiError}
          </div>
        )}

        {!result ? (
          <ResumeTailorInput 
            onAnalyze={handleAnalyze} 
            isAnalyzing={aiLoading} 
          />
        ) : (
          <ResumeTailorOutput 
            originalProfile={profile!} 
            result={result} 
            onReset={() => setResult(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default ResumeTailorPage;
