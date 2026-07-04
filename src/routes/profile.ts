import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';
import { check, validationResult } from 'express-validator';
import { uploadAvatar } from '../config/cloudinary';

const router = Router();

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.put(
  '/',
  [
    authenticateToken,
    check('name').optional().isLength({ min: 1 }).trim(),
    check('bio').optional().isLength({ max: 500 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, bio, birthDate, gender, lookingFor, location, interests } = req.body;

    try {
      let user = await User.findById(req.user!._id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (name !== undefined) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (birthDate !== undefined) user.birthDate = new Date(birthDate);
      if (gender !== undefined) user.gender = gender;
      if (lookingFor !== undefined) user.lookingFor = lookingFor;
      if (location !== undefined) user.location = location;
      if (interests !== undefined) user.interests = Array.isArray(interests) ? interests : user.interests;

      await user.save();
      res.json({ msg: 'Profile updated', user });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.post(
  '/photo',
  [authenticateToken, uploadAvatar.single('photo')],
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
      }

      const user = await User.findById(req.user!._id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const photoUrl = (req.file as any).path;
      user.photos.push(photoUrl);
      await user.save();

      res.json({ msg: 'Photo uploaded successfully', photoUrl });
    } catch (err: any) {
      res.status(500).send('Server error');
    }
  }
);

router.delete(
  '/photo/:filename',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const user = await User.findById(req.user!._id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const photoUrl = `/uploads/${filename}`;
      const initialLength = user.photos.length;
      user.photos = user.photos.filter(url => !url.includes(filename));

      if (user.photos.length === initialLength) {
        return res.status(404).json({ msg: 'Photo not found' });
      }

      await user.save();
      res.json({ msg: 'Photo removed successfully' });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

export default router;
