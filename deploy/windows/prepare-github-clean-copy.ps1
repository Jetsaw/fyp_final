param(
  [string]$DestinationPath = "$env:USERPROFILE\Desktop\fyp_final_clean"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$DestinationParent = Split-Path -Parent $DestinationPath
New-Item -ItemType Directory -Path $DestinationParent -Force | Out-Null

if (Test-Path -LiteralPath $DestinationPath) {
  Remove-Item -LiteralPath $DestinationPath -Recurse -Force
}

$robocopyArgs = @(
  $RepoRoot.Path, $DestinationPath, "/E",
  "/XD", ".git", ".venv", "venv", "node_modules", "dist", "build", "logs", "__pycache__", ".pytest_cache", "sessions", "models",
  "/XF", ".env", ".env.*", "*.pyc", "*.pyo", "*.log", "*.gguf", "*.safetensors", "*.bin", "*.pt", "*.pth", "*.onnx"
)

robocopy @robocopyArgs | Out-Host
if ($LASTEXITCODE -gt 7) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

@'
# Secrets / local env
.env
.env.*
!.env.example
!**/.env.example
*.pem
*.key
*.crt
*.p12
*.pfx
credentials/
secrets/
.cloudflare/
cloudflared/
*.json.credentials

# Python
.venv/
venv/
env/
__pycache__/
*.py[cod]
*.pyo
.pytest_cache/
.mypy_cache/
.ruff_cache/

# Node / frontend
node_modules/
dist/
build/
.vite/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Logs / cache
logs/
*.log
.cache/
.DS_Store
Thumbs.db

# Local databases / backups
*.sqlite-journal
*.db-wal
*.db-shm
*.bak

# Large model artifacts
models/
*.gguf
*.safetensors
*.bin
*.pt
*.pth
*.onnx

# Temporary deployment packages
*.tar.gz
*.zip
'@ | Set-Content -LiteralPath (Join-Path $DestinationPath ".gitignore") -Encoding UTF8

$EnvSrc = Join-Path $RepoRoot "hive-backend\.env"
$EnvExample = Join-Path $DestinationPath "hive-backend\.env.example"
New-Item -ItemType Directory -Path (Split-Path -Parent $EnvExample) -Force | Out-Null

if (Test-Path -LiteralPath $EnvSrc) {
  Get-Content -LiteralPath $EnvSrc | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') {
      $_
    } else {
      $key = ($_ -split '=', 2)[0].Trim()
      "$key=REPLACE_ME"
    }
  } | Set-Content -LiteralPath $EnvExample -Encoding UTF8
} else {
  @'
APP_ENV=production
HOST=127.0.0.1
PORT=8000
FRONTEND_ORIGIN=https://hive.yourdomain.com
CORS_ORIGINS=https://hive.yourdomain.com
MODEL_PROVIDER=REPLACE_ME
MODEL_BASE_URL=REPLACE_ME
MODEL_API_KEY=REPLACE_ME
MODEL_NAME=REPLACE_ME
'@ | Set-Content -LiteralPath $EnvExample -Encoding UTF8
}

(Get-Content -LiteralPath $EnvExample) -replace 'sk-[A-Za-z0-9_-]+', 'REPLACE_ME' |
  Set-Content -LiteralPath $EnvExample -Encoding UTF8

$envFiles = Get-ChildItem -LiteralPath $DestinationPath -Recurse -Force -File | Where-Object {
  $_.Name -match '^\.env($|\.)' -and $_.Name -ne ".env.example"
}
if ($envFiles) {
  $envFiles | Select-Object FullName | Format-Table -AutoSize | Out-String | Write-Host
  throw "Unsafe env files found in clean copy"
}

$quotedSecretValue = "\s*=\s*['`"][^'`"]{8,}"
$secretPattern = "\bsk-[A-Za-z0-9_-]{20,}|OPENAI_API_KEY$quotedSecretValue|DEEPSEEK_API_KEY$quotedSecretValue|API_KEY$quotedSecretValue|SECRET$quotedSecretValue|TOKEN$quotedSecretValue|PASSWORD$quotedSecretValue|CLOUDFLARE.*TOKEN$quotedSecretValue"
$secretHits = Get-ChildItem -LiteralPath $DestinationPath -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\node_modules\\|\\.venv\\|\\venv\\|\\.git\\'
} | Select-String -Pattern $secretPattern -CaseSensitive | Where-Object {
  $_.Line -notmatch '^\s*#'
}
if ($secretHits) {
  $secretHits | Select-Object Path, LineNumber, Line | Format-Table -AutoSize | Out-String | Write-Host
  throw "Possible secrets found in clean copy"
}

$tooLargeFiles = Get-ChildItem -LiteralPath $DestinationPath -Recurse -File | Where-Object { $_.Length -gt 95MB }
if ($tooLargeFiles) {
  $tooLargeFiles | Select-Object FullName, Length | Format-Table -AutoSize | Out-String | Write-Host
  throw "Files near GitHub hard limit found. Use Git LFS or release assets before pushing."
}

$modelFiles = Get-ChildItem -LiteralPath $DestinationPath -Recurse -File | Where-Object {
  $_.Extension -in ".gguf", ".safetensors", ".bin", ".pt", ".pth", ".onnx"
}
if ($modelFiles) {
  $modelFiles | Select-Object FullName, Length | Format-Table -AutoSize | Out-String | Write-Host
  throw "Model files found. Use Git LFS or release assets before pushing."
}

Write-Host "Clean GitHub copy ready: $DestinationPath"
Write-Host "Next: cd `"$DestinationPath`"; git init; git branch -M main; git remote add origin git@github.com:Jetsaw/fyp_final.git"
