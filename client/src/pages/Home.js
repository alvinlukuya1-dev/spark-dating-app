import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => (
  <svg viewBox="0 0 100 100" width="100" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff" stopOpacity="1" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <path d="M50 88C50 88 16 60 16 38C16 24 26 14 40 14C46 14 50 17 50 17C50 17 54 14 60 14C74 14 84 24 84 38C84 60 50 88 50 88Z" fill="url(#heartGrad)" opacity="0.95" />
    <path d="M38 38C38 38 42 30 50 30C58 30 62 38 62 38" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
  </svg>
);

const Home = () => {
  return (
    <div className="home">
      <div className="logo"><Logo /></div>
      <h1>Pwani Sparks</h1>
      <p>Discover new connections. Swipe, match, and chat with people around you.</p>
      <div className="buttons">
        <Link to="/login" className="btn btn-primary">
          Login
        </Link>
        <Link to="/register" className="btn btn-secondary">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Home;