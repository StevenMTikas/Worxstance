export type UrlQuality = 'good' | 'redirect' | 'search_page' | 'invalid';

export interface UrlAnalysis {
  quality: UrlQuality;
  isProblematic: boolean;
  reason?: string;
  searchQuery?: string; // For fallback Google search
}

/**
 * Analyzes a job URL and determines its quality
 */
export function analyzeJobUrl(url: string | undefined, job: { title: string; company: string; location: string }): UrlAnalysis {
  if (!url) {
    return {
      quality: 'invalid',
      isProblematic: true,
      reason: 'No URL provided',
      searchQuery: `${job.title} ${job.company} ${job.location}`
    };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Check for grounding redirect URLs (often don't work)
    if (hostname.includes('vertexaisearch.cloud.google.com') && 
        pathname.includes('/grounding-api-redirect/')) {
      return {
        quality: 'redirect',
        isProblematic: true,
        reason: 'Google redirect URL (may not work)',
        searchQuery: `${job.title} ${job.company} ${job.location}`
      };
    }

    // Check for search pages
    if (isSearchPage(urlObj)) {
      return {
        quality: 'search_page',
        isProblematic: true,
        reason: 'Points to search results, not specific job',
        searchQuery: `${job.title} ${job.company} ${job.location}`
      };
    }

    // Check for known good patterns
    if (isDirectJobUrl(urlObj)) {
      return {
        quality: 'good',
        isProblematic: false
      };
    }

    // Default: assume it's okay but log for monitoring
    return {
      quality: 'good',
      isProblematic: false
    };

  } catch (e) {
    return {
      quality: 'invalid',
      isProblematic: true,
      reason: 'Invalid URL format',
      searchQuery: `${job.title} ${job.company} ${job.location}`
    };
  }
}

function isSearchPage(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  const searchParams = url.searchParams;

  // ZipRecruiter search patterns
  if (hostname.includes('ziprecruiter.com')) {
    if (pathname === '/jobs/' || 
        pathname.includes('/jobs/search') ||
        searchParams.has('q') || 
        searchParams.has('keywords')) {
      return true;
    }
  }

  // LinkedIn search patterns
  if (hostname.includes('linkedin.com')) {
    if (pathname.includes('/jobs/search') ||
        pathname === '/jobs/' ||
        (pathname.includes('/jobs/') && searchParams.has('keywords'))) {
      return true;
    }
  }

  // Indeed search patterns
  if (hostname.includes('indeed.com')) {
    if (pathname.includes('/jobs') && !pathname.includes('/viewjob')) {
      return true;
    }
  }

  // Glassdoor search patterns
  if (hostname.includes('glassdoor.com')) {
    if (pathname.includes('/Job/') && searchParams.has('keyword')) {
      return true;
    }
  }

  return false;
}

function isDirectJobUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // LinkedIn direct job URLs
  if (hostname.includes('linkedin.com') && pathname.includes('/jobs/view/')) {
    return true;
  }

  // Indeed direct job URLs
  if (hostname.includes('indeed.com') && pathname.includes('/viewjob')) {
    return true;
  }

  // Company websites (assume good if not a known search pattern)
  if (!hostname.includes('linkedin.com') && 
      !hostname.includes('indeed.com') && 
      !hostname.includes('ziprecruiter.com') &&
      !hostname.includes('glassdoor.com') &&
      !hostname.includes('monster.com') &&
      !hostname.includes('vertexaisearch.cloud.google.com')) {
    return true; // Likely a company site
  }

  // ZipRecruiter direct URLs have job IDs
  if (hostname.includes('ziprecruiter.com')) {
    const pathParts = pathname.split('/').filter(p => p);
    // Direct URLs usually have: /jobs/[company]/[title]-[id]/
    if (pathParts.length >= 3 && pathParts[0] === 'jobs') {
      return true;
    }
  }

  // Glassdoor direct job URLs
  if (hostname.includes('glassdoor.com') && pathname.includes('/job-listing/')) {
    return true;
  }

  return false;
}

/**
 * Creates a Google search URL for a job as a fallback
 */
export function createJobSearchUrl(job: { title: string; company: string; location: string }): string {
  const query = encodeURIComponent(`${job.title} ${job.company} ${job.location} jobs`);
  return `https://www.google.com/search?q=${query}`;
}

