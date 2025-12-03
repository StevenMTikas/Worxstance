import { SchemaType } from '@google/generative-ai';

// Gemini Response Schema for Job Discovery
// Defines strict output structure for the AI model to parse search results
export const JobDiscoveryResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    recommendedJobs: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "Job title" },
          company: { type: SchemaType.STRING, description: "Company name" },
          location: { type: SchemaType.STRING, description: "Location (City, State or Remote)" },
          salaryRange: { type: SchemaType.STRING, description: "Estimated salary range if available, else 'Not listed'" },
          description: { type: SchemaType.STRING, description: "Brief snippet or summary of the job description (approx 200 chars)" },
          url: { type: SchemaType.STRING, description: "Link to the job application or posting. Prefer direct URLs (LinkedIn, Indeed, company site), but if only a Google Grounding redirect URL is available, use the full absolute URL: https://vertexaisearch.cloud.google.com/grounding-api-redirect/..." },
          matchScore: { type: SchemaType.NUMBER, description: "Estimated match score (0-100) based on user profile" },
          matchRationale: { type: SchemaType.STRING, description: "Why this job is a good fit" },
          requiredSkills: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "Array of specific technical skills, tools, or technologies explicitly mentioned as required or essential in the job description"
          },
          preferredSkills: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "Array of skills mentioned as 'preferred', 'nice to have', 'bonus', or 'plus' in the job description"
          }
        },
        required: ["title", "company", "location", "description", "matchScore", "matchRationale", "requiredSkills", "preferredSkills"]
      }
    }
  },
  required: ["recommendedJobs"]
};

export interface RecommendedJob {
  title: string;
  company: string;
  location: string;
  salaryRange?: string;
  description: string;
  url?: string;
  matchScore: number;
  matchRationale: string;
  requiredSkills: string[];
  preferredSkills: string[];
  // Client-side calculated breakdown
  scoreBreakdown?: {
    skillsMatch: number;
    experienceMatch: number;
    roleRelevance: number;
    locationMatch: number;
    overallScore: number;
    matchedRequiredSkills: string[];
    matchedPreferredSkills: string[];
    missingRequiredSkills: string[];
    missingPreferredSkills: string[];
    experienceLevel: 'junior' | 'mid' | 'senior' | 'unknown';
  };
  // Store original AI score for reference
  aiMatchScore?: number;
  // URL quality analysis (added client-side)
  urlAnalysis?: {
    quality: 'good' | 'redirect' | 'search_page' | 'invalid';
    isProblematic: boolean;
    reason?: string;
    searchQuery?: string;
  };
}

export interface JobDiscoveryResponse {
  recommendedJobs: RecommendedJob[];
}

