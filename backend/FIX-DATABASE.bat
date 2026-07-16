@echo off
cd /d "%~dp0"
echo ============================================
echo  LMS-CRM Database Setup (PostgreSQL)
echo ============================================
echo.
echo [1/3] Regenerating Prisma client...
call npx prisma generate
if errorlevel 1 goto :error

echo.
echo [2/3] Resetting database schema...
call npx prisma db push --force-reset
if errorlevel 1 goto :error

echo.
echo [3/3] Seeding demo data and users...
call node src\seed.js
if errorlevel 1 goto :error

echo.
echo ============================================
echo  DONE! Starting the backend server...
echo  Login: admin@lms.com / admin123
echo ============================================
call npm run dev
goto :eof

:error
echo.
echo ############################################
echo  FAILED. Most likely PostgreSQL is not
echo  running, or the credentials in .env are
echo  wrong (lms_user / lms123, db lms_crm).
echo  Check backend\.env DATABASE_URL.
echo ############################################
pause
