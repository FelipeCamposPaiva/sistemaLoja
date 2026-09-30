#Requires -RunAsAdministrator
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$log = 'C:\Projetos\ERP-TemDeTudo\ops\lab-elevate-install.log'
function Log([string]$m) {
  $line = '{0} {1}' -f (Get-Date -Format 's'), $m
  Add-Content -Path $log -Value $line -Encoding UTF8
  Write-Host $line
}
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
Log 'START'

# --- Markdown: VS Code + Cursor ---
$exts = @('yzhang.markdown-all-in-one', 'DavidAnson.vscode-markdownlint')
$clis = @()
foreach ($c in @(
    "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd",
    'C:\Program Files\Microsoft VS Code\bin\code.cmd',
    "$env:LOCALAPPDATA\Programs\cursor\resources\app\bin\cursor.cmd",
    "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"
  )) {
  if (Test-Path $c) { $clis += $c }
}
$cmdCode = Get-Command code -ErrorAction SilentlyContinue
$cmdCursor = Get-Command cursor -ErrorAction SilentlyContinue
if ($cmdCode) { $clis += $cmdCode.Source }
if ($cmdCursor) { $clis += $cmdCursor.Source }
$clis = $clis | Select-Object -Unique
Log ("editors=" + ($clis -join ';'))
foreach ($cli in $clis) {
  foreach ($ext in $exts) {
    Log "install $ext via $cli"
    if ($cli -match '\.exe$') {
      & $cli --install-extension $ext --force
    } else {
      cmd.exe /d /s /c "`"$cli`" --install-extension $ext --force"
    }
  }
}

# --- Notepad++ ---
$winget = "$env:LOCALAPPDATA\Microsoft\WindowsApps\winget.exe"
if (-not (Test-Path $winget)) { $winget = 'winget' }
Log 'winget upgrade Notepad++'
& $winget install --id Notepad++.Notepad++ -e --accept-package-agreements --accept-source-agreements --disable-interactivity
& $winget upgrade --id Notepad++.Notepad++ -e --accept-package-agreements --accept-source-agreements --disable-interactivity
$npp = 'C:\Program Files\Notepad++\notepad++.exe'
Log ("npp_exists=" + (Test-Path $npp))
$plugDir = 'C:\Program Files\Notepad++\plugins\NppMarkdownPanel'
New-Item -ItemType Directory -Force -Path $plugDir | Out-Null
$zip = Join-Path $env:TEMP 'NppMarkdownPanel.zip'
try {
  Invoke-WebRequest -Uri 'https://github.com/mohzy83/NppMarkdownPanel/releases/latest/download/NppMarkdownPanel-x64.zip' -OutFile $zip -UseBasicParsing
  Expand-Archive -Path $zip -DestinationPath $plugDir -Force
  Log 'NppMarkdownPanel extracted'
} catch {
  Log ("NppMarkdownPanel download failed: " + $_.Exception.Message)
  try {
    Invoke-WebRequest -Uri 'https://github.com/mohzy83/NppMarkdownPanel/releases/download/v0.24.0/NppMarkdownPanel-0.24.0-x64.zip' -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $plugDir -Force
    Log 'NppMarkdownPanel v0.24 extracted'
  } catch {
    Log ("NppMarkdownPanel fallback failed: " + $_.Exception.Message)
  }
}

# --- nginx + dist ---
$ngxRoot = 'C:\nginx'
$ngxZip = Join-Path $env:TEMP 'nginx.zip'
if (-not (Test-Path "$ngxRoot\nginx.exe")) {
  New-Item -ItemType Directory -Force -Path $ngxRoot | Out-Null
  $urls = @(
    'https://nginx.org/download/nginx-1.26.3.zip',
    'https://nginx.org/download/nginx-1.24.0.zip'
  )
  foreach ($u in $urls) {
    try {
      Invoke-WebRequest -Uri $u -OutFile $ngxZip -UseBasicParsing
      $unpack = Join-Path $env:TEMP 'nginx-unpack'
      if (Test-Path $unpack) { Remove-Item $unpack -Recurse -Force }
      Expand-Archive -Path $ngxZip -DestinationPath $unpack -Force
      $inner = Get-ChildItem $unpack -Directory | Select-Object -First 1
      Copy-Item -Path (Join-Path $inner.FullName '*') -Destination $ngxRoot -Recurse -Force
      Log ("nginx from " + $u)
      break
    } catch {
      Log ("nginx download fail " + $u + ' ' + $_.Exception.Message)
    }
  }
}
$conf = @"
worker_processes  1;
error_log  logs/error.log;
pid        logs/nginx.pid;
events { worker_connections  64; }
http {
  include       mime.types;
  default_type  application/octet-stream;
  sendfile        on;
  server {
    listen       8088;
    server_name  localhost;
    root         C:/Projetos/ERP-TemDeTudo/frontend/dist;
    index        index.html;
    location / { try_files `$uri `$uri/ /index.html; }
  }
}
"@
Set-Content -Path "$ngxRoot\conf\nginx.conf" -Value $conf -Encoding ASCII
New-Item -ItemType Directory -Force -Path "$ngxRoot\logs" | Out-Null
Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Process -FilePath "$ngxRoot\nginx.exe" -WorkingDirectory $ngxRoot -WindowStyle Hidden
Start-Sleep -Seconds 2
try {
  $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8088/' -UseBasicParsing -TimeoutSec 10
  Log ("nginx status=" + $r.StatusCode + " title_ok=" + ($r.Content -match 'ERP Tem de Tudo'))
} catch {
  Log ("nginx curl fail: " + $_.Exception.Message)
}

# --- Windows checkup (no reboot) ---
try { Update-MpSignature; Log 'Defender signature updated' } catch { Log ("Defender: " + $_.Exception.Message) }
try {
  $s = Get-MpComputerStatus
  Log ("AV enabled=" + $s.AntivirusEnabled + " age_hours=" + $s.AntivirusSignatureAge)
} catch { Log ("MpStatus: " + $_.Exception.Message) }
try { UsoClient.exe StartScan; Log 'UsoClient StartScan' } catch { Log ("UsoClient: " + $_.Exception.Message) }
try { UsoClient.exe StartDownload; Log 'UsoClient StartDownload' } catch {}
try { UsoClient.exe StartInstall; Log 'UsoClient StartInstall' } catch {}
Log 'chkdsk /scan (online)'
$chk = & chkdsk.exe C: /scan 2>&1 | Out-String
Log ($chk.Substring(0, [Math]::Min(4000, $chk.Length)))
if ($chk -match 'found|corrupt|found problems|encontr') {
  Log 'Scheduling chkdsk /F on next reboot (dirty bit) — not rebooting now'
  cmd.exe /d /c 'echo y| chkntfs /c C:'
}

Log 'DONE no reboot'
