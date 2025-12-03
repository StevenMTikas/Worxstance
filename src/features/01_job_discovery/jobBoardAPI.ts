export interface JobBoardConfig {
  adzunaAppId?: string;
  adzunaAppKey?: string;
  joobleApiKey?: string;
}

export interface JobBoardSearchParams {
  role: string;
  location: string;
  isRemote?: boolean;
  experienceLevel?: string;
}

export interface JobBoardJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salaryRange?: string;
  postedDate?: string;
  source: 'adzuna' | 'jooble' | 'google' | 'indeed';
}

// Adzuna API Response Types
interface AdzunaJob {
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  created: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

// Jooble API Response Types
interface JoobleJob {
  title: string;
  company: string;
  location: string;
  snippet: string;
  link: string;
  salary?: string;
  updated?: string;
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

/**
 * Search jobs using Adzuna API
 */
export async function searchAdzunaJobs(
  params: JobBoardSearchParams,
  config: JobBoardConfig
): Promise<JobBoardJob[]> {
  if (!config.adzunaAppId || !config.adzunaAppKey) {
    console.warn('Adzuna API credentials not configured');
    return [];
  }

  // Get Firebase project ID for proxy URL
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 
                    import.meta.env.VITE_APP_FIREBASE_PROJECT_ID;

  if (!projectId) {
    console.warn('Firebase Project ID missing, cannot call Adzuna proxy.');
    return [];
  }

  const proxyUrl = `https://us-central1-${projectId}.cloudfunctions.net/adzunaProxy`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: config.adzunaAppId,
        app_key: config.adzunaAppKey,
        what: params.role,
        where: params.location,
        results_per_page: '3',
        content_type: 'job',
        isRemote: params.isRemote
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Adzuna Proxy error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Adzuna Proxy error: ${response.status} ${response.statusText}`);
    }

    const data: AdzunaResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('No results from Adzuna API (via Proxy)');
      return [];
    }

    return data.results.map((job): JobBoardJob => ({
      title: job.title || 'Untitled Position',
      company: job.company?.display_name || 'Company not specified',
      location: job.location?.display_name || params.location,
      description: job.description ? job.description.substring(0, 500) : 'No description available',
      url: job.redirect_url,
      salaryRange: formatSalaryRange(job.salary_min, job.salary_max, job.salary_is_predicted),
      postedDate: job.created,
      source: 'adzuna',
    }));
  } catch (error: any) {
    console.error('Adzuna API error:', error);
    throw error;
  }
}

/**
 * Search jobs using Jooble API
 */
export async function searchJoobleJobs(
  params: JobBoardSearchParams,
  config: JobBoardConfig
): Promise<JobBoardJob[]> {
  if (!config.joobleApiKey) {
    console.warn('Jooble API key not configured');
    return [];
  }

  const requestBody: any = {
    keywords: params.role,
    location: params.location,
    page: 1,
  };

  // Only add radius for non-remote searches
  if (!params.isRemote) {
    requestBody.radius = 50;
  }

  try {
    const response = await fetch(`https://jooble.org/api/${config.joobleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jooble API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Jooble API error: ${response.status} ${response.statusText}`);
    }

    const data: JoobleResponse = await response.json();

    if (!data.jobs || data.jobs.length === 0) {
      console.log('No results from Jooble API');
      return [];
    }

    // Limit to 3 results per source
    const limitedJobs = data.jobs.slice(0, 3);

    return limitedJobs.map((job): JobBoardJob => ({
      title: job.title || 'Untitled Position',
      company: job.company || 'Company not specified',
      location: job.location || params.location,
      description: job.snippet || 'No description available',
      url: job.link,
      salaryRange: job.salary || undefined,
      postedDate: job.updated,
      source: 'jooble',
    }));
  } catch (error) {
    console.error('Jooble API error:', error);
    throw error;
  }
}

/**
 * Search multiple job boards and combine results
 */
export async function searchAllJobBoards(
  params: JobBoardSearchParams,
  config: JobBoardConfig
): Promise<JobBoardJob[]> {
  const results: JobBoardJob[] = [];

  // Try first job board source (max 3 results)
  // Note: Some APIs require server-side calls due to CORS restrictions
  try {
    const adzunaJobs = await searchAdzunaJobs(params, config);
    // Already limited to 3 by API call, but ensure limit
    const limitedAdzuna = adzunaJobs.slice(0, 3);
    results.push(...limitedAdzuna);
    console.log(`Found ${limitedAdzuna.length} jobs from first source`);
  } catch (error: any) {
    if (error.message === 'CORS_BLOCKED') {
      // CORS error - expected for some APIs from browser
      console.info('First source requires server-side calls. Skipping, using other sources.');
    } else {
      console.warn('First source search failed, continuing with other sources:', error);
    }
  }

  // Try second job board source if configured (max 3 results)
  if (config.joobleApiKey) {
    try {
      const joobleJobs = await searchJoobleJobs(params, config);
      // Already limited to 3 in searchJoobleJobs, but ensure limit
      const limitedJooble = joobleJobs.slice(0, 3);
      results.push(...limitedJooble);
      console.log(`Found ${limitedJooble.length} jobs from second source`);
    } catch (error) {
      console.warn('Second source search failed:', error);
    }
  }

  // Deduplicate by URL
  const uniqueJobs = deduplicateJobs(results);
  console.log(`Total unique jobs from job boards: ${uniqueJobs.length}`);

  return uniqueJobs;
}

/**
 * Format salary range from min/max values
 */
function formatSalaryRange(
  min?: number,
  max?: number,
  isPredicted?: string
): string | undefined {
  if (!min && !max) return undefined;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  if (min && max) {
    const suffix = isPredicted === '1' ? ' (Estimated)' : '';
    return `${formatNumber(min)} - ${formatNumber(max)}${suffix}`;
  } else if (min) {
    return `${formatNumber(min)}+`;
  } else if (max) {
    return `Up to ${formatNumber(max)}`;
  }

  return undefined;
}

/**
 * Deduplicate jobs by URL
 */
function deduplicateJobs(jobs: JobBoardJob[]): JobBoardJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    if (!job.url) return false;
    const normalizedUrl = job.url.toLowerCase().trim();
    if (seen.has(normalizedUrl)) {
      return false;
    }
    seen.add(normalizedUrl);
    return true;
  });
}

