const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

const fmt = (d) => ({
  id: d.id, name: d.name, organization: d.organization, contactPerson: d.contactPerson,
  email: d.email, phone: d.phone, district: d.district, block: d.block, domain: d.domain,
  date: d.date, remarks: d.remarks, isActive: d.isActive, createdAt: d.createdAt, createdById: d.createdById, managerId: d.managerId
});

const toDate = (val) => val ? new Date(val) : null;

// GET managers for donor assignment dropdown
router.get('/managers', authenticate, async (req, res) => {
  const managers = await prisma.user.findMany({
    where: { role: 'manager', isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' }
  });
  res.json(managers);
});

router.get('/', authenticate, async (req, res) => {
  const { search, district, block, domain, isActive, limit = 200, skip = 0 } = req.query;
  const where = { isDeleted: false };
  
  // Manager restriction: only see "Swadesh" donor + donors assigned to them
  if (req.user.role === 'manager') {
    where.OR = [
      { name: { contains: 'Swadesh', mode: 'insensitive' } },
      { managerId: req.user.id }
    ];
  }
  
  if (search) {
    if (where.OR) {
      // Manager already has OR, wrap it with search
      where.AND = [
        { OR: where.OR },
        { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { organization: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } }
        ]}
      ];
      delete where.OR;
    } else {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ];
    }
  }
  if (district) where.district = district;
  if (block) where.block = block;
  if (domain) where.domain = domain;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [total, data] = await Promise.all([
    prisma.donor.count({ where }),
    prisma.donor.findMany({ where, orderBy: { createdAt: 'desc' }, take: +limit, skip: +skip })
  ]);
  res.json({ total, data: data.map(fmt) });
});

router.post('/', authenticate, async (req, res) => {
  const { date, managerId, ...rest } = req.body;
  const d = await prisma.donor.create({
    data: { ...rest, date: toDate(date), createdById: req.user.id, managerId: managerId ? +managerId : null }
  });
  res.json(fmt(d));
});

router.put('/:id', authenticate, async (req, res) => {
  const { date, id: _id, createdAt, createdById, managerId, ...rest } = req.body;
  const d = await prisma.donor.update({
    where: { id: +req.params.id },
    data: { ...rest, date: toDate(date), managerId: managerId ? +managerId : null }
  });
  res.json(fmt(d));
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.donor.update({ where: { id: +req.params.id }, data: { isDeleted: true } });
  res.json({ message: 'Deleted' });
});

router.get('/export/excel', authenticate, async (req, res) => {
  const { default: xlsx } = await import('xlsx');
  const where = { isDeleted: false };
  if (req.user.role === 'manager') {
    where.OR = [
      { name: { contains: 'Swadesh', mode: 'insensitive' } },
      { managerId: req.user.id }
    ];
  }
  const donors = await prisma.donor.findMany({ where });
  const rows = donors.map(d => ({
    'Donor Name': d.name, Organization: d.organization, 'Contact Person': d.contactPerson,
    Email: d.email, Phone: d.phone, District: d.district, Block: d.block, Domain: d.domain,
    Date: d.date?.toISOString().split('T')[0] || '',
    Remarks: d.remarks, Active: d.isActive ? 'Yes' : 'No'
  }));
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rows), 'Donors');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=donors.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = router;
