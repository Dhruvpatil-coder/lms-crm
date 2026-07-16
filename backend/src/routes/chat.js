const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, requireRoles } = require('../middleware/auth');

router.get('/messages', authenticate, requireRoles('admin', 'hr'), async (req, res) => {
  const msgs = await prisma.chatMessage.findMany({
    where: { isDeleted: false },
    include: { sender: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' }, take: 50
  });
  res.json(msgs.reverse().map(m => ({
    id: m.id, senderId: m.senderId, senderName: m.sender?.name,
    senderRole: m.sender?.role, content: m.content, createdAt: m.createdAt
  })));
});

router.post('/messages', authenticate, requireRoles('admin', 'hr'), async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  const msg = await prisma.chatMessage.create({
    data: { senderId: req.user.id, content },
    include: { sender: { select: { name: true, role: true } } }
  });
  res.json({ id: msg.id, senderId: msg.senderId, senderName: msg.sender?.name, senderRole: msg.sender?.role, content: msg.content, createdAt: msg.createdAt });
});

router.delete('/messages/:id', authenticate, async (req, res) => {
  await prisma.chatMessage.updateMany({ where: { id: +req.params.id, senderId: req.user.id }, data: { isDeleted: true } });
  res.json({ message: 'Deleted' });
});

module.exports = router;
