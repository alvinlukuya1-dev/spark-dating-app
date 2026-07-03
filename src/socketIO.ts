import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocketIO = (httpServer: http.Server) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Set up socket event listeners
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Authentication
    socket.on('authenticate', (userId: string) => {
      (socket as any).userId = userId;
      socket.join(userId); // Join a personal room for notifications
      console.log(`User ${userId} authenticated`);
    });

    // Join chat room
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
    });

    // Leave chat room
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
    });

    // Send message
    socket.on('sendMessage', async (data: { receiverId: string; content: string; mediaUrl?: string; type?: string }) => {
      try {
        const senderId = (socket as any).userId;
        if (!senderId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Save message to DB (we'll import Message model)
        const { Message } = require('./models/Message');
        const message = new Message({
          sender: senderId,
          receiver: data.receiverId,
          content: data.content,
          mediaUrl: data.mediaUrl,
          type: data.type || 'text'
        });

        await message.save();

        // Populate for sending
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name photos')
          .populate('receiver', 'name photos');

        // Determine room
        const roomId = getRoomId(senderId, data.receiverId);
        io.to(roomId).emit('newMessage', populatedMessage);
        socket.emit('messageSent', populatedMessage);
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { receiverId: string; isTyping: boolean }) => {
      const senderId = (socket as any).userId;
      if (!senderId) return;
      const roomId = getRoomId(senderId, data.receiverId);
      socket.to(roomId).emit('typing', { userId: senderId, isTyping: data.isTyping });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getRoomId = (id1: string, id2: string): string => {
  const [a, b] = [id1, id2].sort();
  return `chat_${a}_${b}`;
};

// Function to notify about a new match
export const notifyNewMatch = (io: Server, user1Id: string, user2Id: string) => {
  // Fetch user info for both
  const { User } = require('./models/User');
  Promise.all([
    User.findById(user1Id).select('name photos'),
    User.findById(user2Id).select('name photos')
  ]).then(([user1, user2]) => {
    if (!user1 || !user2) return;

    const matchData = {
      matchId: new Date().getTime(), // placeholder; we'll send actual match ID from caller
      user1: {
        id: user1._id,
        name: user1.name,
        photos: user1.photos
      },
      user2: {
        id: user2._id,
        name: user2.name,
        photos: user2.photos
      },
      matchedAt: new Date()
    };

    // Notify both users via their personal rooms
    const room1 = `user_${user1Id}`;
    const room2 = `user_${user2Id}`;

    io.to(room1).emit('newMatch', { ...matchData, matchedWith: user2 });
    io.to(room2).emit('newMatch', { ...matchData, matchedWith: user1 });
  }).catch(err => {
    console.error('Error notifying new match:', err);
  });
};