import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

const Chat = () => {
  const { user } = useAuth();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChat();
  }, [matchId]);

  const loadChat = async () => {
    try {
      const res = await fetch(`/api/chat/messages/${matchId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (data.length > 0) {
          const other = data[0].sender._id === user?._id ? data[0].receiver : data[0].sender;
          setPartner(other);
        }
      } else {
        setError('Failed to load messages');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content, mediaUrl, type) => {
    try {
      const res = await fetch(`/api/chat/messages/${matchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content, mediaUrl, type })
      });
      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/matches')}>←</button>
        <h2>{partner?.name || 'Chat'}</h2>
      </div>
      <div className="chat-messages">
        <MessageList messages={messages} currentUserId={user?._id} />
      </div>
      <div className="chat-input">
        <MessageInput onSend={handleSendMessage} receiverId={matchId} />
      </div>
    </div>
  );
};

export default Chat;