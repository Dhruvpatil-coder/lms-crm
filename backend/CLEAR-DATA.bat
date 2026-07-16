@echo off
cd /d "%~dp0"
echo Clearing all data (users are kept)...
node clear-data.js
pause
