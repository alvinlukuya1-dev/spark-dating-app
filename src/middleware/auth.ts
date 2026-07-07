import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { firebaseAuth } from '../config/firebase';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      firebaseUid?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Try Firebase ID token first (new client)
  if (firebaseAuth) {
    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      req.firebaseUid = decoded.uid;
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user) {
        return res.status(401).json({ msg: 'User not found. Please register.' });
      }
      req.user = user;
      return next();
    } catch {
      // Fall through to JWT verification
    }
  }

  // Fallback to JWT verification (old client)
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.user?.id);
    if (!user) {
      return res.status(401).json({ msg: 'User not found. Please register.' });
    }
    req.user = user;
    next();
  } catch (err: any) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
