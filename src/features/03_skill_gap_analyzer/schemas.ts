import { z } from 'zod';

export const SkillGapInputSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters long."),
  targetRole: z.string().optional(),
});

export type SkillGapInputData = z.infer<typeof SkillGapInputSchema>;

export const SkillGapAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100).describe("A score from 0 to 100 indicating how well the profile matches the job description."),
  summary: z.string().describe("A high-level summary of the gap analysis, highlighting key strengths and critical weaknesses."),
  missingSkills: z.array(z.object({
    skill: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'nice_to_have']),
    reason: z.string().describe("Why this skill is considered missing or important for this role.")
  })).describe("List of skills found in the JD but missing or weak in the profile."),
  matchingSkills: z.array(z.string()).describe("List of skills found in both the JD and the profile."),
  roadmap: z.array(z.object({
    title: z.string().describe("Title of the learning step."),
    description: z.string().describe("Detailed description of what to learn or build."),
    estimatedTime: z.string().describe("Estimated time to complete (e.g., '2 weeks', '1 month')."),
    resourceUrl: z.string().optional().describe("Optional URL to a recommended resource (course, documentation, etc.)."),
    priority: z.enum(['high', 'medium', 'low']).describe("Priority of this learning step.")
  })).describe("A step-by-step roadmap to bridge the skill gaps.")
});

export type SkillGapAnalysisOutput = z.infer<typeof SkillGapAnalysisSchema>;

