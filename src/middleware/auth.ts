import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { firebaseAuth } from '../config/firebase';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      firebaseUid?: string;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  if (!firebaseAuth) {
    return res.status(500).json({ msg: 'Firebase not configured' });
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.firebaseUid = decoded.uid;
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return res.status(401).json({ msg: 'User not found. Please register.' });
    }
    req.user = user;
    next();
  } catch (err: any) {
    console.error('Firebase token verification error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
