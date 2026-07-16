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

// Smart column mapping for ANY format
function findColumn(row, possibleNames) {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const exact = keys.find(k => k.trim() === name);
    if (exact !== undefined) return exact;
    const ci = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (ci !== undefined) return ci;
  }
  // fuzzy match - contains
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
  id: c.id, companyName: c.companyName, email: c.email, address: c.address, district: c.district, block: c.block,
  domain: c.domain, contactPerson: c.contactPerson, contactNumber: c.contactNumber,
  totalVacancies: c.totalVacancies, urgentHiring: c.urgentHiring, nextFollowupDate: c.nextFollowupDate,
  remarks: c.remarks, isNewClient: c.isNewClient, createdAt: c.createdAt
});

router.get('/', authenticate, async (req, res) => {
  const { search, district, block, domain, status, isNewClient, urgentHiring, region, donorId, limit = 200, skip = 0 } = req.query;
  const where = { isDeleted: false };
  if (search) where.OR = [
    { companyName: { contains: search } },
    { contactPerson: { contains: search } },
    { contactNumber: { contains: search } },
    { email: { contains: search } }
  ];
  if (district) where.district = district;
  if (block) where.block = block;
  if (domain) where.domain = domain;
  if (urgentHiring !== undefined) where.urgentHiring = urgentHiring === 'true';
  if (isNewClient !== undefined) where.isNewClient = isNewClient === 'true';
  if (donorId) where.donorId = +donorId;

  const [total, data] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({ where, orderBy: { createdAt: 'desc' }, take: +limit, skip: +skip })
  ]);
  res.json({ total, data: data.map(fmt) });
});

router.get('/stats/summary', authenticate, async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999);

  const [total, urgentHiring, newToday, newWeek, newMonth, todayFU, pendingFU] = await Promise.all([
    prisma.company.count({ where: { isDeleted: false } }),
    prisma.company.count({ where: { isDeleted: false, urgentHiring: true } }),
    prisma.company.count({ where: { isDeleted: false, isNewClient: true, createdAt: { gte: today, lte: todayEnd } } }),
    prisma.company.count({ where: { isDeleted: false, isNewClient: true, createdAt: { gte: weekStart } } }),
    prisma.company.count({ where: { isDeleted: false, isNewClient: true, createdAt: { gte: monthStart } } }),
    prisma.company.count({ where: { isDeleted: false, nextFollowupDate: { gte: today, lte: todayEnd } } }),
    prisma.company.count({ where: { isDeleted: false, nextFollowupDate: { lt: today } } })
  ]);
  res.json({ total, urgentHiring, newToday, newThisWeek: newWeek, newThisMonth: newMonth, todayFollowups: todayFU, pendingFollowups: pendingFU });
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { totalVacancies, nextFollowupDate, lastFollowupDate, donorId, id, createdAt, ...rest } = req.body;
    console.log('Creating company:', req.body);
    const c = await prisma.company.create({
      data: { ...rest, totalVacancies: +totalVacancies || 0, lastFollowupDate: toDate(lastFollowupDate), nextFollowupDate: toDate(nextFollowupDate), donorId: donorId ? +donorId : null, createdById: req.user.id }
    });
    res.json(fmt(c));
  } catch (e) {
    console.error('Company create error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { totalVacancies, nextFollowupDate, donorId, id, createdAt, createdById, ...rest } = req.body;
  const c = await prisma.company.update({
    where: { id: +req.params.id },
    data: { ...rest, totalVacancies: +totalVacancies || 0, nextFollowupDate: toDate(nextFollowupDate), donorId: donorId ? +donorId : null }
  });
  res.json(fmt(c));
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.company.update({ where: { id: +req.params.id }, data: { isDeleted: true } });
  res.json({ message: 'Deleted' });
});

router.get('/export/excel', authenticate, async (req, res) => {
  const { default: xlsx } = await import('xlsx');
  const companies = await prisma.company.findMany({ where: { isDeleted: false } });
  const rows = companies.map(c => ({
    'Company Name': c.companyName, 'Email': c.email || '', 'Address': c.address, 'District': c.district, 'Block': c.block,
    'Domain': c.domain, 'Contact Person': c.contactPerson, 'Phone': c.contactNumber,
    'Vacancies': c.totalVacancies, 'Urgent Hiring': c.urgentHiring ? 'Yes' : 'No',
    'Next Follow-up': c.nextFollowupDate?.toISOString().split('T')[0] || '', 'Remarks': c.remarks
  }));
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rows), 'Companies');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=companies.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// SMART IMPORT — handles ANY column format
router.post('/import/excel', authenticate, upload.single('file'), async (req, res) => {
  const { default: xlsx } = await import('xlsx');
  const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
  let count = 0;
  let skipped = 0;

  for (const sheetName of wb.SheetNames) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
    if (rows.length === 0) continue;
    // Check if this sheet looks like a data sheet (has at least some recognizable columns)
    const firstRow = rows[0];
    const hasCompanyName = findColumn(firstRow, ['Company Name', 'Comapany Name', 'Employer Name', 'Company', 'Client Name', 'Name']);
    if (!hasCompanyName) continue; // Skip summary sheets, etc.

    for (const row of rows) {
      const companyName = getVal(row, ['Company Name', 'Comapany Name', 'Employer Name', 'Company', 'Client Name', 'Name']);
      if (!companyName) { skipped++; continue; }

      const totalVacancies = getNum(row, ['Vacancies', 'Vacancy', 'No Of Vacancy', 'No Of Vacancy ', 'Total Vacancies', 'vacancies']);
      // Skip header rows that have text in vacancy column
      const vacancyRaw = getVal(row, ['Vacancies', 'Vacancy', 'No Of Vacancy', 'No Of Vacancy ', 'Total Vacancies']);
      if (vacancyRaw && isNaN(Number(vacancyRaw)) && !vacancyRaw.match(/^\d+$/)) {
        // Could be a header row - skip if company name also looks like a header
        if (companyName.toLowerCase().includes('company') || companyName.toLowerCase().includes('name')) {
          skipped++; continue;
        }
      }

      await prisma.company.create({
        data: {
          companyName,
          address: getVal(row, ['Address', 'Office Address', 'ADDRESS', 'Location', 'address']),
          district: getVal(row, ['District', 'district', 'Location']),
          block: getVal(row, ['Block', 'block', 'Area', 'Taluka']),
          domain: getVal(row, ['Domain', 'domain', 'Trade', 'Trades', 'VACANCY TYPE', 'Vacancy Type', 'Domain/Trade']),
          email: getVal(row, ['Email', 'email', 'Company Email', 'Mail', 'E-mail', 'Company Email ID', 'Email ID']),
          contactPerson: getVal(row, ['Contact Person', 'Contact', 'Coordinator', 'Employer Name', 'contactPerson', 'Contact Person Name']),
          contactNumber: getVal(row, ['Phone', 'Contact Details', 'Mobile No.', 'Contact No', 'Contact Number', 'Mobile', 'Phone Number', 'contactNumber']),
          totalVacancies,
          urgentHiring: false,
          nextFollowupDate: getDate(row, ['Follow-UP Date', 'Follow-up Date', 'Next Follow-up', 'Followup Date', 'Date']),
          remarks: getVal(row, ['Remarks', 'Remark', 'REMARK', 'REMARKS', 'remark', 'Whatsapp Remarks', 'Notes']),
          isNewClient: true,
          createdById: req.user.id
        }
      });
      count++;
    }
  }

  res.json({ imported: count, skipped });
});

module.exports = router;
