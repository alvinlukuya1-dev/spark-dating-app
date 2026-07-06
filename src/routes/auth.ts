import { Router } from 'express';
import { User } from '../models/User';
import { firebaseAuth } from '../config/firebase';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: any, res: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const idToken = authHeader && authHeader.split(' ')[1];
    if (!idToken) return res.status(401).json({ msg: 'No token provided' });
    if (!firebaseAuth) return res.status(500).json({ msg: 'Firebase not configured' });

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const { username, name } = req.body;

    if (!username || !name) {
      return res.status(400).json({ msg: 'Username and name are required' });
    }

    const existing = await User.findOne({
      $or: [{ email: decoded.email }, { username }]
    });
    if (existing) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const user = await User.create({
      firebaseUid: decoded.uid,
      email: decoded.email,
      username,
      name
    });

    const obj = user.toObject();
    const { ...profile } = obj;

    res.json({ msg: 'Account created', user: profile });
  } catch (err: any) {
    console.error('Register error:', err.message);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const idToken = authHeader && authHeader.split(' ')[1];
    if (!idToken) return res.status(401).json({ msg: 'No token provided' });
    if (!firebaseAuth) return res.status(500).json({ msg: 'Firebase not configured' });

    const decoded = await firebaseAuth.verifyIdToken(idToken);

    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.findOne({ email: decoded.email });
      if (user) {
        user.firebaseUid = decoded.uid;
        await user.save();
      }
    }
    if (!user) {
      return res.status(400).json({ msg: 'Account not found. Please register first.' });
    }

    const obj = user.toObject();
    res.json({ user: obj });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
