import { Router } from 'express';
import { User } from '../models/User';
import { firebaseAuth } from '../config/firebase';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyDxRdYG9yH91_mGAC5sK1JmmeSS2vaOLwQ';

const getToken = (req: any) => {
  const fromHeader = req.headers['authorization']?.split(' ')[1];
  if (fromHeader) return fromHeader;
  const fromBody = req.headers['x-auth-token'] || req.body?.idToken;
  if (fromBody) return fromBody;
  return null;
};

const signJwt = (userId: string) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign({ user: { id: userId } }, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) reject(err);
      else resolve(token as string);
    });
  });
};

// Helper: create Firebase user from email/password (old client flow)
const createFirebaseUser = async (email: string, password: string) => {
  if (!firebaseAuth) throw new Error('Firebase not configured');
  return await firebaseAuth.createUser({ email, password });
};

// Helper: verify email/password via Firebase REST API, return decoded token
const verifyEmailPassword = async (email: string, password: string) => {
  const apiKey = FIREBASE_API_KEY;
  if (!apiKey) throw new Error('Firebase API key not configured');
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Invalid credentials');
  // Verify the returned ID token
  if (!firebaseAuth) throw new Error('Firebase not configured');
  return await firebaseAuth.verifyIdToken(data.idToken);
};

router.post('/register', async (req: any, res: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const firebaseToken = authHeader && authHeader.split(' ')[1];

    if (firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined') {
      // --- NEW CLIENT: Firebase ID token in Authorization header ---
      if (!firebaseAuth) return res.status(500).json({ msg: 'Firebase not configured' });
      const decoded = await firebaseAuth.verifyIdToken(firebaseToken);
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
      res.json({ msg: 'Account created', user: obj });
    } else {
      // --- OLD CLIENT: email + password in body (JWT flow) ---
      const { email, password, username, name } = req.body;
      if (!email || !password || !username) {
        return res.status(400).json({ msg: 'Email, password, and username are required' });
      }
      if (!firebaseAuth) return res.status(500).json({ msg: 'Firebase not configured' });

      // Check if user exists in MongoDB
      const existing = await User.findOne({
        $or: [{ email }, { username }]
      });
      if (existing) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create Firebase user
      const firebaseUser = await createFirebaseUser(email, password);

      // Create MongoDB user
      const user = await User.create({
        firebaseUid: firebaseUser.uid,
        email,
        username,
        name: name || ''
      });

      // Issue JWT token for old client
      const token = await signJwt(user.id);
      res.json({ token });
    }
  } catch (err: any) {
    console.error('Register error:', err.message);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const firebaseToken = authHeader && authHeader.split(' ')[1];

    if (firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined') {
      // --- NEW CLIENT: Firebase ID token in Authorization header ---
      const idToken = getToken(req);
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
    } else {
      // --- OLD CLIENT: email + password in body (JWT flow) ---
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password are required' });
      }
      if (!firebaseAuth) return res.status(500).json({ msg: 'Firebase not configured' });

      // Verify email/password via Firebase REST API
      const decoded = await verifyEmailPassword(email, password);

      // Find or create MongoDB user
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

      // Issue JWT token for old client
      const token = await signJwt(user.id);
      res.json({ token });
    }
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
