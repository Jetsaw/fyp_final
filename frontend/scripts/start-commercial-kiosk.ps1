$ErrorActionPreference = "Stop"

$frontendDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $frontendDir
$backendDir = "C:\Users\jeysa\Desktop\Final Years\hive-backend"
$frontendUrl = "http://127.0.0.1:5174"

Write-Host "Hive commercial kiosk launcher" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $backendDir)) {
  Write-Warning "Backend folder not found: $backendDir"
} else {
  Write-Host "Backend folder: $backendDir"
}

Write-Host "Frontend folder: $frontendDir"
Write-Host ""

Write-Host "Starting frontend on $frontendUrl ..."
Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5174") -WorkingDirectory $frontendDir -WindowStyle Hidden

Start-Sleep -Seconds 3

Push-Location $frontendDir
try {
  npm run kiosk:check
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Open kiosk: $frontendUrl" -ForegroundColor Green
Write-Host "If Backend ready is 'no', start the FastAPI backend on port 8000." -ForegroundColor Yellow
