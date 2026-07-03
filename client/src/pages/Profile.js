import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="loading">No profile data</div>;

  return (
    <div className="page">
      <div className="profile-page">
        <div className="profile-header">
          <img
            src={profile.photos?.[0] || 'https://via.placeholder.com/120x120?text=User'}
            alt={profile.name}
            className="profile-avatar"
          />
          <h2>{profile.name}</h2>
          <p>{profile.bio || 'No bio yet'}</p>
        </div>
        <div className="profile-details">
          <div className="detail-item">
            <label>Username</label>
            <span>{profile.username}</span>
          </div>
          <div className="detail-item">
            <label>Email</label>
            <span>{profile.email}</span>
          </div>
          <div className="detail-item">
            <label>Gender</label>
            <span>{profile.gender || 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <label>Looking for</label>
            <span>{profile.lookingFor || 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <label>Location</label>
            <span>{profile.location || 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <label>Interests</label>
            <span>
              {profile.interests?.length > 0
                ? profile.interests.join(', ')
                : 'None added'}
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Profile;