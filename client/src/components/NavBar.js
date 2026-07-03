import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const location = useLocation();

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
      <Link to="/profile" className={isActive('/profile')}>
        <span>👤</span>
        Profile
      </Link>
    </nav>
  );
};

export default NavBar;
