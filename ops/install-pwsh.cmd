@echo off
setlocal
set "MSI=%TEMP%\PowerShell-7.6.5-win-x64.msi"
set "URL=https://github.com/PowerShell/PowerShell/releases/download/v7.6.5/PowerShell-7.6.5-win-x64.msi"
set "LOG=C:\Projetos\ERP-TemDeTudo\ops\install-pwsh.log"
echo %DATE% %TIME% START> "%LOG%"

where pwsh >nul 2>&1
if %ERRORLEVEL%==0 (
  echo pwsh already on PATH>> "%LOG%"
  pwsh -NoLogo -NoProfile -Command "$PSVersionTable.PSVersion.ToString()">> "%LOG%" 2>&1
)

echo downloading>> "%LOG%"
curl.exe -L --retry 3 --fail -o "%MSI%" "%URL%" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo curl failed>> "%LOG%"
  exit /b 1
)

echo msiexec>> "%LOG%"
msiexec.exe /i "%MSI%" /qn /norestart ADD_PATH=1 REGISTER_MANIFEST=1 ENABLE_MU=1 USE_MU=1 ENABLE_PSREMOTING=0 ADD_EXPLORER_CONTEXT_MENU_OPENPOWERSHELL=1 ADD_FILE_CONTEXT_MENU_RUNPOWERSHELL=1 /L*v "%TEMP%\pwsh7-msi.log"
echo msiexec_exit=%ERRORLEVEL%>> "%LOG%"

if exist "C:\Program Files\PowerShell\7\pwsh.exe" (
  echo INSTALLED>> "%LOG%"
  "C:\Program Files\PowerShell\7\pwsh.exe" -NoLogo -NoProfile -Command "[pscustomobject]@{PS=$PSVersionTable.PSVersion.ToString();Edition=$PSVersionTable.PSEdition} | Format-List | Out-String"
) else (
  echo MISSING_EXE>> "%LOG%"
  exit /b 2
)
endlocal
