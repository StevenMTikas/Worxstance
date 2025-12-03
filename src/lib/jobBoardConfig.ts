import type { JobBoardConfig } from '../features/01_job_discovery/jobBoardAPI';

/**
 * Get job board API configuration from environment variables
 * Set these in your .env file:
 * VITE_ADZUNA_APP_ID=your_app_id
 * VITE_ADZUNA_APP_KEY=your_app_key
 * VITE_JOOBLE_API_KEY=your_api_key (optional)
 */
export function getJobBoardConfig(): JobBoardConfig {
  return {
    adzunaAppId: import.meta.env.VITE_ADZUNA_APP_ID,
    adzunaAppKey: import.meta.env.VITE_ADZUNA_APP_KEY,
    joobleApiKey: import.meta.env.VITE_JOOBLE_API_KEY,
  };
}

/**
 * Check if job board APIs are configured
 */
export function isJobBoardConfigured(): boolean {
  const config = getJobBoardConfig();
  return !!(config.adzunaAppId && config.adzunaAppKey) || !!config.joobleApiKey;
}

