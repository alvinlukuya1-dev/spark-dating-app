import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { Types } from 'mongoose';

const router = Router();

// @route   POST api/swipe/like/:userId
// @desc    Like a user (swipe right)
// @access  Private
router.post('/like/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ msg: 'You cannot like yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ msg: 'Current user not found' });
    }

    const alreadyLiked = currentUser.likes.some((id: any) => id.equals(userId));
    const alreadyPassed = currentUser.passes.some((id: any) => id.equals(userId));
    if (alreadyLiked) {
      return res.status(400).json({ msg: 'You have already liked this user' });
    }
    if (alreadyPassed) {
      return res.status(400).json({ msg: 'You have passed on this user; you must remove the pass first' });
    }

    currentUser.likes.push(userId as any);
    await currentUser.save();

    const targetUserLikes = targetUser.likes.some((id: any) => id.equals(currentUserId));
    if (targetUserLikes) {
      let match = await Match.findOne({
        $or: [
          { user1: currentUserId, user2: userId },
          { user1: userId, user2: currentUserId }
        ]
      });

      if (!match) {
        match = new Match({
          user1: currentUserId,
          user2: userId
        });
        await match.save();

        const io = (req.app as any).get('io');
        if (io) {
          const notifyNewMatch = (req.app as any).get('notifyNewMatch');
          if (notifyNewMatch) {
            notifyNewMatch(io, currentUserId.toString(), userId);
          } else {
            const room1 = `user_${currentUserId}`;
            const room2 = `user_${userId}`;
            const matchData = {
              matchId: match._id,
              user1: { id: currentUser._id, name: currentUser.name, photos: currentUser.photos },
              user2: { id: targetUser._id, name: targetUser.name, photos: targetUser.photos },
              matchedAt: new Date()
            };
            io.to(room1).emit('newMatch', { ...matchData, matchedWith: targetUser });
            io.to(room2).emit('newMatch', { ...matchData, matchedWith: currentUser });
          }
        }
      }

      res.json({
        msg: 'It\'s a match!',
        matchId: match._id,
        isMatch: true,
        match: { id: match._id, createdAt: match.createdAt }
      });
    } else {
      res.json({ msg: 'You liked this user', isMatch: false });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/swipe/pass/:userId
// @desc    Pass on a user (swipe left)
// @access  Private
router.post('/pass/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ msg: 'You cannot pass on yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ msg: 'Current user not found' });
    }

    const alreadyLiked = currentUser.likes.some((id: any) => id.equals(userId));
    const alreadyPassed = currentUser.passes.some((id: any) => id.equals(userId));
    if (alreadyLiked) {
      return res.status(400).json({ msg: 'You have already liked this user; you must remove the like first' });
    }
    if (alreadyPassed) {
      return res.status(400).json({ msg: 'You have already passed on this user' });
    }

    currentUser.passes.push(userId as any);
    await currentUser.save();

    res.json({ msg: 'You passed on this user' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/swipe/likes
// @desc    Get users that the current user has liked
// @access  Private
router.get('/likes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const user = await User.findById(userId).populate('likes', 'username name photos');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user.likes);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/swipe/matches
// @desc    Get all matches for the current user
// @access  Private
router.get('/matches', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const matches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    })
    .populate('user1', 'username name photos bio')
    .populate('user2', 'username name photos bio')
    .sort('-createdAt');

    const formattedMatches = matches.map(match => {
      const otherUser = (match.user1 as any)._id.equals(userId) ? match.user2 : match.user1;
      return {
        matchId: match._id,
        matchedAt: match.createdAt,
        user: {
          id: (otherUser as any)._id,
          username: (otherUser as any).username,
          name: (otherUser as any).name,
          photos: (otherUser as any).photos
        }
      };
    });

    res.json(formattedMatches);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/swipe/suggestions
// @desc    Get suggested users to swipe on (excluding those already liked or passed)
// @access  Private
router.get('/suggestions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const excludedIds = [...currentUser.likes, ...currentUser.passes, userId];
    const users = await User.find({
      _id: { $nin: excludedIds }
    })
    .select('-password')
    .limit(10);

    res.json(users);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;