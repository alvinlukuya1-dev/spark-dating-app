import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const Posts = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!content.trim()) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content, image })
    });
    if (res.ok) {
      const post = await res.json();
      setPosts(prev => [post, ...prev]);
      setContent('');
      setImage('');
    }
  };

  const handleLike = async (postId) => {
    const res = await fetch(`/api/posts/like/${postId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const { likes } = await res.json();
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: { length: likes } } : p));
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="posts-page">
        <div className="page-header"><h1>Feed</h1></div>
        <form onSubmit={handleSubmit} className="post-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            maxLength={1000}
          />
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Image URL (optional)"
          />
          <button type="submit" className="btn btn-primary">Post</button>
        </form>
        <div className="posts-feed">
          {posts.length === 0 && <div className="empty-state"><span>📝</span><p>No posts yet. Be the first!</p></div>}
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <img
                  src={post.user?.photos?.[0] || 'https://via.placeholder.com/40x40?text=User'}
                  className="post-avatar"
                  alt=""
                />
                <strong>{post.user?.name || 'Unknown'}</strong>
              </div>
              <p className="post-content">{post.content}</p>
              {post.image && <img src={post.image} alt="" className="post-image" />}
              <div className="post-actions">
                <button onClick={() => handleLike(post._id)} className="post-action-btn">
                  ♥ {post.likes?.length || 0}
                </button>
                <span>💬 {post.comments?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Posts;
