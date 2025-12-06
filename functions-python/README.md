# JobSpy Python Cloud Functions

This directory contains Python Cloud Functions for scraping Indeed jobs using the JobSpy library.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd functions-python
   pip install -r requirements.txt
   ```

2. **Local Testing:**
   ```bash
   # Run with Functions Framework
   functions-framework --target=jobspy_scrape_indeed --port=8080
   ```

## Deployment

Deploy Python functions to Firebase:

```bash
# From project root
firebase deploy --only functions:jobspy_scrape_indeed
```

Or deploy all functions:

```bash
firebase deploy --only functions
```

## Function Details

- **Function Name:** `jobspy_scrape_indeed`
- **Runtime:** Python 3.10
- **Entry Point:** `jobspy_scrape_indeed` (in `main.py`)
- **Timeout:** 60 seconds (configured in Firebase)
- **Memory:** 512MB minimum

## Request Format

```json
{
  "role": "software engineer",
  "location": "San Francisco, CA",
  "isRemote": false,
  "results_wanted": 3,
  "hours_old": 72,
  "country_indeed": "USA"
}
```

## Response Format

```json
{
  "success": true,
  "jobs": [
    {
      "title": "Software Engineer",
      "company": "Example Corp",
      "location": "San Francisco, CA",
      "description": "Job description...",
      "url": "https://indeed.com/viewjob?jk=...",
      "salaryRange": "$100K - $150K",
      "postedDate": "2024-01-15",
      "source": "indeed"
    }
  ],
  "error": null
}
```

## Notes

- The function scrapes Indeed jobs only (no LinkedIn, etc. to avoid rate limiting)
- Results are limited to 3 jobs per request to match frontend expectations
- All errors are caught and returned gracefully to allow fallback to other job sources

