-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'hr',
    "phone" TEXT,
    "district" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "address" TEXT,
    "district" TEXT,
    "block" TEXT,
    "domain" TEXT,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "totalVacancies" INTEGER NOT NULL DEFAULT 0,
    "hotHiring" BOOLEAN NOT NULL DEFAULT false,
    "lastFollowupDate" DATETIME,
    "nextFollowupDate" DATETIME,
    "remarks" TEXT,
    "isNewClient" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    CONSTRAINT "Company_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobFair" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventName" TEXT NOT NULL,
    "companyName" TEXT,
    "companyId" INTEGER,
    "district" TEXT,
    "block" TEXT,
    "venue" TEXT,
    "vacancyCount" INTEGER NOT NULL DEFAULT 0,
    "domain" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "coordinator" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobFair_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "alternateNumber" TEXT,
    "email" TEXT,
    "gender" TEXT,
    "dateOfBirth" DATETIME,
    "district" TEXT,
    "block" TEXT,
    "address" TEXT,
    "qualification" TEXT,
    "course" TEXT,
    "batch" TEXT,
    "trainerId" INTEGER,
    "passoutDate" DATETIME,
    "placementStatus" TEXT NOT NULL DEFAULT 'Interested',
    "lastFollowupDate" DATETIME,
    "nextFollowupDate" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Candidate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateFollowUp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidateId" INTEGER NOT NULL,
    "followupDate" DATETIME,
    "nextFollowupDate" DATETIME,
    "status" TEXT,
    "remark" TEXT,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateFollowUp_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CandidateFollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainerAttendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "checkinTime" DATETIME,
    "checkoutTime" DATETIME,
    "vdcName" TEXT,
    "district" TEXT,
    "block" TEXT,
    "activityType" TEXT,
    "workDetails" TEXT,
    CONSTRAINT "TrainerAttendance_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchName" TEXT NOT NULL,
    "course" TEXT,
    "domain" TEXT,
    "trainerId" INTEGER,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "district" TEXT,
    "block" TEXT,
    "vdcName" TEXT,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Batch_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidateId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "jobRole" TEXT,
    "joiningDate" DATETIME,
    "salary" REAL,
    "district" TEXT,
    "block" TEXT,
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Joined',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Placement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Placement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_candidateId_key" ON "Candidate"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerAttendance_trainerId_date_key" ON "TrainerAttendance"("trainerId", "date");
