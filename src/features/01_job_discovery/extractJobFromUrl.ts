import { calculateMatchScore } from './matchScoreCalculator';
import type { RecommendedJob } from './geminiSchema';
import type { MasterProfile } from '../../lib/types';
import { SchemaType, Tool } from '@google/generative-ai';

interface GeminiCallOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  responseSchema?: any;
  tools?: Tool[];
}

type CallModelFunction = <T = any>(options: GeminiCallOptions) => Promise<T | null>;

// Schema for extracting job details from a URL
const JobExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "Job title" },
    company: { type: SchemaType.STRING, description: "Company name" },
    location: { type: SchemaType.STRING, description: "Location (City, State or Remote)" },
    salaryRange: { type: SchemaType.STRING, description: "Estimated salary range if available, else 'Not listed'" },
    description: { type: SchemaType.STRING, description: "Full job description text (extract all relevant details)" },
    requiredSkills: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING },
      description: "Array of specific technical skills, tools, or technologies explicitly mentioned as required or essential"
    },
    preferredSkills: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING },
      description: "Array of skills mentioned as 'preferred', 'nice to have', 'bonus', or 'plus'"
    }
  },
  required: ["title", "company", "location", "description", "requiredSkills", "preferredSkills"]
};

interface JobExtractionResponse {
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

interface ExtractJobOptions {
  url: string;
  userProvidedTitle: string;
  callModel: CallModelFunction;
  profile: MasterProfile | null;
}

export async function extractJobDetailsFromUrl({
  url,
  userProvidedTitle,
  callModel,
  profile
}: ExtractJobOptions): Promise<{
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  description: string;
  url: string;
  matchScore: number;
  requiredSkills: string[];
  preferredSkills: string[];
}> {
  const systemInstruction = `
    You are an expert at extracting job posting information from web pages.
    Your task is to visit the provided URL and extract all relevant job details.
    
    CRITICAL: Your response must be ONLY valid JSON. Do not include any explanatory text, commentary, or narrative before or after the JSON.
    
    Extract the following information from the job posting:
    1. title: The exact job title (use the user-provided title if it matches, otherwise extract from the page)
    2. company: The company name
    3. location: Location (City, State or Remote)
    4. salaryRange: Salary range if available, else 'Not listed'
    5. description: The full job description text (include all relevant details, requirements, responsibilities)
    6. requiredSkills: Array of specific technical skills, tools, frameworks, languages explicitly required
    7. preferredSkills: Array of skills mentioned as preferred, nice to have, or bonus
    
    Be thorough and accurate. Extract all information visible on the job posting page.
  `;

  const prompt = `
    Extract job details from this URL: ${url}
    
    User-provided job title: ${userProvidedTitle}
    
    Visit the URL and extract:
    - Job title
    - Company name
    - Location
    - Salary range (if available)
    - Full job description
    - Required skills
    - Preferred skills
    
    IMPORTANT: Respond with ONLY valid JSON. Do not include any text, explanations, or commentary before or after the JSON.
  `;

  const response = await callModel<JobExtractionResponse>({
    prompt,
    systemInstruction,
    responseSchema: JobExtractionSchema,
    tools: [{ google_search: {} } as any], // Use Google Search Grounding to access the URL
    temperature: 0.3 // Lower temperature for more accurate extraction
  });

  if (!response) {
    throw new Error('Failed to extract job details from URL');
  }

  // Calculate match score if profile is available
  let matchScore = 50; // Default score
  if (profile) {
    const jobForScoring: RecommendedJob = {
      title: response.title,
      company: response.company,
      location: response.location,
      description: response.description,
      requiredSkills: response.requiredSkills,
      preferredSkills: response.preferredSkills,
      matchScore: 50,
      matchRationale: ''
    };

    const breakdown = calculateMatchScore(jobForScoring, profile, {
      location: response.location,
      isRemote: response.location.toLowerCase().includes('remote')
    });
    matchScore = breakdown.overallScore;
  }

  return {
    title: response.title || userProvidedTitle,
    company: response.company,
    location: response.location,
    salaryRange: response.salaryRange || 'Not listed',
    description: response.description,
    url: url,
    matchScore: matchScore,
    requiredSkills: response.requiredSkills || [],
    preferredSkills: response.preferredSkills || []
  };
}

