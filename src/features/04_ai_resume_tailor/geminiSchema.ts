import { SchemaType } from '@google/generative-ai';

// Gemini Response Schema for Resume Tailoring
// Defines strict output structure for the AI model
export const ResumeTailorResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    matchScore: { type: SchemaType.NUMBER, description: "Match score between 0 and 100 indicating how well the profile fits the job." },
    matchRationale: { type: SchemaType.STRING, description: "Brief explanation of the match score." },
    optimizedSummary: { type: SchemaType.STRING, description: "Rewritten professional summary tailored to the job description." },
    optimizedExperience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "The original experience ID from the input." },
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          optimizedAchievements: { 
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING, description: "Rewritten achievement bullet points using STAR method and keywords from JD." }
          }
        },
        required: ["id", "company", "role", "optimizedAchievements"]
      }
    },
    optimizedSkills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, description: "List of relevant skills found in both profile and JD." }
    },
    missingKeywords: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, description: "Important keywords from the JD that are missing from the profile." }
    }
  },
  required: ["matchScore", "matchRationale", "optimizedSummary", "optimizedExperience", "optimizedSkills", "missingKeywords"]
};

// TypeScript interface matching the Schema
export interface OptimizedExperience {
  id: string;
  company: string;
  role: string;
  optimizedAchievements: string[];
}

export interface ResumeTailorResponse {
  matchScore: number;
  matchRationale: string;
  optimizedSummary: string;
  optimizedExperience: OptimizedExperience[];
  optimizedSkills: string[];
  missingKeywords: string[];
}

