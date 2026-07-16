const router = require('express').Router();
const prisma = require('../config/prisma');

// GET /api/stats/public — public stats for login page (no auth required)
router.get('/public', async (req, res) => {
  try {
    const [candidates, activeUsers, placements] = await Promise.all([
      prisma.candidate.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.placement.count(),
    ]);
    res.json({ candidates, activeUsers, placements });
  } catch (e) {
    res.json({ candidates: 0, activeUsers: 0, placements: 0 });
  }
});

module.exports = router;
