const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, requireRoles } = require('../middleware/auth');

const fmt = (s) => ({
  id: s.id, title: s.title, description: s.description,
  videoUrl: s.videoUrl, thumbnailUrl: s.thumbnailUrl,
  domain: s.domain, course: s.course, batchId: s.batchId,
  trainerName: s.trainerName, trainerId: s.trainerId,
  sessionDate: s.sessionDate, duration: s.duration, tags: s.tags,
  visibility: s.visibility, isPublished: s.isPublished, views: s.views,
  createdAt: s.createdAt,
  createdBy: s.createdBy ? { id: s.createdBy.id, name: s.createdBy.name } : null,
  batch: s.batch ? { id: s.batch.id, batchName: s.batch.batchName } : null,
});

function convertGoogleDriveUrl(url) {
  if (!url) return url;
  const fileMatch = url.match(/https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  const openMatch = url.match(/https:\/\/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  }
  return url;
}

// GET /api/sessions — admin only
router.get('/', authenticate, requireRoles('admin'), async (req, res) => {
  const { search, domain, course, batchId, trainerId, visibility } = req.query;
  const where = { isDeleted: false };

  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (domain) where.domain = domain;
  if (course) where.course = { contains: course, mode: 'insensitive' };
  if (batchId) where.batchId = +batchId;
  if (trainerId) where.trainerId = +trainerId;
  if (visibility) where.visibility = visibility;

  const sessions = await prisma.onlineSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true } }, batch: { select: { id: true, batchName: true } } }
  });
  res.json(sessions.map(fmt));
});

// GET /api/sessions/all — admin, hr, and manager see all including unpublished
router.get('/all', authenticate, requireRoles('admin', 'hr', 'manager'), async (req, res) => {
  const { search, domain, course, trainerId } = req.query;
  const where = { isDeleted: false };
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (domain) where.domain = domain;
  if (course) where.course = { contains: course, mode: 'insensitive' };
  if (trainerId) where.trainerId = +trainerId;

  const sessions = await prisma.onlineSession.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true } }, batch: { select: { id: true, batchName: true } } }
  });
  res.json(sessions.map(fmt));
});

// GET /api/sessions/public — trainers, managers, hr view published sessions
router.get('/public', authenticate, requireRoles('admin', 'trainer', 'manager', 'hr'), async (req, res) => {
  const { search, domain, course, visibility } = req.query;
  const where = { isDeleted: false, isPublished: true };

  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (domain) where.domain = domain;
  if (course) where.course = { contains: course, mode: 'insensitive' };
  if (visibility) where.visibility = visibility;

  const sessions = await prisma.onlineSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true } }, batch: { select: { id: true, batchName: true } } }
  });
  res.json(sessions.map(fmt));
});

// GET /api/sessions/my — trainer's own/domain sessions
router.get('/my', authenticate, requireRoles('trainer'), async (req, res) => {
  const conditions = [{ trainerId: req.user.id }];
  if (req.user?.domain) conditions.push({ domain: req.user.domain });

  const where = {
    isDeleted: false,
    isPublished: true,
    OR: conditions,
  };

  const sessions = await prisma.onlineSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true } }, batch: { select: { id: true, batchName: true } } }
  });
  res.json(sessions.map(fmt));
});

// GET /api/sessions/stats/summary — admin only
router.get('/stats/summary', authenticate, requireRoles('admin'), async (req, res) => {
  const [total, published, totalViews, byDomain] = await Promise.all([
    prisma.onlineSession.count({ where: { isDeleted: false } }),
    prisma.onlineSession.count({ where: { isDeleted: false, isPublished: true } }),
    prisma.onlineSession.aggregate({ where: { isDeleted: false }, _sum: { views: true } }),
    prisma.onlineSession.groupBy({ by: ['domain'], where: { isDeleted: false }, _count: { id: true } }),
  ]);
  res.json({ total, published, unpublished: total - published, totalViews: totalViews._sum.views || 0, byDomain });
});

