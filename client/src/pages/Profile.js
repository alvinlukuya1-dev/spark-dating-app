import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const Profile = () => {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newPreview, setNewPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProfile(await res.json());
      } else {
        setError('Failed to load profile');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await fetch(`/api/posts?user=${user?._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPosts(await res.json());
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openModal = () => { setShowModal(true); };

  const closeModal = () => {
    setShowModal(false);
    setNewContent('');
    setNewImage(null);
    setNewPreview('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewImage(file);
    setNewPreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim() && !newImage) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('content', newContent);
    if (newImage) formData.append('image', newImage);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      const post = await res.json();
      setPosts(prev => [post, ...prev]);
      closeModal();
    }
    setUploading(false);
  };

  if (loading && !profile) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="loading">No profile data</div>;

  return (
    <div className="page">
      <div className="ig-profile">
        <div className="ig-profile-header">
          <img
            src={profile.photos?.[0] || 'https://via.placeholder.com/80x80?text=User'}
            alt={profile.name}
            className="ig-profile-avatar"
          />
          <div className="ig-profile-meta">
            <div className="ig-profile-top">
              <h2>{profile.name}</h2>
              <button className="ig-add-post-btn" onClick={openModal}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
            <div className="ig-profile-stats">
              <span><strong>{posts.length}</strong> posts</span>
            </div>
            <p className="ig-profile-bio">{profile.bio || ''}</p>
            <button onClick={handleLogout} className="ig-logout-btn">Logout</button>
          </div>
        </div>

        <div className="ig-profile-grid">
          {posts.length === 0 && !showModal && <div className="empty-state"><span>📷</span><p>No posts yet</p></div>}
          {posts.map(post => (
            <div key={post._id} className="ig-profile-post" onClick={() => navigate('/posts')}>
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Post</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                maxLength={1000}
              />
              <div className="modal-image-area">
                {newPreview ? (
                  <img src={newPreview} alt="" className="modal-preview" />
                ) : (
                  <button type="button" className="modal-photo-btn" onClick={() => fileRef.current?.click()}>
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Choose Photo</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />
              </div>
              <div className="modal-actions">
                <button type="submit" disabled={uploading || (!newContent.trim() && !newImage)} className="btn btn-primary">
                  {uploading ? 'Posting...' : 'Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
};

export default Profile;
