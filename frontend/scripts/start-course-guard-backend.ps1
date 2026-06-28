param(
  [int]$Port = 8010,
  [string]$BackendPath = "C:\Users\jeysa\Desktop\Final Years\hive-backend",
  [string]$WslPython = "/home/jet/fyp-unsloth/.venv/bin/python"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
  throw "wsl.exe is required to start the verified course guard backend."
}

if (-not (Test-Path -LiteralPath $BackendPath)) {
  throw "Backend path not found: $BackendPath"
}

$backendWslPath = (wsl.exe wslpath -a "$BackendPath").Trim()
$logPath = "/tmp/hive_course_guard_$Port.log"
$pidPath = "/tmp/hive_course_guard_$Port.pid"

$dollar = '$'
$command = "if ss -ltn | grep -q ':$Port '; then echo 'Course guard backend already listening on port $Port'; else cd '$backendWslPath' && nohup '$WslPython' -m uvicorn app.course_guard_server:app --host 0.0.0.0 --port $Port > '$logPath' 2>&1 & echo ${dollar}! > '$pidPath'; echo 'Started course guard backend on port $Port'; sleep 2; tail -40 '$logPath' || true; fi"

wsl.exe bash -lc $command
