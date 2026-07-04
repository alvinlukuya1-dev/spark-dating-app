import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Post } from '../models/Post';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    const dir = path.join(process.cwd(), 'uploads/posts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req: any, file: any, cb: any) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.user) filter.user = req.query.user;
    const posts = await Post.find(filter)
      .populate('user', 'name photos')
      .populate('comments.user', 'name photos')
      .sort('-createdAt')
      .limit(50);
    res.json(posts);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/', authenticateToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const image = req.file ? `/uploads/posts/${req.file.filename}` : '';
    const post = new Post({ user: req.user!._id, content, image });
    await post.save();
    const populated = await Post.findById(post._id).populate('user', 'name photos');
    res.json(populated);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/like/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    const userId = req.user!._id;
    const idx = post.likes.findIndex((id: any) => id.equals(userId));
    if (idx > -1) post.likes.splice(idx, 1);
    else post.likes.push(userId as any);
    await post.save();
    const liked = post.likes.some((id: any) => id.equals(userId));
    res.json({ likes: post.likes.length, liked });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/comment/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    post.comments.push({ user: req.user!._id as any, text: req.body.text, createdAt: new Date() });
    await post.save();
    const populated = await Post.findById(post._id).populate('comments.user', 'name photos');
    res.json(populated?.comments);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
