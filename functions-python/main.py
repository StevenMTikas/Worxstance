"""
Firebase Cloud Function for scraping Indeed jobs using JobSpy.
Transforms JobSpy DataFrame output to match JobBoardJob interface.
"""
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from jobspy import scrape_jobs
from flask import Request, Response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def format_salary_range(min_amount: Optional[float], max_amount: Optional[float], 
                        interval: Optional[str] = None) -> Optional[str]:
    """
    Format salary range from JobSpy job_function data.
    Returns formatted string like "$50K - $70K" or None.
    """
    if min_amount is None and max_amount is None:
        return None
    
    def format_number(num: float) -> str:
        if num >= 1000:
            return f"${(num / 1000):.0f}K"
        return f"${num:,.0f}"
    
    if min_amount and max_amount:
        return f"{format_number(min_amount)} - {format_number(max_amount)}"
    elif min_amount:
        return f"{format_number(min_amount)}+"
    elif max_amount:
        return f"Up to {format_number(max_amount)}"
    
    return None


def transform_jobspy_to_jobboard(job_row: Dict[str, Any], location: str) -> Dict[str, Any]:
    """
    Transform a JobSpy job row to JobBoardJob format.
    
    Args:
        job_row: Dictionary representing a row from JobSpy DataFrame
        location: Fallback location if job location is missing
    
    Returns:
        Dictionary matching JobBoardJob interface
    """
    # Extract job_function data (salary info)
    job_function = job_row.get('job_function', {})
    if isinstance(job_function, dict):
        min_amount = job_function.get('min_amount')
        max_amount = job_function.get('max_amount')
        interval = job_function.get('interval', 'yearly')
    else:
        min_amount = None
        max_amount = None
        interval = None
    
    # Format salary range
    salary_range = format_salary_range(min_amount, max_amount, interval)
    
    # Extract description and truncate to 500 chars
    description = job_row.get('description', 'No description available')
    if description and len(description) > 500:
        description = description[:500]
    
    # Build location string
    location_parts = []
    if job_row.get('location', {}).get('city'):
        location_parts.append(job_row['location']['city'])
    if job_row.get('location', {}).get('state'):
        location_parts.append(job_row['location']['state'])
    if job_row.get('location', {}).get('country'):
        location_parts.append(job_row['location']['country'])
    
    job_location = ', '.join(location_parts) if location_parts else location
    
    # Build job object
    job = {
        'title': job_row.get('title', 'Untitled Position'),
        'company': job_row.get('company', 'Company not specified'),
        'location': job_location,
        'description': description or 'No description available',
        'url': job_row.get('job_url', ''),
        'source': 'indeed',
    }
    
    # Add optional fields
    if salary_range:
        job['salaryRange'] = salary_range
    
    if job_row.get('date_posted'):
        job['postedDate'] = job_row['date_posted']
    
    return job


def jobspy_scrape_indeed(request: Request):
    """
    Firebase Cloud Function to scrape Indeed jobs using JobSpy.
    
    Expected request body:
    {
        "role": "software engineer",
        "location": "San Francisco, CA",
        "isRemote": false,
        "results_wanted": 3,
        "hours_old": 72,
        "country_indeed": "USA"
    }
    
    Returns:
    {
        "success": true,
        "jobs": [JobBoardJob[]],
        "error": null
    }
    or
    {
        "success": false,
        "jobs": [],
        "error": "error message"
    }
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Parse request body
        if request.method == 'POST':
            request_json = request.get_json(silent=True)
        else:
            request_json = request.args.to_dict()
        
        if not request_json:
            return ({'success': False, 'jobs': [], 'error': 'No request data provided'}, 400, headers)
        
        # Extract parameters
        role = request_json.get('role', '')
        location = request_json.get('location', '')
        is_remote = request_json.get('isRemote', False)
        results_wanted = request_json.get('results_wanted', 3)
        hours_old = request_json.get('hours_old', 72)
        country_indeed = request_json.get('country_indeed', 'USA')
        
        if not role or not location:
            return ({'success': False, 'jobs': [], 'error': 'role and location are required'}, 400, headers)
        
        logger.info(f"Scraping Indeed jobs: role={role}, location={location}, remote={is_remote}, results={results_wanted}")
        
        # Scrape jobs using JobSpy (Indeed only)
        jobs_df = scrape_jobs(
            site_name=['indeed'],
            search_term=role,
            location=location,
            is_remote=is_remote,
            results_wanted=results_wanted,
            hours_old=hours_old,
            country_indeed=country_indeed,
            verbose=0  # Minimal logging
        )
        
        # Check if we got results
        if jobs_df is None or jobs_df.empty:
            logger.info("No jobs found from JobSpy")
            return ({'success': True, 'jobs': [], 'error': None}, 200, headers)
        
        # Transform DataFrame rows to JobBoardJob format
        jobs = []
        for _, row in jobs_df.iterrows():
            try:
                # Convert row to dict - handle nested dicts properly
                job_dict = {}
                for col in jobs_df.columns:
                    value = row[col]
                    # Convert pandas/numpy types to native Python types
                    if hasattr(value, 'item'):  # numpy scalar
                        value = value.item()
                    elif hasattr(value, 'to_dict'):  # pandas Series
                        value = value.to_dict()
                    job_dict[col] = value
                
                # Transform to JobBoardJob format
                job = transform_jobspy_to_jobboard(job_dict, location)
                jobs.append(job)
            except Exception as e:
                logger.warning(f"Error transforming job row: {e}", exc_info=True)
                continue
        
        logger.info(f"Successfully scraped {len(jobs)} Indeed jobs")
        
        return ({
            'success': True,
            'jobs': jobs,
            'error': None
        }, 200, headers)
        
    except Exception as e:
        logger.error(f"Error scraping Indeed jobs: {str(e)}", exc_info=True)
        return ({
            'success': False,
            'jobs': [],
            'error': str(e)
        }, 500, headers)
