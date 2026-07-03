import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

const Chat = () => {
  const { user } = useAuth();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { connected, sendMessage: socketSend } = useSocket();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);

  const loadChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/messages/${matchId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (data.length > 0) {
          const other = data[0].sender._id === user?._id ? data[0].receiver : data[0].sender;
          setPartner(other);
        } else {
          const matchRes = await fetch('/api/swipe/matches', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (matchRes.ok) {
            const matches = await matchRes.json();
            const m = matches.find(m => m.matchId === matchId || m.user?.id === matchId);
            if (m) setPartner(m.user);
          }
        }
      } else setError('Failed to load messages');
    } catch { setError('Network error');
    } finally { setLoading(false); }
  }, [matchId, user?._id]);

  useEffect(() => { loadChat(); }, [loadChat]);

  const handleSendMessage = async (content, mediaUrl, type) => {
    if (socketSend && connected) {
      socketSend(matchId, content, mediaUrl, type);
    }
    const res = await fetch(`/api/chat/messages/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ content, mediaUrl, type })
    });
    if (res.ok) {
      const newMessage = await res.json();
      setMessages(prev => [...prev, newMessage]);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/matches')}>←</button>
        <h2>{partner?.name || 'Chat'}</h2>
        <span className={`socket-status ${connected ? 'online' : 'offline'}`} />
      </div>
      <div className="chat-messages">
        <MessageList messages={messages} currentUserId={user?._id} />
        {typing && <div className="typing-indicator"><span /><span /><span /></div>}
      </div>
      <div className="chat-input">
        <MessageInput onSend={handleSendMessage} receiverId={matchId} />
      </div>
    </div>
  );
};

export default Chat;
