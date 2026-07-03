import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json([]);
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      $or: [{ name: regex }, { username: regex }],
      _id: { $ne: req.user!._id }
    })
      .select('name username photos bio')
      .limit(20)
      .lean();
    res.json(users);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
