# SkillCRM — LMS + Placement Management System

## Quick Start (Windows)

### First Time Setup
Double-click `SETUP-AND-START.bat`  
That's it — it will install everything and open the app.

### After First Setup
Double-click `START.bat` to launch both servers anytime.

---

## Manual Setup (Step by Step)

### Requirements
- Node.js 18+ → https://nodejs.org
- PostgreSQL 14+ → https://www.postgresql.org/download/windows/

---

### Step 1 — Create Database

Open **Command Prompt** as Administrator and run:

```cmd
psql -U postgres
```

Then paste these commands:

```sql
CREATE DATABASE lms_crm;
CREATE USER lms_user WITH PASSWORD 'lms123';
GRANT ALL PRIVILEGES ON DATABASE lms_crm TO lms_user;
ALTER USER lms_user CREATEDB;
\q
```

---

### Step 2 — Configure Backend

Open `backend\.env` in Notepad and verify:

```env
DATABASE_URL="postgresql://lms_user:lms123@localhost:5432/lms_crm"
JWT_SECRET="skillcrm-super-secret-key-2024-change-in-production"
JWT_EXPIRES_IN="8h"
PORT=5000
NODE_ENV=development
```

If you used a different PostgreSQL password, update `lms123` above.

---

### Step 3 — Start Backend

Open **Command Prompt**, navigate to the project:

```cmd
cd C:\path\to\SkillCRM\backend
npm install
npx prisma generate
npx prisma db push
node src/seed.js
npm run dev
```

You should see:
```
🚀 SkillCRM API running on http://localhost:5000
```

---

### Step 4 — Start Frontend

Open a **second Command Prompt**:

```cmd
cd C:\path\to\SkillCRM\frontend
npm install
npm start
```

Browser opens at **http://localhost:3000**

---

## Login Credentials

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@lms.com       | admin123   |
| HR      | hr@lms.com          | hr123      |
| HR 2    | hr2@lms.com         | hr123      |
| Trainer | trainer@lms.com     | trainer123 |
| Trainer2| trainer2@lms.com    | trainer123 |

---

## Modules Available

### HR Portal
- Dashboard with charts
- Client Management
- Urgent Hiring
- New Client Acquisition
- Job Fair Management (with calendar)
- Candidate Management
- Online Sessions (YouTube/Drive videos)
- Schedule (List + Calendar view)
- Team Chat

### Trainer Portal
- Daily Tracker (check-in/out)
- My Batches
- My Candidates
- Online Sessions
- Schedule
- Job Vacancies

### Admin Portal
- All HR modules
- User Management
- Trainer Attendance Monitoring
- Online Sessions
- Schedule
- Team Chat

---

## Common Problems & Fixes

### "psql is not recognized"
Add PostgreSQL to Windows PATH:
1. Search "Environment Variables" in Windows
2. Edit PATH
3. Add `C:\Program Files\PostgreSQL\16\bin`
4. Restart Command Prompt

### "Port 5000 already in use"
```
In backend\.env change: PORT=5001
In frontend\.env change: REACT_APP_API_URL=http://localhost:5001
```

### "Cannot connect to database"
1. Open Windows Services (search "Services")
2. Find "postgresql-x64-16" (or similar)
3. Right-click → Start

### "npx prisma db push failed"
Make sure your DATABASE_URL in `backend\.env` is correct:
- Username: `lms_user`
- Password: `lms123` (or whatever you set)
- Database: `lms_crm`
- Host: `localhost`
- Port: `5432`

### Re-seed fresh test data
```cmd
cd backend
node src/seed.js
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET/POST | /api/companies | Companies CRUD |
| GET/POST | /api/candidates | Candidates CRUD |
| GET/POST | /api/jobfairs | Job Fairs CRUD |
| GET | /api/dashboard/summary | Dashboard stats |
| GET/POST | /api/sessions | Online Sessions CRUD |
| GET/POST | /api/schedules | Schedule CRUD |
| GET/POST | /api/chat/messages | Team Chat |
| GET/POST | /api/trainer/* | Trainer portal APIs |
| GET/POST | /api/admin/* | Admin portal APIs |

---

## Tech Stack
- **Frontend**: React 18 + Tailwind CSS + Recharts
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (8-hour tokens)
- **File**: Excel import/export (xlsx)
