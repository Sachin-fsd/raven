import express from 'express';
import { auth } from '../middleware/auth.js';
import Chat from '../models/Chat.js';

const router = express.Router();

router.get('/:otherUserId', auth, async (req, res) => {
  const chats = await Chat.find({
    $or: [
      { sender: req.user.id, receiver: req.params.otherUserId },
      { sender: req.params.otherUserId, receiver: req.user.id }
    ]
  }).sort({ createdAt: 1 });

  await Chat.updateMany(
    { sender: req.params.otherUserId, receiver: req.user.id, status: { $ne: 'read' } },
    { $set: { status: 'read' } }
  );

  res.json(chats);
});

export default router;
