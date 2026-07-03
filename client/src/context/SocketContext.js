import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = 'https://pwani-sparks.onrender.com';

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('authenticate', user?._id || user?.id);
    });

    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, user]);

  const sendMessage = (receiverId, content, mediaUrl, type) => {
    socketRef.current?.emit('sendMessage', { receiverId, content, mediaUrl, type });
  };

  const joinRoom = (roomId) => {
    socketRef.current?.emit('joinRoom', roomId);
  };

  const value = { socket: socketRef.current, connected, sendMessage, joinRoom };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
