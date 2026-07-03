import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NavBar = () => {
  const location = useLocation();
  const { dark, toggle } = useTheme();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="nav">
      <Link to="/discover" className={isActive('/discover')}>
        <span>🔥</span>
        Discover
      </Link>
      <Link to="/matches" className={isActive('/matches')}>
        <span>💬</span>
        Matches
      </Link>
      <Link to="/posts" className={isActive('/posts')}>
        <span>📝</span>
        Feed
      </Link>
      <Link to="/profile" className={isActive('/profile')}>
        <span>👤</span>
        Profile
      </Link>
      <button onClick={toggle} className="theme-btn" title={dark ? 'Light mode' : 'Dark mode'}>
        {dark ? '☀️' : '🌙'}
      </button>
    </nav>
  );
};

export default NavBar;
