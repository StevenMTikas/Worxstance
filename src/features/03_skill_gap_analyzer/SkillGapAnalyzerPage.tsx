import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasterProfile } from '../../contexts/MasterProfileContext';
import { useSkillGapAnalysis } from './useSkillGapAnalysis';
import SkillGapInput from './SkillGapInput';
import GapReportViewer from './GapReportViewer';
import RoadmapGenerator from './RoadmapGenerator';
import { Button } from '../../components/common/Button';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import type { GapReport } from '../../lib/types';
import type { SkillGapAnalysisOutput } from './schemas';

const SkillGapAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useMasterProfile();
  const { analyzeGap, loading: analysisLoading, error: analysisError } = useSkillGapAnalysis();
  const { addDocument } = useFirestore();
  const { userId } = useAuth();

  const [currentReport, setCurrentReport] = useState<SkillGapAnalysisOutput | null>(null);
  const [jobContext, setJobContext] = useState<{ jobDescription: string; targetRole?: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAnalyze = async (jobDescription: string, targetRole: string) => {
    if (!profile) return;
    
    setJobContext({ jobDescription, targetRole });
    setSaveStatus('idle');
    
    try {
      const result = await analyzeGap(jobDescription, profile, targetRole);
      if (result) {
        setCurrentReport(result);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  const handleSaveReport = async () => {
    if (!currentReport || !jobContext) return;
    
    if (!userId) {
      setSaveStatus('error');
      setSaveError("You must be signed in to save reports.");
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const reportToSave: GapReport = {
        id: uuidv4(),
        jobTitle: jobContext.targetRole || "Unspecified Role",
        company: "Target Company", // Could be parsed or input if we wanted
        matchScore: currentReport.matchScore,
        summary: currentReport.summary,
        missingSkills: currentReport.missingSkills,
        matchingSkills: currentReport.matchingSkills,
        learningRoadmap: currentReport.roadmap.map(step => ({
          ...step,
          id: uuidv4(),
          status: 'pending' as const
        })),
        generatedAt: new Date().toISOString()
      };

      await addDocument('gap_reports', reportToSave);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error("Failed to save report:", err);
      setSaveStatus('error');
      setSaveError(err.message || "Failed to save report.");
    }
  };

  const handleReset = () => {
    setCurrentReport(null);
    setJobContext(null);
    setSaveStatus('idle');
    setSaveError(null);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
          Please complete your Master Profile before running a skill gap analysis.
        </div>
        <Button className="mt-4" onClick={() => navigate('/master-profile')}>
          Go to Master Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="mr-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Skill Gap Analyzer</h1>
          </div>
          {currentReport && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex space-x-3">
                <Button 
                  onClick={handleReset} 
                  variant="outline"
                >
                  New Analysis
                </Button>
                <Button 
                  onClick={handleSaveReport}
                  disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                  isLoading={saveStatus === 'saving'}
                >
                  {saveStatus === 'saved' ? 'Saved' : 'Save Report'}
                </Button>
              </div>
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600 font-medium">{saveError}</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600 font-medium">Report saved successfully.</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {analysisError && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
            {analysisError}
          </div>
        )}

        {!currentReport ? (
          <div className="max-w-3xl mx-auto">
            <SkillGapInput onAnalyze={handleAnalyze} loading={analysisLoading} />
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How this works</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Paste a job description for a role you're targeting. Our AI will analyze your Master Profile 
                against the job requirements to identify skill gaps, provide a match score, and generate a 
                personalized learning roadmap to help you land the job.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <GapReportViewer report={currentReport} />
            <RoadmapGenerator roadmap={currentReport.roadmap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillGapAnalyzerPage;

