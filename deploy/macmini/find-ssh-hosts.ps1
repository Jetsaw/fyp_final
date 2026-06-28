param(
  [int]$Port = 22,
  [int]$TimeoutMs = 250
)

$ErrorActionPreference = "Stop"

$ip = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } |
  Select-Object -First 1 -ExpandProperty IPv4Address |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  throw "Could not find an active IPv4 network adapter."
}

$prefix = ($ip -split '\.')[0..2] -join '.'
Write-Host "Scanning $prefix.1-254 for SSH port $Port ..."

1..254 | ForEach-Object {
  $hostIp = "$prefix.$_"
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $async = $client.BeginConnect($hostIp, $Port, $null, $null)
    if ($async.AsyncWaitHandle.WaitOne($TimeoutMs) -and $client.Connected) {
      $name = try { ([System.Net.Dns]::GetHostEntry($hostIp)).HostName } catch { "" }
      [pscustomobject]@{
        IP = $hostIp
        Hostname = $name
      }
    }
  } finally {
    $client.Close()
  }
} | Format-Table -AutoSize

