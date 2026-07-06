import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      setNotifications(prev => {
        const exists = prev.some(n => n._id === notification._id);
        return exists ? prev : [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    };
    socket.on('newNotification', handler);
    return () => socket.off('newNotification', handler);
  }, [socket]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = async (notification) => {
    try {
      await fetch(`/api/notifications/read/${notification._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch {}
    setOpen(false);
    if (notification.type === 'match' || notification.type === 'message') {
      navigate(`/chat/${notification.from._id}`, { state: { partner: notification.from } });
    }
  };

  const getIcon = (type) => {
    if (type === 'match') return '💕';
    if (type === 'message') return '💬';
    return '❤️';
  };

  return (
    <nav className="nav">
      <Link to="/discover" className={isActive('/discover')}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c.5 3 4 5 4 9 0 2.5-2 4.5-4 4.5S8 14.5 8 12c0-4 3.5-6 4-9z"/>
          <path d="M12 16.5c1.5 0 2.5-1 2.5-2.5 0-2.5-2-4-2.5-7-.5 3-2.5 4.5-2.5 7 0 1.5 1 2.5 2.5 2.5z"/>
        </svg>
        <span>Discover</span>
      </Link>
      <Link to="/matches" className={isActive('/matches')}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Matches</span>
      </Link>
      <Link to="/posts" className={isActive('/posts')}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <span>Feed</span>
      </Link>
      <div className={`nav-notif ${open ? 'active' : ''}`} ref={dropdownRef}>
        <button className={`notif-bell ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
          <span className="notif-icon-wrap">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </span>
          <span>Inbox</span>
        </button>
        {open && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <span className="notif-title">Inbox</span>
              {unreadCount > 0 && (
                <button className="notif-mark-read" onClick={handleMarkAllRead}>Mark all read</button>
              )}
            </div>
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">No notifications yet</div>
              ) : (
                notifications.map(n => (
                  <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => handleNotificationClick(n)}>
                    <div className="notif-item-avatar">
                      <img src={n.from?.photos?.[0] || 'https://via.placeholder.com/40x40?text=User'} alt="" />
                    </div>
                    <div className="notif-item-body">
                      <span className="notif-item-text">
                        {n.type === 'match' ? <>You matched with <strong>{n.from?.name}</strong></> : null}
                        {n.type === 'message' ? <><strong>{n.from?.name}</strong> sent you a message</> : null}
                        {n.type === 'like' ? <><strong>{n.from?.name}</strong> liked you</> : null}
                      </span>
                      <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                    </div>
                    <span className="notif-item-icon">{getIcon(n.type)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <Link to="/profile" className={isActive('/profile')}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Profile</span>
      </Link>
      <button onClick={toggle} className="theme-btn" title={dark ? 'Light mode' : 'Dark mode'}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {dark ? (
            <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
          ) : (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          )}
        </svg>
      </button>
    </nav>
  );
};

export default NavBar;
