import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchForm from './SearchForm';
import JobCard from './JobCard';
import type { JobDiscoverySearchData } from './schemas';
import { useGemini } from '../../hooks/useGemini';
import { JobDiscoveryResponseSchema, type JobDiscoveryResponse, type RecommendedJob } from './geminiSchema';
import { useMasterProfile } from '../../contexts/MasterProfileContext';
import { calculateMatchScore } from './matchScoreCalculator';
import { analyzeJobUrl } from './urlUtils';
import { searchAllJobBoards, type JobBoardJob } from './jobBoardAPI';
import { getJobBoardConfig } from '../../lib/jobBoardConfig';

const DiscoveryPage: React.FC = () => {
  const { profile } = useMasterProfile();
  const { callModel, loading, error } = useGemini();
  const [results, setResults] = useState<RecommendedJob[]>([]);

  const handleSearch = async (data: JobDiscoverySearchData) => {
    // Clear previous results
    setResults([]);

    const allJobs: RecommendedJob[] = [];
    const jobBoardConfig = getJobBoardConfig();

    // Step 1: Search job board APIs (Adzuna, Jooble) for reliable URLs
    let jobBoardResults: JobBoardJob[] = [];
    try {
      jobBoardResults = await searchAllJobBoards(
        {
          role: data.role,
          location: data.location,
          isRemote: data.isRemote,
          experienceLevel: data.experienceLevel,
        },
        jobBoardConfig
      );
      console.log(`Found ${jobBoardResults.length} jobs from job board APIs`);
    } catch (error) {
      console.warn('Job board API search failed, continuing with Google Search:', error);
      // Don't throw - continue with Google Search as fallback
    }

    // Step 2: Convert job board results to RecommendedJob format and enhance with AI
    if (jobBoardResults.length > 0) {
      try {
        const enhancedJobBoardJobs = await enhanceJobBoardResultsWithAI(
          jobBoardResults,
          profile,
          data
        );
        allJobs.push(...enhancedJobBoardJobs);
        console.log(`Enhanced ${enhancedJobBoardJobs.length} jobs from job boards with AI`);
      } catch (error) {
        console.error('Failed to enhance job board results with AI:', error);
        // Fallback: convert without AI enhancement
        const basicJobs = jobBoardResults.map(job => convertJobBoardToRecommended(job, data));
        allJobs.push(...basicJobs);
      }
    }

    const systemInstruction = `
      You are an expert Career Coach and Job Researcher.
      Your task is to find and recommend active job listings that match a user's criteria and their Master Profile.
      
      CRITICAL: Your response must be ONLY valid JSON. Do not include any explanatory text, commentary, or narrative before or after the JSON. Start your response immediately with the opening brace { and end with the closing brace }.
      
      Inputs:
      1. User Search Criteria (Role, Location, Remote Pref)
      2. User Master Profile Summary (Skills, Experience)
      
      Capabilities:
      - Use Google Search Grounding to find REAL, ACTIVE job listings from the last 7 days.
      - Prioritize "Apply on Company Site" links or major boards (LinkedIn, Indeed, etc.).
      - Do not invent jobs. If no exact matches are found, find the closest adjacent roles.
      
      CRITICAL URL Requirements:
      - You MUST provide a URL for each job. Do not set URL to null unless absolutely no URL exists.
      
      URL EXTRACTION PRIORITY (in order):
      1. Extract the ACTUAL job posting URL from Google Search results:
         * Look for URLs like: https://www.linkedin.com/jobs/view/1234567890
         * Look for URLs like: https://www.indeed.com/viewjob?jk=abc123
         * Look for company website URLs: https://company.com/careers/job-title
         * These are the BEST URLs - use them whenever visible in search results
         * When you see a job listing in search results, extract the final destination URL, not intermediate redirects
      
      2. If you can see a job listing in the search results but only see a redirect URL:
         * Try to identify the final destination from the search result context
         * If the redirect leads to a specific job page, extract that final URL
         * Look for URLs in the job description, company name links, or "Apply" button links
      
      3. Only use Google Grounding redirect URLs as a last resort:
         * Format: https://vertexaisearch.cloud.google.com/grounding-api-redirect/...
         * These often don't work reliably, so only use if no other URL is available
         * Always make them absolute (start with https://)
      
      4. NEVER use:
         * Search result pages (e.g., linkedin.com/jobs/search, indeed.com/jobs)
         * Relative URLs (must start with https://)
         * URLs with only query parameters and no specific job ID
         * Generic company career pages without a specific job posting
      
      URL VALIDATION CHECKLIST before including:
      ✓ Does the URL contain a job ID or specific job identifier?
      ✓ Does the URL point to a specific job page, not a search page?
      ✓ Is the URL absolute (starts with https://)?
      ✓ Is the URL from a reputable job board or company site?
      ✓ Does the URL match the job title and company you're listing?
      
      SPECIFIC PLATFORM GUIDELINES:
      - LinkedIn: Use URLs like https://www.linkedin.com/jobs/view/1234567890 (NOT /jobs/search)
      - Indeed: Use URLs like https://www.indeed.com/viewjob?jk=abc123 (NOT /jobs)
      - ZipRecruiter: Use URLs with job IDs like /jobs/[company]/[title]-[id]/ (NOT /jobs/ or /jobs/search)
      - Company sites: Use the specific job posting page URL, not the general careers page
      
      REMEMBER: A redirect URL is better than no URL, but a direct URL is always preferred.
      
      SKILL EXTRACTION (CRITICAL):
      For each job, carefully extract skills from the job description:
      
      1. requiredSkills: Array of specific technical skills, tools, frameworks, languages, or technologies that are:
         - Explicitly listed as "required", "must have", "essential", or "mandatory"
         - Mentioned in a "Requirements:" or "Qualifications:" section
         - Clearly necessary for the role (e.g., "Python developer" → Python is required)
         - Include: programming languages, frameworks, tools, platforms, methodologies
         - Be specific: "React" not "frontend", "AWS" not "cloud"
         - If no skills are clearly required, return an empty array []
      
      2. preferredSkills: Array of skills mentioned as:
         - "preferred", "nice to have", "bonus", "plus", "advantageous"
         - "experience with X is a plus"
         - Skills that would help but aren't mandatory
         - If none mentioned, return an empty array []
      
      Examples:
      - Job says "Python and React required; Docker preferred" 
        → requiredSkills: ["Python", "React"]
        → preferredSkills: ["Docker"]
      
      - Job says "Must have 5+ years JavaScript experience; TypeScript is a plus"
        → requiredSkills: ["JavaScript"]
        → preferredSkills: ["TypeScript"]
      
      - Job says "Looking for a full-stack developer with AWS experience"
        → requiredSkills: ["AWS"] (if it's clearly needed)
        → preferredSkills: [] (or could be preferred if not explicitly required)
      
      MATCH SCORE CALCULATION (Use this exact methodology):
      Calculate Match Score (0-100) using this weighted formula:
      
      1. Skills Alignment (40% weight):
         - Based on requiredSkills and preferredSkills arrays you extracted
         - Compare against user's skills from their profile
         - Score = (matched_required * 0.7 + matched_preferred * 0.3) * 100
         - If no skills extracted, default to 50
      
      2. Experience Level Match (30% weight):
         - Compare job level (Junior/Mid/Senior) with user's experience level
         - Perfect match (same level) = 100
         - One level off (e.g., Mid vs Senior) = 70
         - Two levels off = 40
         - Unknown levels = 50
      
      3. Role Title Relevance (20% weight):
         - Check if job title matches user's target roles
         - Exact match = 90-100
         - Partial match (shared keywords) = 60-80
         - Unrelated = 30-50
      
      4. Location/Remote Preference (10% weight):
         - Perfect match (both remote or same city) = 100
         - Hybrid role = 70
         - Mismatch = 30-40
      
      Final Score = (Skills * 0.4) + (Experience * 0.3) + (Role * 0.2) + (Location * 0.1)
      Round to nearest integer.
      
      Output:
      Return a structured JSON list of 5-7 recommended jobs.
      For each job, provide:
      - requiredSkills: Array of required skills (can be empty)
      - preferredSkills: Array of preferred skills (can be empty)
      - matchScore: The calculated score (0-100)
      - matchRationale: A brief explanation (2-3 sentences) explaining the score, highlighting strengths and any gaps
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
      
      IMPORTANT: Respond with ONLY valid JSON. Do not include any text, explanations, or commentary before or after the JSON. Start your response with { and end with }.
    `;

    // Step 3: Use AI with Google Search Grounding for additional results and company sites
    let googleSearchJobs: RecommendedJob[] = [];
    try {
      const response = await callModel<JobDiscoveryResponse>({
        prompt,
        systemInstruction,
        responseSchema: JobDiscoveryResponseSchema,
        tools: [{ google_search: {} } as any], 
        temperature: 0.7 
      });

      if (response && response.recommendedJobs) {
        // Log the raw response to debug
        console.log('Raw AI Response:', JSON.stringify(response, null, 2));
        
        // Filter out incomplete jobs and validate required fields
        const validJobs = response.recommendedJobs.filter((job) => {
        const isValid = job.title && 
                        job.company && 
                        job.location && 
                        job.description && 
                        typeof job.matchScore === 'number' &&
                        Array.isArray(job.requiredSkills) &&
                        Array.isArray(job.preferredSkills);
        
        if (!isValid) {
          console.warn('Filtered out incomplete job:', job);
          return false;
        }
        
        // Validate and fix URL if present, and analyze URL quality
        if (job.url) {
          try {
            // Check if it's a relative Google Grounding API redirect URL
            if (job.url.startsWith('/grounding-api-redirect/')) {
              // Convert to absolute URL (though these redirects may not work reliably)
              job.url = `https://vertexaisearch.cloud.google.com${job.url}`;
              console.warn('Converted relative grounding URL to absolute (may not work):', job.url);
              console.warn('AI should extract actual job URLs, not redirect URLs. Job:', job.title);
            }
          } catch (e) {
            // If URL parsing fails, check if it's a relative grounding URL
            if (job.url.startsWith('/grounding-api-redirect/')) {
              job.url = `https://vertexaisearch.cloud.google.com${job.url}`;
              console.warn('Converted relative grounding URL to absolute (after parse error, may not work):', job.url);
            } else {
              console.warn('Invalid URL format:', job.url, 'for job:', job.title);
            }
          }
        }
        
        // Analyze URL quality and store for UI
        const urlAnalysis = analyzeJobUrl(job.url, {
          title: job.title,
          company: job.company,
          location: job.location
        });
        
        // Store analysis on job object for UI to use
        (job as any).urlAnalysis = urlAnalysis;
        
        // Log problematic URLs
        if (urlAnalysis.isProblematic) {
          console.warn(`Problematic URL for ${job.title} at ${job.company}:`, {
            url: job.url,
            reason: urlAnalysis.reason,
            quality: urlAnalysis.quality
          });
        }
        
          return isValid;
        });
        
        // Calculate client-side scores and merge with AI scores
        const jobsWithScores = validJobs.map(job => {
        const calculatedBreakdown = calculateMatchScore(job, profile, {
          location: data.location,
          isRemote: data.isRemote
        });
        
        // Use weighted average: 70% calculated (deterministic), 30% AI (contextual)
        // This gives consistency while preserving AI insights
        const finalScore = Math.round(
          (calculatedBreakdown.overallScore * 0.7) + (job.matchScore * 0.3)
        );
        
        // Log score calculation for transparency
        console.log(`Job: ${job.title} at ${job.company}`, {
          aiScore: job.matchScore,
          calculatedScore: calculatedBreakdown.overallScore,
          finalScore: finalScore
        });
        
        return {
          ...job,
          matchScore: finalScore,
          scoreBreakdown: calculatedBreakdown,
          // Store original AI score for reference
          aiMatchScore: job.matchScore
        };
        });
        
      console.log(`Filtered ${response.recommendedJobs.length} jobs to ${jobsWithScores.length} valid jobs from Google Search`);
      // Limit Google Search results to 3 per source
      googleSearchJobs = jobsWithScores.slice(0, 3);
      }
    } catch (error) {
      console.error('Google Search with AI failed:', error);
      // Continue with job board results only
    }

    // Step 4: Combine and deduplicate all results
    const combinedJobs = [...allJobs, ...googleSearchJobs];
    const deduplicatedJobs = deduplicateRecommendedJobs(combinedJobs);
    
    // Sort by match score (highest first)
    deduplicatedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    
    // Limit to max 8 results total
    const finalResults = deduplicatedJobs.slice(0, 8);
    
    console.log(`Total unique jobs: ${finalResults.length} (${allJobs.length} from job boards, ${googleSearchJobs.length} from Google Search, limited to 8 total)`);
    setResults(finalResults);
  };

  /**
   * Enhance job board results with AI to extract skills and calculate match scores
   */
  const enhanceJobBoardResultsWithAI = async (
    jobs: JobBoardJob[],
    profile: any,
    searchCriteria: JobDiscoverySearchData
  ): Promise<RecommendedJob[]> => {
    if (jobs.length === 0) return [];

    // Create a batch prompt for AI to analyze multiple jobs at once
    const jobsDescription = jobs.map((job, index) => `
Job ${index + 1}:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description.substring(0, 400)}
`).join('\n');

    const userContext = profile ? `
User Skills: ${profile.skills.join(', ')}
User Experience: ${profile.experience.map((e: any) => `${e.role} at ${e.company}`).join(', ')}
` : 'User Profile: Not provided (General Search)';

    const enhancementPrompt = `
Analyze the following job listings and extract:
1. requiredSkills: Array of specific technical skills, tools, frameworks, languages explicitly required
2. preferredSkills: Array of skills mentioned as "preferred", "nice to have", or "bonus"
3. matchScore: Calculate match score (0-100) based on user profile
4. matchRationale: Brief explanation (2-3 sentences) of why this is a good match

${userContext}

Search Criteria:
Role: ${searchCriteria.role}
Location: ${searchCriteria.location}
Remote: ${searchCriteria.isRemote}

Jobs to analyze:
${jobsDescription}

Return a JSON array with one object per job in the same order, with this structure:
[
  {
    "requiredSkills": ["skill1", "skill2"],
    "preferredSkills": ["skill3"],
    "matchScore": 75,
    "matchRationale": "Explanation here"
  },
  ...
]
`;

    try {
      const response = await callModel<Array<{
        requiredSkills: string[];
        preferredSkills: string[];
        matchScore: number;
        matchRationale: string;
      }>>({
        prompt: enhancementPrompt,
        systemInstruction: `You are analyzing job listings to extract skills and calculate match scores. Return ONLY valid JSON array.`,
        responseSchema: {
          type: 'array' as any,
          items: {
            type: 'object' as any,
            properties: {
              requiredSkills: { type: 'array' as any, items: { type: 'string' as any } },
              preferredSkills: { type: 'array' as any, items: { type: 'string' as any } },
              matchScore: { type: 'number' as any },
              matchRationale: { type: 'string' as any }
            }
          }
        },
        temperature: 0.7
      });

      if (response && Array.isArray(response) && response.length === jobs.length) {
        // Combine job board data with AI analysis
        return jobs.map((job, index) => {
          const aiAnalysis = response[index];
          const recommendedJob: RecommendedJob = {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            salaryRange: job.salaryRange || 'Not listed',
            requiredSkills: aiAnalysis.requiredSkills || [],
            preferredSkills: aiAnalysis.preferredSkills || [],
            matchScore: aiAnalysis.matchScore || 50,
            matchRationale: aiAnalysis.matchRationale || 'Job matches search criteria.',
          };

          // Calculate client-side score breakdown
          const calculatedBreakdown = calculateMatchScore(recommendedJob, profile, {
            location: searchCriteria.location,
            isRemote: searchCriteria.isRemote
          });

          // Use weighted average: 70% calculated, 30% AI
          const finalScore = Math.round(
            (calculatedBreakdown.overallScore * 0.7) + (recommendedJob.matchScore * 0.3)
          );

          // Analyze URL quality
          const urlAnalysis = analyzeJobUrl(recommendedJob.url, {
            title: recommendedJob.title,
            company: recommendedJob.company,
            location: recommendedJob.location
          });

          return {
            ...recommendedJob,
            matchScore: finalScore,
            scoreBreakdown: calculatedBreakdown,
            aiMatchScore: aiAnalysis.matchScore,
            urlAnalysis
          };
        });
      }
    } catch (error) {
      console.error('AI enhancement failed:', error);
    }

        // Fallback: return basic conversion without AI enhancement
        return jobs.map(job => convertJobBoardToRecommended(job, searchCriteria));
  };

  /**
   * Convert JobBoardJob to RecommendedJob format (basic conversion without AI)
   */
  const convertJobBoardToRecommended = (
    job: JobBoardJob,
    searchCriteria: JobDiscoverySearchData
  ): RecommendedJob => {
    const recommendedJob: RecommendedJob = {
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      url: job.url,
      salaryRange: job.salaryRange || 'Not listed',
      requiredSkills: [],
      preferredSkills: [],
      matchScore: 50, // Default score
      matchRationale: 'Job matches search criteria.',
    };

    // Calculate basic match score
    const calculatedBreakdown = calculateMatchScore(recommendedJob, profile, {
      location: searchCriteria.location,
      isRemote: searchCriteria.isRemote
    });

    const urlAnalysis = analyzeJobUrl(recommendedJob.url, {
      title: recommendedJob.title,
      company: recommendedJob.company,
      location: recommendedJob.location
    });

    return {
      ...recommendedJob,
      matchScore: calculatedBreakdown.overallScore,
      scoreBreakdown: calculatedBreakdown,
      urlAnalysis
    };
  };

  /**
   * Deduplicate recommended jobs by URL
   */
  const deduplicateRecommendedJobs = (jobs: RecommendedJob[]): RecommendedJob[] => {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      if (!job.url) return true; // Keep jobs without URLs
      const normalizedUrl = job.url.toLowerCase().trim();
      if (seen.has(normalizedUrl)) {
        return false;
      }
      seen.add(normalizedUrl);
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Discovery</h1>
            <p className="mt-1 text-slate-600">Find high-signal opportunities matching your profile.</p>
          </div>
          <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
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
                 <JobCard key={`${job.title}-${job.company}-${idx}`} job={job} />
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
