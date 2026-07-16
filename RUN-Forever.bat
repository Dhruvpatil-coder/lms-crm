@echo off
cd /d "C:\Users\dhruv\OneDrive\Documents\Git hub\lms-crm-complete.tar\lms-crm"

echo [1/3] Stopping old servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Clearing React cache...
rd /s /q "frontend\node_modules\.cache" 2>nul

echo [3/3] Starting BOTH servers in new windows...
start "SkillCRM BACKEND" cmd /k "cd /d "%~dp0backend" && node src/index.js"
timeout /t 3 /nobreak >nul
start "SkillCRM FRONTEND" cmd /k "cd /d "%~dp0frontend" && set PATH=C:\Program Files\nodejs;%%PATH%% && npm start"

echo.
echo ==========================================
echo   SERVERS STARTED - Runs FOREVER
echo ==========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Wait for "Compiled successfully!" then
echo open browser to http://localhost:3000
echo.
echo Login: hr@lms.com / hr123
echo.
pause
