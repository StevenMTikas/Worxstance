# Adzuna API CORS Limitation

## Issue
The Adzuna API blocks direct browser requests due to CORS (Cross-Origin Resource Sharing) policy. This is a security measure that prevents websites from making API calls directly from the browser.

## Current Status
- ✅ **Jooble API**: Works from browser (no CORS issues)
- ❌ **Adzuna API**: Blocked by CORS (requires server-side calls)
- ✅ **Google Search**: Works via Gemini API (server-side handled by Google)

## Solution Options

### Option 1: Use Jooble Only (Current)
The application gracefully handles Adzuna failures and continues with:
- Jooble API (working)
- Google Search Grounding (working)

### Option 2: Create Backend Proxy (For Adzuna Support)
To use Adzuna, you need to create a backend API endpoint that:
1. Receives search requests from the frontend
2. Makes the Adzuna API call server-side
3. Returns the results to the frontend

**Example Backend Endpoint (Node.js/Express):**
```javascript
app.get('/api/jobs/adzuna', async (req, res) => {
  const { role, location, isRemote } = req.query;
  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/us/search/1?` +
    `app_id=${process.env.ADZUNA_APP_ID}&` +
    `app_key=${process.env.ADZUNA_APP_KEY}&` +
    `what=${role}&where=${location}`
  );
  const data = await response.json();
  res.json(data);
});
```

Then update `jobBoardAPI.ts` to call your backend endpoint instead of Adzuna directly.

### Option 3: Use Firebase Cloud Functions
If using Firebase, create a Cloud Function to proxy Adzuna requests.

## Current Behavior
- Adzuna errors are caught and logged as warnings
- Application continues with Jooble and Google Search
- No user-facing errors - graceful degradation

