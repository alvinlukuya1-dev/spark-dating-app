import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

const Chat = () => {
  const { user } = useAuth();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected, joinRoom } = useSocket();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(location.state?.partner || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const roomId = [user?._id, matchId].sort().join('_');

  useEffect(() => {
    if (!socket || !connected) return;
    joinRoom(`chat_${roomId}`);
  }, [socket, connected, roomId, joinRoom]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    };
    socket.on('newMessage', handler);
    return () => socket.off('newMessage', handler);
  }, [socket]);

  const loadChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/messages/${matchId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (data.length > 0 && !partner) {
          const other = data[0].sender._id === user?._id ? data[0].receiver : data[0].sender;
          setPartner(other);
        }
      } else setError('Failed to load messages');
    } catch { setError('Network error');
    } finally { setLoading(false); }
  }, [matchId, user?._id, partner]);

  useEffect(() => { loadChat(); }, [loadChat]);

  const handleSendMessage = async (content, mediaUrl, type) => {
    await fetch(`/api/chat/messages/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ content, mediaUrl, type })
    });
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/matches')}>←</button>
        <img src={partner?.photos?.[0] || 'https://via.placeholder.com/36x36?text=User'} alt="" className="chat-partner-avatar" />
        <div className="chat-partner-info">
          <h2>{partner?.name || 'Chat'}</h2>
          <span className={`socket-status ${connected ? 'online' : 'offline'}`} />
        </div>
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
