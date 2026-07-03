import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SwipeCard from '../components/SwipeCard';
import NavBar from '../components/NavBar';

const Discover = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [index, setIndex] = useState(0);
  const [matchModal, setMatchModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchedWith, setMatchedWith] = useState(null);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const res = await fetch('/api/swipe/suggestions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setPeople(data);
        setIndex(0);
      } else {
        console.error('Failed to load people');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (index >= people.length) return;
    const person = people[index];
    try {
      const res = await fetch(`/api/swipe/like/${person._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isMatch) {
          setMatchedWith(person);
          setMatchModal(true);
        }
        // Move to next person
        setIndex(prev => prev + 1);
        if (index >= people.length - 1) {
          loadMore();
        }
      } else {
        alert(data.msg || 'Failed to like');
      }
    } catch (err) {
      console.error('Error liking:', err);
    }
  };

  const handlePass = async () => {
    if (index >= people.length) return;
    const person = people[index];
    try {
      const res = await fetch(`/api/swipe/pass/${person._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        setIndex(prev => prev + 1);
        if (index >= people.length - 1) {
          loadMore();
        }
      } else {
        alert('Failed to pass');
      }
    } catch (err) {
      console.error('Error passing:', err);
    }
  };

  const loadMore = async () => {
    // In a real app, we'd paginate; for now just reload
    loadPeople();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="page">
      <div className="discover-page">
        {matchModal && matchedWith && (
          <div className="match-modal-overlay" onClick={() => setMatchModal(false)}>
            <div className="match-modal" onClick={e => e.stopPropagation()}>
              <div className="match-icon">💖</div>
              <h2>It's a Match!</h2>
              <p>You and {matchedWith.name} liked each other.</p>
              <button className="btn btn-primary" onClick={() => {
                setMatchModal(false);
                navigate(`/chat/${matchedWith._id}`);
              }}>
                Send a Message
              </button>
              <button className="btn btn-outline" onClick={() => setMatchModal(false)}>
                Keep Swiping
              </button>
            </div>
          </div>
        )}
        <div className="swipe-container">
          {people[index] ? (
            <SwipeCard
              person={people[index]}
              onLike={handleLike}
              onPass={handlePass}
            />
          ) : people.length > 0 ? (
            <div className="no-more">
              <span>📭</span>
              <p>No more profiles right now</p>
            </div>
          ) : loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="no-more">
              <span>🔍</span>
              <p>No profiles found. Check back later!</p>
            </div>
          )}
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Discover;