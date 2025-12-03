import type { MasterProfile } from '../../lib/types';
import type { RecommendedJob } from './geminiSchema';

export interface MatchScoreBreakdown {
  skillsMatch: number;              // 0-100: How many required/preferred skills user has
  experienceMatch: number;          // 0-100: Experience level alignment
  roleRelevance: number;           // 0-100: How well role title matches target roles
  locationMatch: number;            // 0-100: Location/remote preference match
  overallScore: number;             // Weighted average
  matchedRequiredSkills: string[];  // Required skills user has
  matchedPreferredSkills: string[]; // Preferred skills user has
  missingRequiredSkills: string[];  // Required skills user lacks
  missingPreferredSkills: string[]; // Preferred skills user lacks
  experienceLevel: 'junior' | 'mid' | 'senior' | 'unknown';
}

/**
 * Normalizes skill names for comparison (handles variations)
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/**
 * Checks if a user skill matches a job skill (handles variations and synonyms)
 */
function skillsMatch(userSkill: string, jobSkill: string): boolean {
  const userNorm = normalizeSkill(userSkill);
  const jobNorm = normalizeSkill(jobSkill);
  
  // Exact match
  if (userNorm === jobNorm) return true;
  
  // One contains the other (handles "React" vs "React.js")
  if (userNorm.includes(jobNorm) || jobNorm.includes(userNorm)) return true;
  
  // Check for common variations
  const variations: { [key: string]: string[] } = {
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'react': ['react.js', 'reactjs'],
    'node.js': ['nodejs', 'node'],
    'c++': ['cpp', 'c plus plus'],
    'c#': ['csharp', 'c sharp'],
    'postgresql': ['postgres'],
    'machine learning': ['ml', 'machine-learning'],
    'deep learning': ['dl', 'deep-learning'],
    'natural language processing': ['nlp'],
    'rest api': ['rest', 'restful api'],
  };
  
  // Check variations
  for (const [key, variants] of Object.entries(variations)) {
    if ((userNorm === key || variants.includes(userNorm)) &&
        (jobNorm === key || variants.includes(jobNorm))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Matches user skills against job skills
 */
function matchSkills(
  userSkills: string[],
  jobRequiredSkills: string[],
  jobPreferredSkills: string[]
): {
  matchedRequired: string[];
  matchedPreferred: string[];
  missingRequired: string[];
  missingPreferred: string[];
} {
  const matchedRequired: string[] = [];
  const matchedPreferred: string[] = [];
  
  // Match required skills
  jobRequiredSkills.forEach(jobSkill => {
    const matched = userSkills.find(userSkill => skillsMatch(userSkill, jobSkill));
    if (matched) {
      matchedRequired.push(matched);
    }
  });
  
  // Match preferred skills
  jobPreferredSkills.forEach(jobSkill => {
    const matched = userSkills.find(userSkill => skillsMatch(userSkill, jobSkill));
    if (matched) {
      matchedPreferred.push(matched);
    }
  });
  
  return {
    matchedRequired,
    matchedPreferred,
    missingRequired: jobRequiredSkills.filter(s => !matchedRequired.some(m => skillsMatch(m, s))),
    missingPreferred: jobPreferredSkills.filter(s => !matchedPreferred.some(m => skillsMatch(m, s)))
  };
}

/**
 * Determines experience level from job title and description
 */
function determineExperienceLevel(title: string, description: string): 'junior' | 'mid' | 'senior' | 'unknown' {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();

  if (lowerTitle.includes('senior') || lowerTitle.includes('sr.') || lowerTitle.includes('sr ') ||
      lowerTitle.includes('lead') || lowerTitle.includes('principal') || 
      lowerTitle.includes('architect') || lowerTitle.includes('staff') ||
      lowerDesc.includes('10+ years') || lowerDesc.includes('8+ years') ||
      lowerDesc.includes('minimum 7 years')) {
    return 'senior';
  }

  if (lowerTitle.includes('junior') || lowerTitle.includes('jr.') || lowerTitle.includes('jr ') ||
      lowerTitle.includes('entry') || lowerTitle.includes('intern') || 
      (lowerTitle.includes('associate') && !lowerTitle.includes('senior')) ||
      lowerDesc.includes('0-2 years') || lowerDesc.includes('1-3 years') ||
      lowerDesc.includes('entry level')) {
    return 'junior';
  }

  if (lowerTitle.includes('mid') || lowerTitle.includes('intermediate') ||
      lowerDesc.includes('3-5 years') || lowerDesc.includes('2-7 years') ||
      lowerDesc.includes('4-6 years')) {
    return 'mid';
  }

  return 'unknown';
}

/**
 * Estimates user's experience level from their profile
 */
function estimateUserExperienceLevel(profile: MasterProfile): 'junior' | 'mid' | 'senior' | 'unknown' {
  if (!profile.experience || profile.experience.length === 0) {
    return 'unknown';
  }

  // Calculate total years of experience
  let totalYears = 0;
  const now = new Date();

  profile.experience.forEach(exp => {
    const start = new Date(exp.startDate);
    const end = exp.endDate && exp.endDate !== 'Present' ? new Date(exp.endDate) : now;
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    totalYears += years;
  });

  if (totalYears >= 7) return 'senior';
  if (totalYears >= 3) return 'mid';
  if (totalYears > 0) return 'junior';
  return 'unknown';
}

/**
 * Calculates location match score
 */
function calculateLocationMatch(
  jobLocation: string,
  userLocation: string | undefined,
  _isRemote: boolean,
  userPrefersRemote: boolean
): number {
  const lowerJobLoc = jobLocation.toLowerCase();
  const isJobRemote = lowerJobLoc.includes('remote') || 
                      lowerJobLoc.includes('anywhere') ||
                      lowerJobLoc.includes('work from home');

  // Perfect match: both remote or same location
  if (isJobRemote && userPrefersRemote) return 100;
  if (!isJobRemote && !userPrefersRemote && userLocation) {
    const userCity = userLocation.toLowerCase().split(',')[0].trim();
    const jobCity = jobLocation.toLowerCase().split(',')[0].trim();
    if (userCity === jobCity) return 100;
  }

  // Partial match: hybrid or nearby
  if (lowerJobLoc.includes('hybrid')) return 70;
  if (userLocation && jobLocation.toLowerCase().includes(userLocation.toLowerCase().split(',')[0])) {
    return 80;
  }

  // Mismatch
  if (isJobRemote && !userPrefersRemote) return 40;
  if (!isJobRemote && userPrefersRemote) return 30;

  return 50; // Neutral
}

/**
 * Main function to calculate match score using AI-extracted skills
 */
export function calculateMatchScore(
  job: RecommendedJob,
  profile: MasterProfile | null,
  searchCriteria: { location: string; isRemote: boolean }
): MatchScoreBreakdown {
  // Default scores if no profile
  if (!profile) {
    return {
      skillsMatch: 50,
      experienceMatch: 50,
      roleRelevance: 50,
      locationMatch: calculateLocationMatch(job.location, undefined, searchCriteria.isRemote, searchCriteria.isRemote),
      overallScore: 50,
      matchedRequiredSkills: [],
      matchedPreferredSkills: [],
      missingRequiredSkills: job.requiredSkills || [],
      missingPreferredSkills: job.preferredSkills || [],
      experienceLevel: 'unknown'
    };
  }

  // 1. Skills Match (40% weight) - Using AI-extracted skills
  const userSkills = profile.skills || [];
  const jobRequired = job.requiredSkills || [];
  const jobPreferred = job.preferredSkills || [];
  
  const skillMatches = matchSkills(userSkills, jobRequired, jobPreferred);
  
  // Calculate skills score: 70% weight on required, 30% on preferred
  let skillsMatch = 50; // Default if no skills mentioned
  
  if (jobRequired.length > 0 || jobPreferred.length > 0) {
    const requiredScore = jobRequired.length > 0
      ? (skillMatches.matchedRequired.length / jobRequired.length) * 100
      : 50;
    
    const preferredScore = jobPreferred.length > 0
      ? (skillMatches.matchedPreferred.length / jobPreferred.length) * 100
      : 50;
    
    // Weight: 70% required, 30% preferred
    skillsMatch = Math.round(requiredScore * 0.7 + preferredScore * 0.3);
  }

  // 2. Experience Level Match (30% weight)
  const jobLevel = determineExperienceLevel(job.title, job.description);
  const userLevel = estimateUserExperienceLevel(profile);
  let experienceMatch = 50;
  
  if (jobLevel !== 'unknown' && userLevel !== 'unknown') {
    const levels = { junior: 1, mid: 2, senior: 3 };
    const diff = Math.abs(levels[jobLevel] - levels[userLevel]);
    experienceMatch = diff === 0 ? 100 : diff === 1 ? 70 : 40;
  }

  // 3. Role Title Relevance (20% weight)
  const lowerTitle = job.title.toLowerCase();
  let roleRelevance = 30; // Base score
  
  if (profile.targetRoles && profile.targetRoles.length > 0) {
    profile.targetRoles.forEach(targetRole => {
      const lowerTarget = targetRole.toLowerCase();
      if (lowerTitle.includes(lowerTarget) || lowerTarget.includes(lowerTitle.split(' ')[0])) {
        roleRelevance = Math.max(roleRelevance, 90);
      } else if (lowerTitle.split(' ').some(word => word.length > 3 && lowerTarget.includes(word))) {
        roleRelevance = Math.max(roleRelevance, 60);
      }
    });
  }

  // 4. Location Match (10% weight)
  const locationMatch = calculateLocationMatch(
    job.location,
    profile.location,
    searchCriteria.isRemote,
    searchCriteria.isRemote
  );

  // Calculate weighted overall score
  const overallScore = Math.round(
    skillsMatch * 0.40 +
    experienceMatch * 0.30 +
    roleRelevance * 0.20 +
    locationMatch * 0.10
  );

  return {
    skillsMatch,
    experienceMatch,
    roleRelevance,
    locationMatch,
    overallScore,
    matchedRequiredSkills: skillMatches.matchedRequired,
    matchedPreferredSkills: skillMatches.matchedPreferred,
    missingRequiredSkills: skillMatches.missingRequired,
    missingPreferredSkills: skillMatches.missingPreferred,
    experienceLevel: jobLevel
  };
}

