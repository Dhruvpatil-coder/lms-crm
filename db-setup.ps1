#Requires -RunAsAdministrator
# SkillCRM - Database Setup (No Password Required)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  SkillCRM - Database Setup (Auto-Fix)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# ── Find PostgreSQL ───────────────────────────
$pgVersion = $null
$pgDataDir = $null
$pgBinDir = $null
$pgService = $null

for ($v = 20; $v -ge 13; $v--) {
    $pgPath = "C:\Program Files\PostgreSQL\$v"
    if (Test-Path "$pgPath\bin\psql.exe") {
        $pgVersion = $v
        $pgBinDir = "$pgPath\bin"
        $pgDataDir = "$pgPath\data"
        $pgService = "postgresql-x64-$v"
        break
    }
}

if (-not $pgVersion) {
    Write-Host "ERROR: PostgreSQL not found!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Found PostgreSQL $pgVersion" -ForegroundColor Green
Write-Host "  Bin:  $pgBinDir" -ForegroundColor Gray
Write-Host "  Data: $pgDataDir" -ForegroundColor Gray
Write-Host ""

$env:PATH = "$pgBinDir;$env:PATH"
$pgHba = Join-Path $pgDataDir "pg_hba.conf"
$pgHbaBackup = "$pgHba.bak"

# ── Step 1: Backup pg_hba.conf ────────────────
Write-Host "[1/6] Backing up pg_hba.conf..." -ForegroundColor Yellow
Copy-Item -Path $pgHba -Destination $pgHbaBackup -Force -ErrorAction SilentlyContinue
Write-Host "  OK" -ForegroundColor Green

# ── Step 2: Temporarily switch to trust auth ────
Write-Host "[2/6] Switching to trust auth (local only)..." -ForegroundColor Yellow
$hbaContent = Get-Content $pgHba -Raw

# Replace scram-sha-256 / md5 / password with trust for local/localhost connections only
$hbaContent = $hbaContent -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)\w+', '${1}trust'
$hbaContent = $hbaContent -replace '(host\s+all\s+all\s+::1/128\s+)\w+', '${1}trust'
$hbaContent | Set-Content $pgHba -NoNewline

Write-Host "  OK - Local connections now use trust auth" -ForegroundColor Green

# ── Step 3: Restart PostgreSQL ────────────────
Write-Host "[3/6] Restarting PostgreSQL..." -ForegroundColor Yellow
$service = Get-Service -Name $pgService -ErrorAction SilentlyContinue
if ($service) {
    Restart-Service -Name $pgService -Force
    Start-Sleep -Seconds 3
    Write-Host "  OK - PostgreSQL restarted" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Could not find service $pgService" -ForegroundColor Yellow
    Write-Host "  Please restart PostgreSQL manually from Services" -ForegroundColor Yellow
}

# ── Step 4: Create DB + User ──────────────────
Write-Host "[4/6] Creating database and user..." -ForegroundColor Yellow
$env:PGPASSWORD = ""

$setupSql = @"
DROP DATABASE IF EXISTS lms_crm;
CREATE DATABASE lms_crm;
DROP USER IF EXISTS lms_user;
CREATE USER lms_user WITH PASSWORD 'lms123';
GRANT ALL PRIVILEGES ON DATABASE lms_crm TO lms_user;
ALTER USER lms_user CREATEDB;
GRANT ALL ON SCHEMA public TO lms_user;
ALTER DATABASE lms_crm OWNER TO lms_user;
"@

$setupSql | psql -U postgres -w -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Database setup failed" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  OK - Database and user created" -ForegroundColor Green

# ── Step 5: Push Prisma schema ────────────────
Write-Host "[5/6] Pushing Prisma schema..." -ForegroundColor Yellow
$backend = Join-Path $PSScriptRoot "backend"
Set-Location $backend

npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: prisma generate failed" -ForegroundColor Red; pause; exit 1 }

npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: prisma db push failed" -ForegroundColor Red; pause; exit 1 }

Write-Host "  OK - Schema pushed" -ForegroundColor Green

# ── Step 6: Seed data ─────────────────────────
Write-Host "[6/6] Seeding test data..." -ForegroundColor Yellow
node src/seed.js
Write-Host "  OK - Seed data loaded" -ForegroundColor Green

# ── Restore pg_hba.conf ───────────────────────
Write-Host ""
Write-Host "Restoring pg_hba.conf..." -ForegroundColor Yellow
Copy-Item -Path $pgHbaBackup -Destination $pgHba -Force -ErrorAction SilentlyContinue
Restart-Service -Name $pgService -Force
Start-Sleep -Seconds 2
Write-Host "  OK - Authentication restored" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Now run START.bat to launch the servers." -ForegroundColor Cyan
Write-Host ""
pause
