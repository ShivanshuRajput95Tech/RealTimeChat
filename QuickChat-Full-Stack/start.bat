@echo off
echo ========================================
echo   QuickChat - AI Communication Platform
echo ========================================
echo.
echo Starting servers...
echo.

echo [1/2] Starting Backend Server (port 5000)...
start "QuickChat Server" cmd /k "cd /d "%~dp0server" && npm run server"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend (port 5173)...
start "QuickChat Client" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ========================================
echo   Both servers starting...
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
pause
