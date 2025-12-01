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
          url: { type: SchemaType.STRING, description: "Direct link to the job application or posting" },
          matchScore: { type: SchemaType.NUMBER, description: "Estimated match score (0-100) based on user profile" },
          matchRationale: { type: SchemaType.STRING, description: "Why this job is a good fit" }
        },
        required: ["title", "company", "location", "description", "matchScore", "matchRationale"]
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
}

export interface JobDiscoveryResponse {
  recommendedJobs: RecommendedJob[];
}

