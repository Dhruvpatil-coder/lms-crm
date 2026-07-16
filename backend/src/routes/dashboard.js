const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

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

router.get('/summary', authenticate, async (req, res) => {
  const { district, block, domain, region, donorId, from, to } = req.query;
  const cWhere = { isDeleted: false };
  if (district) cWhere.district = district;
  if (block) cWhere.block = block;
  if (domain) cWhere.domain = domain;
  if (donorId) cWhere.donorId = +donorId;
  const regionWhere = getRegionWhere(region);
  if (regionWhere) Object.assign(cWhere, regionWhere);

  const candWhere = { isDeleted: false };
  if (district) candWhere.district = district;
  if (block) candWhere.block = block;

  const dateFrom = from ? new Date(from) : null;
  const dateTo = to ? new Date(to) : null;
  if (dateTo) dateTo.setHours(23,59,59,999);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  const createdAtWhere = {};
  if (dateFrom || dateTo) {
    createdAtWhere.createdAt = {};
    if (dateFrom) createdAtWhere.createdAt.gte = dateFrom;
    if (dateTo) createdAtWhere.createdAt.lte = dateTo;
  }

  const [companies, urgentHiring, newClients, totalCandidates, totalPlacements, upcomingFairs, todayFU, pendingFU] = await Promise.all([
    prisma.company.count({ where: cWhere }),
    prisma.company.count({ where: { ...cWhere, urgentHiring: true } }),
    prisma.company.count({ where: { ...cWhere, isNewClient: true, ...createdAtWhere } }),
    prisma.candidate.count({ where: candWhere }),
    prisma.placement.count({ where: (dateFrom || dateTo) ? { createdAt: createdAtWhere.createdAt } : {} }),
    prisma.jobFair.count({ where: { isDeleted: false, status: 'Upcoming' } }),
    prisma.company.count({ where: { ...cWhere, nextFollowupDate: { gte: today, lte: todayEnd } } }),
    prisma.company.count({ where: { ...cWhere, nextFollowupDate: { lt: today } } }),
  ]);

  // Total vacancies
  const vacancyAgg = await prisma.company.aggregate({ where: cWhere, _sum: { totalVacancies: true } });

  res.json({
    totalClients: companies, newClients, urgentHiringCompanies: urgentHiring,
    totalVacancies: vacancyAgg._sum.totalVacancies || 0,
    totalPlacements, totalCandidates, upcomingJobFairs: upcomingFairs,
    todayFollowups: todayFU, pendingFollowups: pendingFU,
  });
});

router.get('/daily-trend', authenticate, async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date();
  dateFrom.setHours(0,0,0,0);
  const dateTo = to ? new Date(to) : new Date();
  dateTo.setHours(23,59,59,999);

  const placements = await prisma.placement.findMany({
    where: { createdAt: { gte: dateFrom, lte: dateTo } },
    select: { createdAt: true }
  });

  const dayMap = {};
  const msPerDay = 86400000;
  const days = Math.ceil((dateTo - dateFrom) / msPerDay) + 1;
  for (let i = 0; i < days; i++) {
    const d = new Date(dateFrom);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = 0;
  }

  placements.forEach(p => {
    const key = new Date(p.createdAt).toISOString().split('T')[0];
    if (dayMap[key] !== undefined) dayMap[key]++;
  });

  res.json(Object.entries(dayMap).map(([date, placements]) => ({ date, placements })));
});

router.get('/monthly-trend-range', authenticate, async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date();
  dateFrom.setHours(0,0,0,0);
  const dateTo = to ? new Date(to) : new Date();
  dateTo.setHours(23,59,59,999);

  const placements = await prisma.placement.findMany({
    where: { createdAt: { gte: dateFrom, lte: dateTo } },
    select: { createdAt: true }
  });

  const monthMap = {};
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  placements.forEach(p => {
    const d = new Date(p.createdAt);
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  });

  res.json(Object.entries(monthMap).map(([month, placements]) => ({ month, placements })));
});

router.get('/vacancies-by-domain', authenticate, async (req, res) => {
  const groups = await prisma.company.groupBy({
    by: ['domain'],
    where: { isDeleted: false, domain: { not: null } },
    _sum: { totalVacancies: true }
  });
  res.json(groups.map(g => ({ domain: g.domain, vacancies: g._sum.totalVacancies || 0 })));
});

router.get('/top-hiring-companies', authenticate, async (req, res) => {
  const companies = await prisma.company.findMany({
    where: { isDeleted: false }, orderBy: { totalVacancies: 'desc' }, take: 5
  });
  res.json(companies.map(c => ({ name: c.companyName, vacancies: c.totalVacancies })));
});

router.get('/placement-by-block', authenticate, async (req, res) => {
  const groups = await prisma.placement.groupBy({ by: ['block'], _count: { id: true } });
  res.json(groups.sort((a,b) => b._count.id - a._count.id).slice(0,5).map(g => ({ block: g.block || 'Unknown', placements: g._count.id })));
});

router.get('/monthly-placement-trend', authenticate, async (req, res) => {
  const placements = await prisma.placement.findMany({ select: { joiningDate: true } });
  const monthMap = {};
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  placements.forEach(p => {
    if (!p.joiningDate) return;
    const m = new Date(p.joiningDate).getMonth();
    monthMap[m] = (monthMap[m] || 0) + 1;
  });
  res.json(months.map((m, i) => ({ month: m, placements: monthMap[i] || 0 })));
});

router.get('/placement-status-distribution', authenticate, async (req, res) => {
  const groups = await prisma.candidate.groupBy({
    by: ['placementStatus'], where: { isDeleted: false }, _count: { id: true }
  });
  res.json(groups.map(g => ({ status: g.placementStatus, count: g._count.id })));
});

router.get('/reminders', authenticate, async (req, res) => {
  const today = new Date(); today.setHours(23,59,59,999);
  const in3Days = new Date(); in3Days.setDate(in3Days.getDate() + 3);
  const now = new Date(); now.setHours(0,0,0,0);

  const [companyFU, candidateFU, upcomingFairs] = await Promise.all([
    prisma.company.findMany({ where: { isDeleted: false, nextFollowupDate: { lte: today } }, take: 10, orderBy: { nextFollowupDate: 'asc' } }),
    prisma.candidate.findMany({ where: { isDeleted: false, nextFollowupDate: { lte: today } }, take: 10, orderBy: { nextFollowupDate: 'asc' } }),
    prisma.jobFair.findMany({ where: { isDeleted: false, status: 'Upcoming', startDate: { gte: now, lte: in3Days } } })
  ]);

  res.json({
    companyFollowups: companyFU.map(c => ({ id: c.id, name: c.companyName, date: c.nextFollowupDate })),
    candidateFollowups: candidateFU.map(c => ({ id: c.id, name: c.fullName, date: c.nextFollowupDate })),
    upcomingFairs: upcomingFairs.map(j => ({ id: j.id, name: j.eventName, date: j.startDate }))
  });
});

module.exports = router;