// GET /api/sessions/:id — admin only
router.get('/:id', authenticate, requireRoles('admin'), async (req, res) => {
  const session = await prisma.onlineSession.findFirst({
    where: { id: +req.params.id, isDeleted: false },
    include: { createdBy: { select: { id: true, name: true } }, batch: { select: { id: true, batchName: true } } }
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  // Increment view count
  await prisma.onlineSession.update({ where: { id: session.id }, data: { views: { increment: 1 } } });
  res.json(fmt(session));
});

// POST /api/sessions — admin, hr, and manager can add
router.post('/', authenticate, requireRoles('admin', 'hr', 'manager'), async (req, res) => {
  const { title, description, videoUrl, thumbnailUrl, domain, course,
    batchId, sessionDate, duration, tags, visibility, isPublished, trainerName, trainerId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (!videoUrl) return res.status(400).json({ error: 'Video URL is required' });

  const session = await prisma.onlineSession.create({
    data: {
      title, description,
      videoUrl: convertGoogleDriveUrl(videoUrl),
      thumbnailUrl: thumbnailUrl || null,
      domain: domain || null, course: course || null,
      batchId: batchId ? +batchId : null,
      trainerName: trainerName || null,
      trainerId: trainerId ? +trainerId : null,
      sessionDate: sessionDate ? new Date(sessionDate) : null,
      duration: duration || null, tags: tags || null,
      visibility: visibility || 'all',
      isPublished: isPublished !== false,
      createdById: req.user.id
    },
    include: { createdBy: { select: { id: true, name: true } }, batch: { select: { id: true, batchName: true } } }
  });
  res.json(fmt(session));
});

// PUT /api/sessions/:id — admin, hr, and manager can edit
router.put('/:id', authenticate, requireRoles('admin', 'hr', 'manager'), async (req, res) => {
  const existing = await prisma.onlineSession.findFirst({ where: { id: +req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const { title, description, videoUrl, thumbnailUrl, domain, course,
    batchId, trainerName, trainerId, sessionDate, duration, tags,
    visibility, isPublished } = req.body;

  const session = await prisma.onlineSession.update({
    where: { id: +req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(videoUrl !== undefined && { videoUrl: convertGoogleDriveUrl(videoUrl) }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(domain !== undefined && { domain }),
      ...(course !== undefined && { course }),
      ...(batchId !== undefined && { batchId: batchId ? +batchId : null }),
      ...(trainerName !== undefined && { trainerName }),
      ...(trainerId !== undefined && { trainerId: trainerId ? +trainerId : null }),
      ...(sessionDate !== undefined && { sessionDate: sessionDate ? new Date(sessionDate) : null }),
      ...(duration !== undefined && { duration }),
      ...(tags !== undefined && { tags }),
      ...(visibility !== undefined && { visibility }),
      ...(isPublished !== undefined && { isPublished }),
    },
    include: { createdBy: { select: { id: true, name: true } }, batch: { select: { id: true, batchName: true } } }
  });
  res.json(fmt(session));
});

// PATCH /api/sessions/:id/toggle-publish — admin, hr, and manager
router.patch('/:id/toggle-publish', authenticate, requireRoles('admin', 'hr', 'manager'), async (req, res) => {
  const existing = await prisma.onlineSession.findFirst({ where: { id: +req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.onlineSession.update({
    where: { id: +req.params.id }, data: { isPublished: !existing.isPublished }
  });
  res.json({ isPublished: updated.isPublished });
});

// DELETE /api/sessions/:id (soft) — admin, hr, and manager
router.delete('/:id', authenticate, requireRoles('admin', 'hr', 'manager'), async (req, res) => {
  const existing = await prisma.onlineSession.findFirst({ where: { id: +req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await prisma.onlineSession.update({ where: { id: +req.params.id }, data: { isDeleted: true } });
  res.json({ message: 'Deleted' });
});

module.exports = router;
