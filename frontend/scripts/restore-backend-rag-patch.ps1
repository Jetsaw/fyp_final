param(
  [string]$BackupPath
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

if (-not (Test-Path -LiteralPath $BackendPath)) {
  throw "Backend path not found: $BackendPath"
}

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

if (-not $BackupPath) {
  $latestBackup = Get-ChildItem -LiteralPath $BackendPath -Directory -Filter "rag_accuracy_patch_backup_*" |
    Sort-Object Name -Descending |
    Select-Object -First 1

  if (-not $latestBackup) {
    throw "No rag_accuracy_patch_backup_* folder found in $BackendPath"
  }

  $BackupPath = $latestBackup.FullName
}

if (-not (Test-Path -LiteralPath $BackupPath)) {
  throw "Backup path not found: $BackupPath"
}

$backupRoot = Resolve-Path -LiteralPath $BackupPath
$files = Get-ChildItem -LiteralPath $backupRoot -File -Recurse

if ($files.Count -eq 0) {
  throw "Backup contains no files: $backupRoot"
}

foreach ($file in $files) {
  $relativePath = Get-PortableRelativePath -Root $backupRoot -Path $file.FullName
  $targetPath = Join-Path $BackendPath $relativePath
  $targetDir = Split-Path -Parent $targetPath

  if (-not (Test-Path -LiteralPath $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  }

  Copy-Item -LiteralPath $file.FullName -Destination $targetPath -Force
  Write-Host "RESTORED $targetPath"
}

Write-Host "Restored backend files from $backupRoot"
