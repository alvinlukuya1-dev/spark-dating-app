import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import NavBar from '../components/NavBar';

const Matches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await fetch('/api/swipe/matches', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      } else {
        setError('Failed to load matches');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = (match) => {
    navigate(`/chat/${match.user.id}`, { state: { partner: match.user } });
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <div className="matches-page">
        <div className="page-header">
          <h1>Matches</h1>
        </div>
        {matches.length === 0 ? (
          <div className="empty-state">
            <span>💕</span>
            <p>No matches yet. Start swiping!</p>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map(match => (
              <MatchCard
                key={match.matchId}
                match={match}
                onClick={handleMatchClick}
              />
            ))}
          </div>
        )}
      </div>
      <NavBar />
    </div>
  );
};

export default Matches;