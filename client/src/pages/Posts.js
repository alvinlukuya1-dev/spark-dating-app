import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const Posts = () => {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [liking, setLiking] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPosts(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      const post = await res.json();
      setPosts(prev => [post, ...prev]);
      setContent('');
      setImageFile(null);
      setPreview('');
    }
    setUploading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleLike = async (postId) => {
    if (liking[postId]) return;
    setLiking(prev => ({ ...prev, [postId]: true }));
    const res = await fetch(`/api/posts/like/${postId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const { likes, liked } = await res.json();
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: { count: likes, liked } } : p));
    }
    setLiking(prev => ({ ...prev, [postId]: false }));
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    const res = await fetch(`/api/posts/comment/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [...(p.comments || []), { user: { name: user?.name, photos: user?.photos }, text, createdAt: new Date() }] } : p));
      setCommentText(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const isLiked = (post) => {
    if (post.likes?.liked !== undefined) return post.likes.liked;
    return post.likes?.length > 0;
  };

  const likeCount = (post) => {
    if (post.likes?.count !== undefined) return post.likes.count;
    return post.likes?.length || 0;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="ig-feed">
        <div className="ig-header">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <div className="ig-top-search">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) { navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); } }}
              placeholder="Search users..."
            />
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="ig-create">
          <div className="ig-create-top">
            <img src={user?.photos?.[0] || 'https://via.placeholder.com/32x32?text=U'} alt="" className="ig-create-avatar" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind?" rows={2} maxLength={1000} />
          </div>
          {preview && <img src={preview} alt="" className="ig-create-preview" />}
          <div className="ig-create-bottom">
            <button type="button" className="ig-photo-btn" onClick={() => fileRef.current?.click()}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />
            {imageFile && <span className="ig-file-name">{imageFile.name}</span>}
            <button type="submit" disabled={uploading || (!content.trim() && !imageFile)} className="ig-post-btn">{uploading ? 'Posting...' : 'Share'}</button>
          </div>
        </form>
        <div className="ig-posts">
          {posts.length === 0 && <div className="empty-state"><span>📷</span><p>No posts yet</p></div>}
          {posts.map(post => {
            const liked = isLiked(post);
            return (
              <div key={post._id} className="ig-card">
                <div className="ig-card-header">
                  <img src={post.user?.photos?.[0] || 'https://via.placeholder.com/32x32?text=User'} alt="" className="ig-card-avatar" />
                  <div className="ig-card-user">
                    <strong>{post.user?.name || 'Unknown'}</strong>
                    <span className="ig-card-time">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                {post.image && (
                  <div className="ig-card-image" onDoubleClick={() => handleLike(post._id)}>
                    <img src={post.image} alt="" />
                    {liked && <div className="ig-heart-anim">❤️</div>}
                  </div>
                )}
                <div className="ig-card-body">
                  <div className="ig-card-actions">
                    <button onClick={() => handleLike(post._id)} className={`ig-action-btn ${liked ? 'liked' : ''}`}>
                      <svg viewBox="0 0 24 24" width="24" height="24" fill={liked ? '#ed4956' : 'none'} stroke={liked ? '#ed4956' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                    <span className="ig-likes">{likeCount(post)} {likeCount(post) === 1 ? 'like' : 'likes'}</span>
                  </div>
                  <div className="ig-card-caption">
                    <strong>{post.user?.name}</strong> {post.content}
                  </div>
                  {post.comments?.length > 0 && (
                    <div className="ig-comments">
                      {post.comments.map((c, i) => (
                        <div key={i} className="ig-comment">
                          <strong>{c.user?.name || 'User'}</strong> {c.text}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="ig-comment-form">
                    <input
                      value={commentText[post._id] || ''}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                      placeholder="Add a comment..."
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleComment(post._id); } }}
                    />
                    <button
                      onClick={() => handleComment(post._id)}
                      disabled={!commentText[post._id]?.trim()}
                      className="ig-comment-btn"
                    >Post</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Posts;
