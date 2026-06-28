param(
  [string]$OutputPath = "$env:USERPROFILE\Desktop\hive-project.tar.gz"
)

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Push-Location $RepoRoot
try {
  if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
  }

  tar `
    --exclude=".git" `
    --exclude=".env" `
    --exclude="*/.env" `
    --exclude=".env.*" `
    --exclude="*/.env.*" `
    --exclude="node_modules" `
    --exclude=".venv" `
    --exclude="__pycache__" `
    --exclude=".pytest_cache" `
    --exclude="sessions" `
    --exclude="hive-backend/data/sessions" `
    --exclude="*.pyc" `
    --exclude="*.log" `
    -czf $OutputPath .

  Write-Host "Created $OutputPath"
} finally {
  Pop-Location
}
