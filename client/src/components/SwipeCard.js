import React, { useState, useRef } from 'react';

const SwipeCard = ({ person, onLike, onPass }) => {
  const startX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const handleDragStart = (clientX) => {
    setIsDragging(true);
    startX.current = clientX;
    setOffsetX(0);
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    const diff = clientX - startX.current;
    setOffsetX(diff);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (offsetX > 100) {
      onLike();
    } else if (offsetX < -100) {
      onPass();
    }
    setOffsetX(0);
  };

  const getAge = () => {
    if (!person.birthDate) return '??';
    const birth = new Date(person.birthDate);
    const age = new Date().getFullYear() - birth.getFullYear();
    return age;
  };

  const cardStyle = {
    transform: `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease',
  };

  return (
    <div className="swipe-card-wrapper">
      <div
        className="swipe-card"
        ref={cardRef}
        style={cardStyle}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => { if (isDragging) handleDragEnd(); }}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        <div className="card-image">
          <img src={person.photos?.[0] || 'https://via.placeholder.com/400x500?text=No+Photo'} alt={person.name} />
          {offsetX > 50 && <div className="swipe-label like-label">LIKE</div>}
          {offsetX < -50 && <div className="swipe-label pass-label">NOPE</div>}
        </div>
        <div className="card-info">
          <h3>{person.name}, {getAge()}</h3>
          <p>{person.bio || 'No bio available'}</p>
          {person.interests?.length > 0 && (
            <div className="interests">
              {person.interests.map((i, idx) => (
                <span key={idx} className="interest-tag">{i}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card-actions">
        <button onClick={onPass} className="action-btn pass-btn">✕</button>
        <button onClick={onLike} className="action-btn like-btn">♥</button>
      </div>
    </div>
  );
};

export default SwipeCard;