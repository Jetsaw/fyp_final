param(
  [Parameter(Mandatory = $true)]
  [string]$MacUser,

  [Parameter(Mandatory = $true)]
  [string]$MacHost,

  [string]$Domain = "hive.yourdomain.com",

  [switch]$InstallServices,

  [switch]$PreflightOnly
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ArchivePath = Join-Path $env:USERPROFILE "Desktop\hive-project.tar.gz"
$Remote = "$MacUser@$MacHost"

Push-Location $RepoRoot
try {
  if ($PreflightOnly) {
    $preflight = @"
set -euo pipefail
if [ -f ~/hive/deploy/macmini/preflight-macmini.sh ]; then
  bash ~/hive/deploy/macmini/preflight-macmini.sh
else
  echo "Project is not installed at ~/hive yet. Checking base tools only."
  command -v brew
  command -v python3.11
  command -v node
  command -v npm
  command -v caddy
  command -v cloudflared
fi
"@
    $preflight | ssh $Remote "bash -s"
    return
  }

  powershell -NoProfile -ExecutionPolicy Bypass -File ".\deploy\macmini\pack-for-mac.ps1" -OutputPath $ArchivePath

  scp $ArchivePath "${Remote}:~/hive-project.tar.gz"

  $remoteScript = @"
set -euo pipefail
rm -rf ~/hive
mkdir -p ~/hive
tar -xzf ~/hive-project.tar.gz -C ~/hive
cd ~/hive
bash deploy/macmini/install-macmini.sh '$Domain'
"@

  if ($InstallServices) {
    $remoteScript += @"

bash ~/hive/deploy/macmini/install-services.sh
"@
  }

  if ($InstallServices) {
    $remoteScript += @"

echo
echo "Local smoke test:"
bash ~/hive/deploy/macmini/smoke-test.sh
"@
  } else {
    $remoteScript += @"

echo
echo "Installed files only. Re-run with -InstallServices or run bash ~/hive/deploy/macmini/install-services.sh on the Mac."
"@
  }

  $remoteScript | ssh $Remote "bash -s"

  Write-Host ""
  Write-Host "Deployed to Mac mini at $Remote"
  Write-Host "Local app target on Mac: http://127.0.0.1:8080"
  Write-Host "Public domain target: https://$Domain"
  Write-Host "Next on Mac: cloudflared tunnel login; bash ~/hive/deploy/macmini/setup-cloudflare-tunnel.sh $Domain"
} finally {
  Pop-Location
}
