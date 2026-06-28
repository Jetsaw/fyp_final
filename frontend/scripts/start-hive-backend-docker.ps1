$ErrorActionPreference = "Stop"

$backendDir = "C:\Users\jeysa\Desktop\Final Years\hive-backend"
$imageName = "hive-backend:local"
$containerName = "hive-backend-local"

Write-Host "Hive backend Docker launcher" -ForegroundColor Cyan

if (-not (Test-Path $backendDir)) {
  throw "Backend folder not found: $backendDir"
}

try {
  docker info | Out-Null
} catch {
  Write-Error "Docker engine is not available. Start Docker Desktop, then run this script again."
  exit 1
}

Push-Location $backendDir
try {
  Write-Host "Building $imageName from $backendDir ..."
  docker build -t $imageName .

  $existing = docker ps -a --filter "name=$containerName" --format "{{.Names}}"
  if ($existing -eq $containerName) {
    Write-Host "Removing existing container $containerName ..."
    docker rm -f $containerName | Out-Null
  }

  Write-Host "Starting $containerName on http://127.0.0.1:8000 ..."
  docker run -d --name $containerName -p 8000:8000 --env-file ".env" $imageName | Out-Null

  Start-Sleep -Seconds 8
  Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 10 | Select-Object StatusCode,Content
} finally {
  Pop-Location
}

Write-Host "Backend ready at http://127.0.0.1:8000" -ForegroundColor Green
