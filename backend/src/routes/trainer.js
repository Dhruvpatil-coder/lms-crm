const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, requireRoles } = require('../middleware/auth');

const toDateOnly = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// POST /api/trainer/checkin
router.post('/checkin', authenticate, requireRoles('trainer'), async (req, res) => {
  const { vdcName, district, block, activityType, workDetails } = req.body;
  if (!vdcName) return res.status(400).json({ error: 'VDC Name is required' });

  const today = toDateOnly(new Date());
  const existing = await prisma.trainerAttendance.findUnique({
    where: { trainerId_date: { trainerId: req.user.id, date: today } }
  });
  if (existing?.checkinTime) return res.status(400).json({ error: 'Already checked in today' });

  const record = await prisma.trainerAttendance.upsert({
    where: { trainerId_date: { trainerId: req.user.id, date: today } },
    create: { trainerId: req.user.id, date: today, checkinTime: new Date(), vdcName, district, block, activityType, workDetails },
    update: { checkinTime: new Date(), vdcName, district, block, activityType, workDetails }
  });
  res.json({ message: 'Checked in', time: record.checkinTime });
});

// POST /api/trainer/checkout
router.post('/checkout', authenticate, requireRoles('trainer'), async (req, res) => {
  const { workDetails } = req.body;
  const today = toDateOnly(new Date());
  const record = await prisma.trainerAttendance.findUnique({
    where: { trainerId_date: { trainerId: req.user.id, date: today } }
  });
  if (!record) return res.status(400).json({ error: 'Please check in first' });

  const updated = await prisma.trainerAttendance.update({
    where: { id: record.id },
    data: { checkoutTime: new Date(), ...(workDetails && { workDetails }) }
  });
  res.json({ message: 'Checked out', time: updated.checkoutTime });
});

// GET /api/trainer/today-status
router.get('/today-status', authenticate, async (req, res) => {
  const today = toDateOnly(new Date());
  const record = await prisma.trainerAttendance.findUnique({
    where: { trainerId_date: { trainerId: req.user.id, date: today } }
  });
  if (!record) return res.json({ checkedIn: false, checkedOut: false });
  res.json({
    checkedIn: !!record.checkinTime, checkedOut: !!record.checkoutTime,
    checkinTime: record.checkinTime, checkoutTime: record.checkoutTime,
    vdcName: record.vdcName, activityType: record.activityType
  });
});

// GET /api/trainer/attendance-history
router.get('/attendance-history', authenticate, async (req, res) => {
  const records = await prisma.trainerAttendance.findMany({
    where: { trainerId: req.user.id }, orderBy: { date: 'desc' }, take: 30
  });
  res.json(records);
});

// GET /api/trainer/batches
router.get('/batches', authenticate, async (req, res) => {
  const batches = await prisma.batch.findMany({ where: { trainerId: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json(batches);
});

// GET /api/trainer/my-candidates
router.get('/my-candidates', authenticate, async (req, res) => {
  const candidates = await prisma.candidate.findMany({
    where: { trainerId: req.user.id, isDeleted: false }, orderBy: { createdAt: 'desc' }
  });
  res.json(candidates);
});

// GET /api/trainer/placement-vacancies
router.get('/placement-vacancies', authenticate, async (req, res) => {
  const batches = await prisma.batch.findMany({ where: { trainerId: req.user.id } });
  const domains = [...new Set(batches.map(b => b.domain).filter(Boolean))];

  const whereCompany = { isDeleted: false, totalVacancies: { gt: 0 } };
  if (domains.length) whereCompany.domain = { in: domains };

  const [companies, upcomingFairs] = await Promise.all([
    prisma.company.findMany({ where: whereCompany, orderBy: [{ urgentHiring: 'desc' }, { totalVacancies: 'desc' }], take: 20 }),
    prisma.jobFair.findMany({ where: { isDeleted: false, status: { in: ['Upcoming', 'Ongoing'] } }, orderBy: { startDate: 'asc' } })
  ]);

  res.json({
    vacancies: companies.map(c => ({ id: c.id, companyName: c.companyName, domain: c.domain, district: c.district, block: c.block, totalVacancies: c.totalVacancies, urgentHiring: c.urgentHiring, contactPerson: c.contactPerson })),
    upcomingFairs: upcomingFairs.map(j => ({ id: j.id, eventName: j.eventName, companyName: j.companyName, district: j.district, block: j.block, startDate: j.startDate, vacancyCount: j.vacancyCount, status: j.status }))
  });
});

module.exports = router;
