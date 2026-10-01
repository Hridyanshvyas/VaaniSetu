@echo off
cd /d "%~dp0"
set "PYTHONPATH=%~dp0;%PYTHONPATH%"

echo =======================================================
echo          VaaniSetu Stack Launcher
echo =======================================================
echo.

if exist "%~dp0.venv\Scripts\python.exe" (
    "%~dp0.venv\Scripts\python.exe" "%~dp0start_backend.py"
) else (
    python "%~dp0start_backend.py"
)

pause
