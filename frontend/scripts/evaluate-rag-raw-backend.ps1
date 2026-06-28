$ErrorActionPreference = "Stop"

$previous = $env:RAG_EVAL_RAW_BACKEND
$env:RAG_EVAL_RAW_BACKEND = "true"

try {
  node scripts/evaluate-rag-accuracy.mjs
  $exitCode = $LASTEXITCODE
} finally {
  if ($null -eq $previous) {
    Remove-Item Env:\RAG_EVAL_RAW_BACKEND -ErrorAction SilentlyContinue
  } else {
    $env:RAG_EVAL_RAW_BACKEND = $previous
  }
}

exit $exitCode
