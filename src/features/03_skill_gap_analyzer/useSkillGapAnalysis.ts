import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { SkillGapAnalysisSchema, type SkillGapAnalysisOutput } from './schemas';
import type { MasterProfile } from '../../lib/types';

export const useSkillGapAnalysis = () => {
  const { generate, loading, error } = useGemini();
  const [analysisResult, setAnalysisResult] = useState<SkillGapAnalysisOutput | null>(null);

  const analyzeGap = async (jobDescription: string, profile: MasterProfile, targetRole?: string) => {
    // Construct a concise profile summary for the prompt
    const profileSummary = {
      skills: profile.skills,
      targetRoles: profile.targetRoles,
      experience: profile.experience.map(e => ({ role: e.role, company: e.company, description: e.description, achievements: e.achievements })),
      education: profile.education.map(e => ({ degree: e.degree, field: e.fieldOfStudy })),
      certifications: profile.certifications.map(c => c.name)
    };

    const prompt = `
      You are an expert Career Coach and Technical Recruiter.
      
      Task: Perform a detailed Skill Gap Analysis between the candidate's profile and the Target Job Description.
      
      Target Role: ${targetRole || 'Not specified'}
      
      Job Description:
      "${jobDescription}"
      
      Candidate Profile:
      ${JSON.stringify(profileSummary, null, 2)}
      
      Instructions:
      1. Analyze the Job Description to identify key hard and soft skills required.
      2. Compare these against the Candidate Profile.
      3. Identify MATCHING skills (strengths).
      4. Identify MISSING or WEAK skills (gaps) and assign a priority.
      5. Calculate a Match Score (0-100) based on the coverage of critical skills.
      6. Create a practical Learning Roadmap with specific, actionable steps to bridge the gaps.
      
      Output must strictly follow the JSON schema provided.
    `;

    const result = await generate(prompt, SkillGapAnalysisSchema);
    
    if (result) {
      setAnalysisResult(result);
    }
    
    return result;
  };

  return {
    analyzeGap,
    analysisResult,
    loading,
    error
  };
};

