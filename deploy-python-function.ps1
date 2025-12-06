# PowerShell script to deploy Python Cloud Function using gcloud CLI
# Make sure gcloud CLI is installed and authenticated first

Write-Host "Deploying jobspy_scrape_indeed Python Cloud Function..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version 2>&1
    Write-Host "gcloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: gcloud CLI not found!" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "Or use: choco install gcloudsdk (if Chocolatey is installed)" -ForegroundColor Yellow
    exit 1
}

# Set project (update if different)
$projectId = "worxstance-d38fb"
$region = "us-central1"
$functionName = "jobspy_scrape_indeed"

Write-Host "Setting project to: $projectId" -ForegroundColor Cyan
gcloud config set project $projectId

Write-Host "Enabling required APIs..." -ForegroundColor Cyan
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

Write-Host "Deploying function..." -ForegroundColor Cyan
gcloud functions deploy $functionName `
  --gen2 `
  --runtime=python310 `
  --region=$region `
  --source=functions-python `
  --entry-point=$functionName `
  --trigger-http `
  --allow-unauthenticated `
  --timeout=60s `
  --memory=512MB `
  --max-instances=10

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployment successful!" -ForegroundColor Green
    Write-Host "Function URL: https://$region-$projectId.cloudfunctions.net/$functionName" -ForegroundColor Cyan
} else {
    Write-Host "`nDeployment failed. Check errors above." -ForegroundColor Red
}

