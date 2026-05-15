import express from 'express';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', auth, async (req, res) => {
  const q = req.query.q?.trim() || '';
  const users = await User.find({
    _id: { $ne: req.user.id },
    name: { $regex: q, $options: 'i' }
  })
    .select('_id name email')
    .limit(20);
  res.json(users);
});

router.get('/recent', auth, async (req, res) => {
  const userId = req.user.id;
  const recent = await Chat.aggregate([
    { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
    {
      $project: {
        otherUser: {
          $cond: [{ $eq: ['$sender', { $toObjectId: userId }] }, '$receiver', '$sender']
        },
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$otherUser', latest: { $first: '$createdAt' } } },
    { $sort: { latest: -1 } },
    { $limit: 30 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: '$user._id', name: '$user.name', email: '$user.email', latest: 1 } }
  ]);
  res.json(recent);
});

export default router;
