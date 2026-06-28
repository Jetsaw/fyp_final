param(
  [switch]$CheckOnly
)

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

$backupRoot = Join-Path $BackendPath ("rag_accuracy_patch_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$backedUpFiles = @{}

function Get-PortableRelativePath {
  param(
    [Parameter(Mandatory = $true)][string]$Root,
    [Parameter(Mandatory = $true)][string]$Path
  )

  $rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
  $pathFull = [System.IO.Path]::GetFullPath($Path)
  $prefix = $rootFull + [System.IO.Path]::DirectorySeparatorChar

  if (-not $pathFull.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path is outside root. Root: $rootFull Path: $pathFull"
  }

  return $pathFull.Substring($prefix.Length)
}

function Backup-File {
  param(
    [Parameter(Mandatory = $true)][string]$Path
  )

  if ($CheckOnly -or $backedUpFiles.ContainsKey($Path)) {
    return
  }

  $relativePath = Get-PortableRelativePath -Root $BackendPath -Path $Path
  $backupPath = Join-Path $backupRoot $relativePath
  $backupDir = Split-Path -Parent $backupPath

  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  Copy-Item -LiteralPath $Path -Destination $backupPath -Force
  $backedUpFiles[$Path] = $backupPath
}

if (-not (Test-Path -LiteralPath $BackendPath)) {
  throw "Backend path not found: $BackendPath"
}

function Update-TextFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Find,
    [Parameter(Mandatory = $true)][string]$Replace
  )

  $text = (Get-Content -LiteralPath $Path -Raw) -replace "`r`n", "`n"
  $Find = $Find -replace "`r`n", "`n"
  $Replace = $Replace -replace "`r`n", "`n"
  if ($text.Contains($Replace)) {
    return
  }
  if (-not $text.Contains($Find)) {
    throw "Expected snippet not found in $Path"
  }
  if ($CheckOnly) {
    Write-Host "CHECK $Path"
    return
  }
  Backup-File -Path $Path
  $text = $text.Replace($Find, $Replace)
  Set-Content -LiteralPath $Path -Value $text -NoNewline
}

$chatPath = Join-Path $BackendPath "app\api\chat.py"
$routerPath = Join-Path $BackendPath "app\rag\query_router.py"
$rulesPath = Join-Path $BackendPath "data\kb\rules.yaml"

Update-TextFile -Path $chatPath -Find @'
from app.rag.retriever import search_structure_layer, search_details_layer
from app.rag.query_router import route_query
'@ -Replace @'
from app.rag.retriever import search_structure_layer, search_details_layer
from app.rag.reranker import rerank_results
from app.rag.query_router import route_query
'@

Update-TextFile -Path $chatPath -Find @'
MAX_CONTEXT_CHUNKS = 6
STRUCTURE_LAYER_TOP_K = 3
DETAILS_LAYER_TOP_K = 3
'@ -Replace @'
MAX_CONTEXT_CHUNKS = 8
STRUCTURE_LAYER_TOP_K = 10
DETAILS_LAYER_TOP_K = 10
RERANKED_CONTEXT_TOP_K = 8
'@

Update-TextFile -Path $chatPath -Find @'
REFLECTION_AGENT = ReflectionAgent()


class ChatReq(BaseModel):
'@ -Replace @'
REFLECTION_AGENT = ReflectionAgent()


def _safe_rerank(question: str, results: list[dict], top_k: int) -> list[dict]:
    """Use the existing cross-encoder reranker, but keep the API alive if it cannot load."""
    if not results:
        return []
    try:
        return rerank_results(question, results, top_k=top_k)
    except Exception as exc:
        print(f"[WARN] Reranking skipped: {exc}")
        return sorted(results, key=lambda item: item.get("score", 0.0), reverse=True)[:top_k]


def _format_context_chunk(result: dict) -> str:
    layer = result.get("layer")
    text = result.get("text", "")
    if layer == "structure":
        return f"[STRUCTURE] {text}"
    if layer == "details":
        return f"[DETAILS - {result.get('course_code', 'N/A')}] {text}"
    return text


