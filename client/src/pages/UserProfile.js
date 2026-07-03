import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const UserProfile = () => {
  const { userId } = useParams();
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadPosts();
  }, [userId]);

  const loadUser = async () => {
    try {
      const res = await fetch(`/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUser(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await fetch(`/api/posts?user=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPosts(await res.json());
    } catch {}
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!user) return <div className="error">User not found</div>;

  return (
    <div className="page">
      <div className="ig-profile">
        <div className="ig-profile-header">
          <img
            src={user.photos?.[0] || 'https://via.placeholder.com/80x80?text=User'}
            alt={user.name}
            className="ig-profile-avatar"
          />
          <div className="ig-profile-meta">
            <h2>{user.name}</h2>
            <div className="ig-profile-stats">
              <span><strong>{posts.length}</strong> posts</span>
            </div>
            <p className="ig-profile-bio">{user.bio || ''}</p>
          </div>
        </div>
        <div className="ig-profile-grid">
          {posts.length === 0 && <div className="empty-state"><span>📷</span><p>No posts yet</p></div>}
          {posts.map(post => (
            <div key={post._id} className="ig-profile-post">
              {post.image && <img src={post.image} alt="" />}
              {!post.image && <div className="ig-profile-post-text">{post.content}</div>}
              <div className="ig-profile-post-overlay">
                <span>❤️ {post.likes?.length || 0}</span>
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

export default UserProfile;
