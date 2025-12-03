# Deploying Python Functions with gcloud CLI

## Prerequisites

1. **Install Google Cloud SDK:**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use PowerShell:
     ```powershell
     # Using Chocolatey (if installed)
     choco install gcloudsdk
     
     # Or download installer from:
     # https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
     ```

2. **Initialize and authenticate:**
   ```bash
   gcloud init
   gcloud auth login
   gcloud config set project worxstance-d38fb
   ```

3. **Enable required APIs:**
   ```bash
   gcloud services enable cloudfunctions.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

## Deployment Command

From the project root directory:

```bash
gcloud functions deploy jobspy_scrape_indeed ^
  --gen2 ^
  --runtime=python310 ^
  --region=us-central1 ^
  --source=functions-python ^
  --entry-point=jobspy_scrape_indeed ^
  --trigger-http ^
  --allow-unauthenticated ^
  --timeout=60s ^
  --memory=512MB ^
  --max-instances=10
```

**For PowerShell (use backticks for line continuation):**
```powershell
gcloud functions deploy jobspy_scrape_indeed `
  --gen2 `
  --runtime=python310 `
  --region=us-central1 `
  --source=functions-python `
  --entry-point=jobspy_scrape_indeed `
  --trigger-http `
  --allow-unauthenticated `
  --timeout=60s `
  --memory=512MB `
  --max-instances=10
```

## After Deployment

The function will be available at:
```
https://us-central1-worxstance-d38fb.cloudfunctions.net/jobspy_scrape_indeed
```

Update `src/features/01_job_discovery/jobSpyAPI.ts` if the URL differs.

## Testing Locally

Before deploying, test locally:

```bash
cd functions-python
pip install -r requirements.txt
functions-framework --target=jobspy_scrape_indeed --port=8080
```

Then test with:
```bash
curl -X POST http://localhost:8080 ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"software engineer\",\"location\":\"San Francisco, CA\"}"
```

