const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const toDate = (d) => {
  if (!d || d === '') return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const toNum = (n) => {
  if (n === null || n === undefined || n === '') return null;
  const num = Number(n);
  return isNaN(num) ? null : num;
};

// Smart column mapping for ANY format
function findColumn(row, possibleNames) {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const exact = keys.find(k => k.trim() === name);
    if (exact !== undefined) return exact;
    const ci = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (ci !== undefined) return ci;
  }
  for (const name of possibleNames) {
    const fuzzy = keys.find(k => k.trim().toLowerCase().includes(name.toLowerCase()));
    if (fuzzy !== undefined) return fuzzy;
  }
  return null;
}

function getVal(row, possibleNames) {
  const col = findColumn(row, possibleNames);
  if (!col) return '';
  const val = row[col];
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function getNum(row, possibleNames) {
  const col = findColumn(row, possibleNames);
  if (!col) return 0;
  const val = row[col];
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function getDate(row, possibleNames) {
  const col = findColumn(row, possibleNames);
  if (!col) return null;
  const val = row[col];
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

const fmt = (c) => ({
  id: c.id, candidateId: c.candidateId, fullName: c.fullName,
  mobileNumber: c.mobileNumber, alternateNumber: c.alternateNumber, whatsappNumber: c.whatsappNumber,
  email: c.email, gender: c.gender, dateOfBirth: c.dateOfBirth,
  state: c.state, district: c.district, block: c.block, address: c.address,
  qualification: c.qualification, course: c.course, batch: c.batch, month: c.month,
  domain: c.domain, trainerId: c.trainerId, trainerName: c.trainer?.name || null,
  donorId: c.donorId, passoutDate: c.passoutDate, batchStartDate: c.batchStartDate, batchEndDate: c.batchEndDate,
  caste: c.caste, aadharCard: c.aadharCard, beforeCourseEmploymentStatus: c.beforeCourseEmploymentStatus,
  batchStatus: c.batchStatus, employmentAfterCourse: c.employmentAfterCourse,
  companyName: c.companyName, companyAddress: c.companyAddress,
  salary: c.salary, monthlyEarning: c.monthlyEarning,
  location: c.location, businessName: c.businessName, helper: c.helper,
  document: c.document, remark: c.remark,
  placementStatus: c.placementStatus,
  lastFollowupDate: c.lastFollowupDate, nextFollowupDate: c.nextFollowupDate,
  createdAt: c.createdAt
});

const REGION_DISTRICTS = {
  'Central Bihar': ['Patna','Nalanda'],
  'North Bihar': ['Muzaffarpur','Vaishali','Darbhanga'],
  'South Bihar': ['Gaya','Bhagalpur'],
  'Other': ['Other']
};

function getRegionWhere(region) {
  if (!region) return null;
  const districts = REGION_DISTRICTS[region];
  if (!districts) return null;
  return { district: { in: districts } };
}

router.get('/', authenticate, async (req, res) => {
  const { search, course, batch, district, block, status, gender, trainerId, region, donorId, state, limit = 200, skip = 0 } = req.query;
  const where = { isDeleted: false };
  if (req.user.role === 'trainer') where.trainerId = req.user.id;
  if (search) where.OR = [{ fullName: { contains: search } }, { mobileNumber: { contains: search } }];
  if (course) where.course = course;
  if (batch) where.batch = batch;
  if (district) where.district = district;
  if (block) where.block = block;
  if (status) where.placementStatus = status;
  if (gender) where.gender = gender;
  if (state) where.state = state;
  if (trainerId) where.trainerId = +trainerId;
  if (donorId) where.donorId = +donorId;
  const regionWhere = getRegionWhere(region);
  if (regionWhere) {
    if (where.district) {
      const regionDistricts = REGION_DISTRICTS[region];
      where.district = { in: regionDistricts.filter(d => d === where.district) };
    } else {
      where.district = { in: REGION_DISTRICTS[region] };
    }
  }

  const [total, data] = await Promise.all([
    prisma.candidate.count({ where }),
    prisma.candidate.findMany({ where, include: { trainer: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: +limit, skip: +skip })
  ]);
  res.json({ total, data: data.map(fmt) });
});

router.post('/', authenticate, async (req, res) => {
  const count = await prisma.candidate.count();
  const candidateId = `CND${1000 + count + 1}`;
  const { dateOfBirth, passoutDate, batchStartDate, batchEndDate, lastFollowupDate, nextFollowupDate, trainerId, donorId, salary, monthlyEarning, id, createdAt, ...rest } = req.body;
  const c = await prisma.candidate.create({
    data: {
      ...rest, candidateId,
      dateOfBirth: toDate(dateOfBirth),
      passoutDate: toDate(passoutDate),
      batchStartDate: toDate(batchStartDate),
      batchEndDate: toDate(batchEndDate),
      lastFollowupDate: toDate(lastFollowupDate),
      nextFollowupDate: toDate(nextFollowupDate),
      trainerId: trainerId ? +trainerId : null,
      donorId: donorId ? +donorId : null,
      salary: toNum(salary),
      monthlyEarning: toNum(monthlyEarning)
    },
    include: { trainer: { select: { name: true } } }
  });
  res.json(fmt(c));
});

router.put('/:id', authenticate, async (req, res) => {
  const { dateOfBirth, passoutDate, batchStartDate, batchEndDate, lastFollowupDate, nextFollowupDate, trainerId, donorId, salary, monthlyEarning, id, createdAt, trainer, trainerName, candidateId, ...rest } = req.body;
  const c = await prisma.candidate.update({
    where: { id: +req.params.id },
    data: {
      ...rest,
      dateOfBirth: toDate(dateOfBirth),
      passoutDate: toDate(passoutDate),
      batchStartDate: toDate(batchStartDate),
      batchEndDate: toDate(batchEndDate),
      lastFollowupDate: toDate(lastFollowupDate),
      nextFollowupDate: toDate(nextFollowupDate),
      trainerId: trainerId ? +trainerId : null,
      donorId: donorId ? +donorId : null,
      salary: toNum(salary),
      monthlyEarning: toNum(monthlyEarning)
    },
    include: { trainer: { select: { name: true } } }
  });
  res.json(fmt(c));
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.candidate.update({ where: { id: +req.params.id }, data: { isDeleted: true } });
  res.json({ message: 'Deleted' });
});

router.post('/:id/followup', authenticate, async (req, res) => {
  const { followupDate, nextFollowupDate, status, remark } = req.body;
  await prisma.candidateFollowUp.create({
    data: { candidateId: +req.params.id, followupDate: toDate(followupDate), nextFollowupDate: toDate(nextFollowupDate), status, remark, createdById: req.user.id }
  });
  await prisma.candidate.update({
    where: { id: +req.params.id },
    data: { placementStatus: status, lastFollowupDate: toDate(followupDate), nextFollowupDate: toDate(nextFollowupDate) }
  });
  res.json({ message: 'Follow-up added' });
});

router.get('/:id/followups', authenticate, async (req, res) => {
  const fus = await prisma.candidateFollowUp.findMany({
    where: { candidateId: +req.params.id }, orderBy: { createdAt: 'desc' }
  });
  res.json(fus);
});

router.post('/bulk/status', authenticate, async (req, res) => {
  const { candidateIds, placementStatus } = req.body;
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ error: 'candidateIds must be a non-empty array' });
  }
  if (!placementStatus) return res.status(400).json({ error: 'placementStatus is required' });
  await prisma.candidate.updateMany({ where: { id: { in: candidateIds } }, data: { placementStatus } });
  res.json({ updated: candidateIds.length });
});

router.get('/export/excel', authenticate, async (req, res) => {
  const { default: xlsx } = await import('xlsx');
  const candidates = await prisma.candidate.findMany({ where: { isDeleted: false } });
  const rows = candidates.map(c => ({
    'Full Name': c.fullName,
    'Mobile Number': c.mobileNumber,
    'Alternate Number': c.alternateNumber,
    'WhatsApp Number': c.whatsappNumber,
    'Email': c.email,
    'Gender': c.gender,
    'Date of Birth': c.dateOfBirth?.toISOString().split('T')[0] || '',
    'State': c.state,
    'District': c.district,
    'Block': c.block,
    'Address': c.address,
    'Qualification': c.qualification,
    'Course': c.course,
    'Batch': c.batch,
    'Month': c.month,
    'Domain': c.domain,
    'Caste': c.caste,
    'Aadhar Card': c.aadharCard,
    'Before Course Employment': c.beforeCourseEmploymentStatus,
    'Batch Start Date': c.batchStartDate?.toISOString().split('T')[0] || '',
    'Batch End Date': c.batchEndDate?.toISOString().split('T')[0] || '',
    'Batch Status': c.batchStatus,
    'Employment After Course': c.employmentAfterCourse,
    'Placement Status': c.placementStatus,
    'Company Name': c.companyName,
    'Company Address': c.companyAddress,
    'Salary': c.salary,
    'Monthly Earning': c.monthlyEarning,
    'Location': c.location,
    'Business Name': c.businessName,
    'Helper': c.helper,
    'Document': c.document,
    'Remark': c.remark,
    'Last Follow-up': c.lastFollowupDate?.toISOString().split('T')[0] || '',
    'Next Follow-up': c.nextFollowupDate?.toISOString().split('T')[0] || '',
  }));
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rows), 'Candidates');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=candidates.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// SMART IMPORT — handles ANY column format from any sheet
router.post('/import/excel', authenticate, upload.single('file'), async (req, res) => {
  const { default: xlsx } = await import('xlsx');
  const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
  let count = 0;
  let skipped = 0;

  for (const sheetName of wb.SheetNames) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
    if (rows.length === 0) continue;
    const firstRow = rows[0];
    const hasName = findColumn(firstRow, ['Full Name', 'fullName', 'Name', 'Candidate Name', 'Student Name', 'Person Name']);
    if (!hasName) continue;

    for (const row of rows) {
      const fullName = getVal(row, ['Full Name', 'fullName', 'Name', 'Candidate Name', 'Student Name', 'Person Name']);
      if (!fullName) { skipped++; continue; }
      if (fullName.toLowerCase().includes('name') || fullName.toLowerCase().includes('full')) {
        skipped++; continue;
      }

      const candidateId = 'CAND' + Date.now() + Math.floor(Math.random() * 1000);
      await prisma.candidate.create({
        data: {
          candidateId, fullName,
          mobileNumber: getVal(row, ['Mobile Number', 'mobileNumber', 'Mobile', 'Phone', 'Contact Number', 'Mobile No', 'Phone Number', 'Contact No']),
          alternateNumber: getVal(row, ['Alternate Number', 'alternateNumber', 'Alt Phone', 'Alt Mobile']),
          whatsappNumber: getVal(row, ['WhatsApp Number', 'whatsappNumber', 'WhatsApp', 'WA Number']),
          email: getVal(row, ['Email', 'email', 'Email ID', 'Email Address', 'Mail']),
          gender: getVal(row, ['Gender', 'gender', 'Sex']),
          dateOfBirth: getDate(row, ['Date of Birth', 'dateOfBirth', 'DOB', 'Birth Date', 'D.O.B']),
          state: getVal(row, ['State', 'state', 'Province']),
          district: getVal(row, ['District', 'district', 'City', 'Location']),
          block: getVal(row, ['Block', 'block', 'Area', 'Taluka', 'Zone']),
          address: getVal(row, ['Address', 'address', 'Location', 'Residential Address']),
          qualification: getVal(row, ['Qualification', 'qualification', 'Education', 'Degree', 'Qual']),
          course: getVal(row, ['Course', 'course', 'Training', 'Program']),
          batch: getVal(row, ['Batch', 'batch', 'Group', 'Class']),
          month: getVal(row, ['Month', 'month', 'Enrollment Month']),
          domain: getVal(row, ['Domain', 'domain', 'Trade', 'Sector', 'Industry', 'Field']),
          caste: getVal(row, ['Caste', 'caste', 'Category', 'Social Category']),
          aadharCard: getVal(row, ['Aadhar Card', 'aadharCard', 'Aadhar', 'Aadhaar', 'UID']),
          beforeCourseEmploymentStatus: getVal(row, ['Before Course Employment', 'beforeCourseEmployment', 'Employment Before', 'Before Employment']) || 'Unemployed',
          batchStartDate: getDate(row, ['Batch Start Date', 'batchStartDate', 'Batch Start', 'Start Date']),
          batchEndDate: getDate(row, ['Batch End Date', 'batchEndDate', 'Batch End', 'End Date']),
          batchStatus: getVal(row, ['Batch Status', 'batchStatus', 'Training Status']) || 'Ongoing',
          employmentAfterCourse: getVal(row, ['Employment After Course', 'employmentAfterCourse', 'After Employment', 'Post Training Employment']) || 'Unemployed',
          placementStatus: getVal(row, ['Placement Status', 'placementStatus', 'Status', 'Current Status']) || 'Interested',
          companyName: getVal(row, ['Company Name', 'companyName', 'Employer', 'Organization', 'Placed Company']),
          companyAddress: getVal(row, ['Company Address', 'companyAddress', 'Employer Address']),
          salary: getNum(row, ['Salary', 'salary', 'Package', 'CTC', 'Stipend', 'Pay']),
          monthlyEarning: getNum(row, ['Monthly Earning', 'monthlyEarning', 'Earning', 'Income']),
          location: getVal(row, ['Location', 'location', 'Job Location', 'Place', 'City']),
          businessName: getVal(row, ['Business Name', 'businessName', 'Business']),
          helper: getVal(row, ['Helper', 'helper', 'Mentor', 'Support Person']),
          document: getVal(row, ['Document', 'document', 'Doc', 'File']),
          remark: getVal(row, ['Remark', 'remark', 'Remarks', 'Notes', 'Comments', 'Feedback']),
        }
      });
      count++;
    }
  }

  res.json({ imported: count, skipped });
});

router.get('/reminders/due', authenticate, async (req, res) => {
  const today = new Date(); today.setHours(23,59,59,999);
  const due = await prisma.candidate.findMany({
    where: { isDeleted: false, nextFollowupDate: { lte: today } },
    take: 20, orderBy: { nextFollowupDate: 'asc' }
  });
  res.json(due.map(c => ({ id: c.id, name: c.fullName, mobile: c.mobileNumber, nextFollowupDate: c.nextFollowupDate, status: c.placementStatus })));
});

module.exports = router;
