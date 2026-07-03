import React from 'react';

const MatchCard = ({ match, onClick }) => {
  const { user, matchedAt } = match;
  const date = new Date(matchedAt).toLocaleDateString();

  return (
    <div className="match-card" onClick={() => onClick(match)}>
      <div className="match-avatar">
        <img src={user.photos?.[0] || 'https://via.placeholder.com/80x80?text=User'} alt={user.name} />
      </div>
      <div className="match-info">
        <h3>{user.name}</h3>
        <p className="match-date">Matched {date}</p>
      </div>
    </div>
  );
};

export default MatchCard;