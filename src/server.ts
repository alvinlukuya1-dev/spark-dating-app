import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import swipeRoutes from './routes/swipe';
import chatRoutes from './routes/chat';
import postRoutes from './routes/posts';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import { Post } from './models/Post';
import { setupSocket, notifyNewMatch } from './socket';


dotenv.config();
mongoose.set('strictQuery', true);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
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
app.use('/api/notifications', notificationRoutes);

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
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
  });
});

app.all('/api/debug-headers', (req, res) => {
  res.json({
    method: req.method,
    headers: req.headers,
    body: req.body
  });
});

setupSocket(io);

const PORT = 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datingapp';

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error (app will work once MongoDB is running):', err.message));
});