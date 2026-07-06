import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Notification } from '../models/Notification';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user!._id })
      .populate('from', 'name photos')
      .sort('-createdAt')
      .limit(50);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/read/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { read: true }
    );
    res.json({ msg: 'Marked as read' });
  } catch (err: any) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    await Notification.updateMany(
      { user: req.user!._id, read: false },
      { read: true }
    );
    res.json({ msg: 'All marked as read' });
  } catch (err: any) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/unread-count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const count = await Notification.countDocuments({ user: req.user!._id, read: false });
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
