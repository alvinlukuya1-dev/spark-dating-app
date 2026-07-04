import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Post } from '../models/Post';
import { uploadPost } from '../config/cloudinary';

const router = Router();

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

router.post('/', authenticateToken, uploadPost.single('image'), async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const image = (req.file as any)?.path || '';
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
