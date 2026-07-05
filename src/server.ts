import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import swipeRoutes from './routes/swipe';
import chatRoutes from './routes/chat';
import postRoutes from './routes/posts';
import searchRoutes from './routes/search';
import { Post } from './models/Post';
import { setupSocket, notifyNewMatch } from './socket';
import { initGridFS, getGridFS } from './config/cloudinary';

dotenv.config();
mongoose.set('strictQuery', true);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);
app.set('notifyNewMatch', notifyNewMatch);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', searchRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.post('/api/cleanup-posts', async (_req, res) => {
  try {
    const result = await Post.deleteMany({});
    res.json({ msg: `Deleted ${result.deletedCount} posts` });
  } catch (err: any) {
    res.status(500).json({ msg: err.message });
  }
});

app.get('/api/debug-env', (_req, res) => {
  res.json({
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
  });
});

app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const gfs = getGridFS();
    const downloadStream = gfs.openDownloadStream(new ObjectId(req.params.fileId));
    downloadStream.on('error', () => res.status(404).json({ msg: 'File not found' }));
    downloadStream.pipe(res);
  } catch {
    res.status(404).json({ msg: 'File not found' });
  }
});

setupSocket(io);

const PORT = 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datingapp';

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      initGridFS();
    })
    .catch((err) => console.error('MongoDB connection error (app will work once MongoDB is running):', err.message));
});