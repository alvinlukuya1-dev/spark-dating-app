import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Post } from '../models/Post';
import { uploadPost, cloudinaryDelete } from '../config/cloudinary';

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
    const userId = req.user!._id.toString();
    const enriched = posts.map(p => {
      const pObj = p.toObject();
      (pObj as any).liked = p.likes.some((id: any) => id.toString() === userId);
      (pObj as any).likeCount = p.likes.length;
      return pObj;
    });
    res.json(enriched);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name photos')
      .populate('comments.user', 'name photos');
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    const pObj = post.toObject();
    (pObj as any).liked = post.likes.some((id: any) => id.toString() === req.user!._id.toString());
    (pObj as any).likeCount = post.likes.length;
    res.json(pObj);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/', authenticateToken, (req: Request, res: Response) => {
  uploadPost.single('image')(req, res, async (err: any) => {
    if (err) {
      console.error('Multer/upload error:', err.message);
      return res.status(400).json({ msg: err.message });
    }
    try {
      const { content } = req.body;
      const image = req.file ? `/uploads/posts/${req.file.filename}` : '';
      if (!content?.trim() && !image) {
        return res.status(400).json({ msg: 'Add text or an image to post' });
      }
      const post = new Post({ user: req.user!._id, content: content || '', image });
      await post.save();
      const populated = await Post.findById(post._id).populate('user', 'name photos');
      const pObj = populated!.toObject();
      (pObj as any).liked = false;
      (pObj as any).likeCount = 0;
      res.json(pObj);
    } catch (err: any) {
      console.error('POST /api/posts error:', err);
      res.status(500).json({ msg: err.message });
    }
  });
});

router.delete('/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    if (post.user.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    if (post.image) await cloudinaryDelete(post.image);
    await Post.findByIdAndDelete(req.params.postId);
    res.json({ msg: 'Post deleted' });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
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
    res.json({ likeCount: post.likes.length, liked });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
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
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
