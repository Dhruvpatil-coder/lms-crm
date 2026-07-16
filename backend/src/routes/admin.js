const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { authenticate, requireRoles } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', authenticate, requireRoles('admin'), async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, phone: true, district: true, createdAt: true }
  });
  res.json(users);
});

// POST /api/admin/users
router.post('/users', authenticate, requireRoles('admin'), async (req, res) => {
  const { name, email, password, role, phone, district } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, hashedPassword, role, phone, district } });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireRoles('admin'), async (req, res) => {
  await prisma.user.update({ where: { id: +req.params.id }, data: { isActive: false } });
  res.json({ message: 'Deactivated' });
});

// GET /api/admin/trainers
router.get('/trainers', authenticate, async (req, res) => {
  const trainers = await prisma.user.findMany({
    where: { role: 'trainer', isActive: true },
    select: { id: true, name: true, email: true, phone: true, district: true }
  });
  res.json(trainers);
});

// GET /api/admin/trainer-attendance
router.get('/trainer-attendance', authenticate, requireRoles('admin', 'hr'), async (req, res) => {
  const { trainerId, fromDate, toDate } = req.query;
  const where = {};
  if (trainerId) where.trainerId = +trainerId;
  if (fromDate) where.date = { ...(where.date || {}), gte: new Date(fromDate) };
  if (toDate) where.date = { ...(where.date || {}), lte: new Date(toDate) };

  const records = await prisma.trainerAttendance.findMany({
    where, include: { trainer: { select: { name: true } } },
    orderBy: { date: 'desc' }, take: 200
  });
  res.json(records.map(r => ({
    id: r.id, trainerId: r.trainerId, trainerName: r.trainer?.name,
    date: r.date, checkinTime: r.checkinTime, checkoutTime: r.checkoutTime,
    vdcName: r.vdcName, district: r.district, block: r.block,
    activityType: r.activityType, workDetails: r.workDetails
  })));
});

module.exports = router;
