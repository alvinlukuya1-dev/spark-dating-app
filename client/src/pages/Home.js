import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home">
      <div className="logo">💖</div>
      <h1>Spark</h1>
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