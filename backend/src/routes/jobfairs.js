const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

const toDate = (d) => {
  if (!d || d === '') return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const fmt = (j) => ({
  id: j.id, eventName: j.eventName, companies: j.companies, companyId: j.companyId,
  district: j.district, block: j.block, venue: j.venue, vacancyCount: j.vacancyCount,
  domain: j.domain, startDate: j.startDate, endDate: j.endDate,
  coordinator: j.coordinator, status: j.status, createdAt: j.createdAt
});

router.get('/', authenticate, async (req, res) => {
  const { district, block, domain, status, limit = 100, skip = 0 } = req.query;
  const where = { isDeleted: false };
  if (district) where.district = district;
  if (block) where.block = block;
  if (domain) where.domain = { contains: domain };
  if (status) where.status = status;

  const [total, data] = await Promise.all([
    prisma.jobFair.count({ where }),
    prisma.jobFair.findMany({ where, orderBy: { startDate: 'asc' }, take: +limit, skip: +skip })
  ]);
  res.json({ total, data: data.map(fmt) });
});

router.get('/calendar', authenticate, async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = +(month || now.getMonth() + 1);
  const y = +(year || now.getFullYear());
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  const fairs = await prisma.jobFair.findMany({
    where: { isDeleted: false, OR: [{ startDate: { gte: start, lte: end } }, { endDate: { gte: start, lte: end } }] }
  });
  res.json(fairs.map(fmt));
});

router.post('/', authenticate, async (req, res) => {
  const { startDate, endDate, vacancyCount, companyId, id, createdAt, ...rest } = req.body;
  const jf = await prisma.jobFair.create({
    data: { ...rest, vacancyCount: +vacancyCount || 0, startDate: toDate(startDate), endDate: toDate(endDate), companyId: companyId ? +companyId : null }
  });
  res.json(fmt(jf));
});

router.put('/:id', authenticate, async (req, res) => {
  const { startDate, endDate, vacancyCount, companyId, id, createdAt, ...rest } = req.body;
  const jf = await prisma.jobFair.update({
    where: { id: +req.params.id },
    data: { ...rest, vacancyCount: +vacancyCount || 0, startDate: toDate(startDate), endDate: toDate(endDate), companyId: companyId ? +companyId : null }
  });
  res.json(fmt(jf));
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.jobFair.update({ where: { id: +req.params.id }, data: { isDeleted: true } });
  res.json({ message: 'Deleted' });
});

module.exports = router;
