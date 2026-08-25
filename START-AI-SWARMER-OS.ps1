$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundledNode = 'C:\Users\wilke\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node -and (Test-Path -LiteralPath $bundledNode)) { $node = $bundledNode }
if (-not $node) { throw 'Node.js 22.5 or newer is required.' }

$existing = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if (-not $existing) {
  $dataDir = Join-Path $projectRoot 'data'
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $node
  $startInfo.Arguments = 'src/server.js'
  $startInfo.WorkingDirectory = $projectRoot
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  # Rebuild the child environment case-insensitively to avoid duplicate Path/PATH entries.
  $environment = [System.Collections.Generic.Dictionary[string,string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  Get-ChildItem Env: | ForEach-Object { $environment[$_.Name] = $_.Value }
  $startInfo.Environment.Clear()
  foreach ($entry in $environment.GetEnumerator()) { $startInfo.Environment[$entry.Key] = $entry.Value }
  $process = [System.Diagnostics.Process]::Start($startInfo)
  Start-Sleep -Seconds 1
  try { Invoke-RestMethod 'http://127.0.0.1:8080/health' | Out-Null }
  catch {
    $errorText = $process.StandardError.ReadToEnd()
    throw "AI SWARMER OS failed to start. $errorText"
  }
}

$browserStart = [System.Diagnostics.ProcessStartInfo]::new('http://127.0.0.1:8080/')
$browserStart.UseShellExecute = $true
[System.Diagnostics.Process]::Start($browserStart) | Out-Null
Write-Host 'AI SWARMER OS is running at http://127.0.0.1:8080/' -ForegroundColor Cyan
