import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Message } from '../models/Message';
import { Types } from 'mongoose';

const router = Router();

router.get('/messages/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name photos')
    .populate('receiver', 'name photos');

    await Message.updateMany(
      { receiver: currentUserId, sender: userId, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/messages/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    const { content, mediaUrl, type } = req.body;

    const message = new Message({
      sender: currentUserId,
      receiver: userId,
      content,
      mediaUrl,
      type: type || 'text'
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name photos')
      .populate('receiver', 'name photos');

    const io = (req.app as any).get('io');
    if (io) {
      const roomId = [currentUserId.toString(), userId].sort().join('_');
      io.to(`chat_${roomId}`).emit('newMessage', populatedMessage);
    }

    res.json(populatedMessage);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;