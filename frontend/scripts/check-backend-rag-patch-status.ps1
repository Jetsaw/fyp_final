param()

$ErrorActionPreference = "Stop"

$BackendPath = $env:HIVE_BACKEND_PATH

if (-not $BackendPath) {
  $BackendPath = "C:\Users\jeysa\Desktop\Final Years\hive-backend"
}

if ((Split-Path -Leaf $BackendPath) -ne "hive-backend") {
  $candidateBackendPath = Join-Path $BackendPath "hive-backend"
  if (Test-Path -LiteralPath $candidateBackendPath) {
    $BackendPath = $candidateBackendPath
  }
}

if (-not (Test-Path -LiteralPath $BackendPath)) {
  throw "Backend path not found: $BackendPath"
}

$checks = @(
  @{
    Path = "app\api\chat.py"
    Name = "reranker import"
    Pattern = "from app.rag.reranker import rerank_results"
  },
  @{
    Path = "app\api\chat.py"
    Name = "larger retrieval top-k"
    Pattern = "RERANKED_CONTEXT_TOP_K = 8"
  },
  @{
    Path = "app\api\chat.py"
    Name = "safe reranker helper"
    Pattern = "def _safe_rerank"
  },
  @{
    Path = "app\api\chat.py"
    Name = "source return"
    Pattern = '"sources": _extract_sources(results)'
  },
  @{
    Path = "app\rag\query_router.py"
    Name = "progression routing keywords"
    Pattern = "'progression', 'progress', 'course progression'"
  },
  @{
    Path = "data\kb\rules.yaml"
    Name = "rules progression keyword"
    Pattern = "course progression"
  }
)

$passed = 0

Write-Host "Backend RAG patch status"
Write-Host "Backend: $BackendPath"
Write-Host ""

foreach ($check in $checks) {
  $filePath = Join-Path $BackendPath $check.Path
  if (-not (Test-Path -LiteralPath $filePath)) {
    Write-Host "MISSING $($check.Name): $filePath"
    continue
  }

  $content = Get-Content -LiteralPath $filePath -Raw
  if ($content.Contains($check.Pattern)) {
    $passed += 1
    Write-Host "OK      $($check.Name)"
  } else {
    Write-Host "PENDING $($check.Name)"
  }
}

Write-Host ""
Write-Host "Status: $passed/$($checks.Count) patch markers present"

if ($passed -eq 0) {
  Write-Host "Backend appears unpatched. Run: npm run backend:patch:apply"
  exit 1
}

if ($passed -lt $checks.Count) {
  Write-Host "Backend appears partially patched. Inspect files or restore/apply again."
  exit 1
}

Write-Host "Backend appears patched. Restart backend and run: npm run rag:eval:raw"