def _extract_sources(results: list[dict]) -> list[dict]:
    sources = []
    seen = set()
    for result in results:
        source = (
            result.get("source")
            or result.get("source_file")
            or result.get("metadata", {}).get("source")
            or result.get("metadata", {}).get("source_file")
            or result.get("id")
        )
        key = (source, result.get("page"), result.get("course_code"), result.get("layer"))
        if not source or key in seen:
            continue
        seen.add(key)
        sources.append({
            "source": source,
            "page": result.get("page"),
            "course_code": result.get("course_code"),
            "layer": result.get("layer"),
            "score": result.get("score"),
        })
    return sources


class ChatReq(BaseModel):
'@

Update-TextFile -Path $chatPath -Find @'
            "topics", "cover", "lab", "how is", "does", "how many"
'@ -Replace @'
            "topics", "cover", "lab", "how is", "does", "how many",
            "progression", "course structure", "study plan"
'@

Update-TextFile -Path $chatPath -Find @'
    results = []
    context_parts = []
    
'@ -Replace @'
    results = []
    
'@

Update-TextFile -Path $chatPath -Find @'
        results.extend(structure_results)
        
        for r in structure_results:
            context_parts.append(f"[STRUCTURE] {r.get('text', '')}")
    
'@ -Replace @'
        results.extend(structure_results)
    
'@

Update-TextFile -Path $chatPath -Find @'
        results.extend(details_results)
        
        for r in details_results:
            context_parts.append(f"[DETAILS - {r.get('course_code', 'N/A')}] {r.get('text', '')}")
    
'@ -Replace @'
        results.extend(details_results)
    
    if results:
        results = _safe_rerank(question, results, top_k=RERANKED_CONTEXT_TOP_K)
        context_parts = [_format_context_chunk(result) for result in results[:MAX_CONTEXT_CHUNKS]]
    else:
        context_parts = []
    
'@

Update-TextFile -Path $chatPath -Find @'
    return {
        "answer": response["answer"],
        "trace": trace.to_dict(),
'@ -Replace @'
    return {
        "answer": response["answer"],
        "sources": _extract_sources(results),
        "used_rag": bool(context),
        "trace": trace.to_dict(),
'@

Update-TextFile -Path $routerPath -Find @'
        structure_keywords = [
            'term', 'trimester', 'semester', 'year',
            'when can i take', 'what subjects', 'what courses',
            'course list', 'schedule', 'programme structure'
        ]
'@ -Replace @'
        structure_keywords = [
            'term', 'trimester', 'semester', 'year',
            'when can i take', 'what subjects', 'what courses',
            'course list', 'schedule', 'programme structure',
            'progression', 'progress', 'course progression',
            'study sequence', 'study plan', 'credit hours',
            'total credits', 'programme plan'
        ]
'@

Update-TextFile -Path $routerPath -Find @'
        eligibility_keywords = [
            'can i take', 'prerequisite', 'requirement', 'eligible',
            'before taking', 'need to complete'
        ]
'@ -Replace @'
        eligibility_keywords = [
            'can i take', 'prerequisite', 'requirement', 'eligible',
            'before taking', 'need to complete', 'progression'
        ]
'@

Update-TextFile -Path $rulesPath -Find @'
  - study plan
  - what subjects
'@ -Replace @'
  - study plan
  - progression
  - course progression
  - programme plan
  - credit hours
  - what subjects
'@

Update-TextFile -Path $rulesPath -Find @'
    - study plan
    - what subjects
'@ -Replace @'
    - study plan
    - progression
    - course progression
    - programme plan
    - credit hours
    - what subjects
'@

Update-TextFile -Path $rulesPath -Find @'
      - study plan
      - what subjects
'@ -Replace @'
      - study plan
      - progression
      - course progression
      - programme plan
      - credit hours
      - what subjects
'@

if ($CheckOnly) {
  Write-Host "Backend RAG accuracy edits can be applied to $BackendPath"
} else {
  Write-Host "Applied backend RAG accuracy edits to $BackendPath"
  if ($backedUpFiles.Count -gt 0) {
    Write-Host "Backups written to $backupRoot"
  }
  Write-Host "Restart the FastAPI backend, then run npm run rag:eval from the frontend."
}
