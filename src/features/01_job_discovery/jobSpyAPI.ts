import type { JobBoardJob, JobBoardSearchParams } from './jobBoardAPI';

interface JobSpyResponse {
  success: boolean;
  jobs: JobBoardJob[];
  error: string | null;
}

/**
 * Search Indeed jobs using JobSpy via Python Cloud Function
 * 
 * @param params - Search parameters for job discovery
 * @returns Array of JobBoardJob objects from Indeed
 */
export async function searchIndeedWithJobSpy(
  params: JobBoardSearchParams
): Promise<JobBoardJob[]> {
  // Get Firebase project configuration
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 
                    import.meta.env.VITE_APP_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.warn('Firebase project ID not configured, skipping JobSpy');
    return [];
  }

  // Construct Cloud Function URL
  // Always use the deployed production URL since the function is deployed
  const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/jobspy_scrape_indeed`;

  try {
    // Create request body
    const requestBody = {
      role: params.role,
      location: params.location,
      isRemote: params.isRemote || false,
      results_wanted: 3, // Max 3 results per source
      hours_old: 72, // Jobs from last 72 hours
      country_indeed: 'USA', // Default to USA
    };

    console.log('Calling JobSpy function with params:', requestBody);

    // Call Python Cloud Function with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`JobSpy API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`JobSpy API error: ${response.status} ${response.statusText}`);
    }

    const data: JobSpyResponse = await response.json();

    console.log('JobSpy API response:', { success: data.success, jobCount: data.jobs?.length || 0, error: data.error });

    if (!data.success) {
      console.warn('JobSpy scraping failed:', data.error);
      return [];
    }

    if (!data.jobs || data.jobs.length === 0) {
      console.log('No jobs found from JobSpy');
      return [];
    }

    console.log(`JobSpy returned ${data.jobs.length} raw jobs before validation`);

    // Validate and filter jobs - prioritize jobs with URLs but don't exclude all jobs without URLs
    const validJobs = data.jobs.filter((job) => {
      const hasRequiredFields = job.title && 
                                job.company && 
                                job.location &&
                                job.source === 'indeed';
      
      if (!hasRequiredFields) {
        console.warn('Filtered out job missing required fields:', { 
          title: job.title, 
          company: job.company, 
          location: job.location,
          source: job.source 
        });
        return false;
      }
      
      // Log if job is missing URL but keep it
      if (!job.url) {
        console.warn('Job missing URL (will be kept but deprioritized):', job.title, job.company);
      }
      
      return true;
    });

    console.log(`JobSpy returned ${validJobs.length} valid Indeed jobs after validation`);
    return validJobs;

  } catch (error: any) {
    // Handle timeout
    if (error.name === 'AbortError') {
      console.warn('JobSpy request timed out after 30s, using API fallbacks');
      return [];
    }

    // Handle network errors
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('JobSpy function not available (may not be deployed), using API fallbacks');
      return [];
    }

    // Log other errors but don't throw - graceful degradation
    console.warn('JobSpy scraping failed, using API fallbacks:', error);
    return [];
  }
}

