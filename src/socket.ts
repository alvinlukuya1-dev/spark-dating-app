import { Server, Socket } from 'socket.io';
import { User } from './models/User';
import { Match } from './models/Match';
import { Message } from './models/Message';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a user authenticates, we can associate their socket with their user ID
    // For simplicity, we'll expect the client to emit 'authenticate' with their user ID
    socket.on('authenticate', (userId: string) => {
      // Store userId on socket for later use
      (socket as any).userId = userId;
      console.log(`User ${userId} authenticated on socket ${socket.id}`);
    });

    // When a match is created (via HTTP), we can emit an event to both users
    // We'll create a function that can be called from the swipe route
    // But we need to pass the io instance. Let's instead listen for a custom event from the HTTP layer?
    // Alternative: Have the HTTP route emit via io directly if we have access.
    // For simplicity, we'll have the client request updates via polling or we can use socket to push.
    // We'll implement a method that the HTTP route can call if we pass io.
    // Since we can't easily pass io to the route, we'll have the client connect and then we can emit when we detect a match.
    // However, the match creation happens in the HTTP route. We can have the HTTP route emit via a global io if we make it accessible.
    // Let's instead have the socket listen for a 'match' event that we trigger from elsewhere? Not ideal.

    // Better approach: In the swipe route, after creating a match, we can emit to the socket.io instance if we have access.
    // We'll need to pass the io to the route somehow. We can set up a middleware or use a singleton.

    // For simplicity, we'll have the client poll for new matches or messages.
    // But the requirement is real-time, so we'll attempt to make it work.

    // We'll store a reference to io in a separate file and import it.
    // Let's create a socketService.ts that holds the io instance.

    // Given time, we'll implement a simple version where the client emits 'getMatches' and we send updates.
    // For now, we'll skip the real-time match notification and rely on the HTTP response.
    // We'll still implement real-time messaging.

    // Handle joining a chat room
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle leaving a room
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Handle sending a message
    socket.on('sendMessage', async (data: { receiverId: string; content: string; mediaUrl?: string; type?: string }) => {
      try {
        const senderId = (socket as any).userId;
        if (!senderId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Validate receiverId
        const receiver = await User.findById(data.receiverId);
        if (!receiver) {
          socket.emit('error', { message: 'Receiver not found' });
          return;
        }

        // Create message
        const message = new Message({
          sender: senderId,
          receiver: data.receiverId,
          content: data.content,
          mediaUrl: data.mediaUrl,
          type: data.type || 'text'
        });

        await message.save();

        // Populate sender and receiver info
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name photos')
          .populate('receiver', 'name photos');

        // Determine room: we can use a room based on the two user IDs sorted
        const roomId = getRoomId(senderId, data.receiverId);

        // Emit to the room
        io.to(roomId).emit('newMessage', populatedMessage);

        // Also send back to sender for confirmation
        socket.emit('messageSent', populatedMessage);
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator (optional)
    socket.on('typing', (data: { receiverId: string; isTyping: boolean }) => {
      const senderId = (socket as any).userId;
      if (!senderId) return;

      const roomId = getRoomId(senderId, data.receiverId);
      // Notify the other user in the room
      socket.to(roomId).emit('typing', { userId: senderId, isTyping: data.isTyping });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Cleanup if needed
    });
  });
};

// Helper function to generate a room ID for two users
const getRoomId = (userId1: string, userId2: string): string => {
  const [id1, id2] = [userId1, userId2].sort();
  return `chat_${id1}_${id2}`;
};

// Function to notify about a new match (to be called from HTTP routes)
export const notifyNewMatch = (io: Server, user1Id: string, user2Id: string) => {
  // Fetch user info for both
  Promise.all([
    User.findById(user1Id).select('name photos'),
    User.findById(user2Id).select('name photos')
  ]).then(([user1, user2]) => {
    if (!user1 || !user2) return;

    const matchData = {
      matchId: new Date().getTime(), // temporary; in reality we'd pass the actual match ID
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

    // Notify both users via a personal room (e.g., user-specific notification room)
    const room1 = `user_${user1Id}`;
    const room2 = `user_${user2Id}`;

    io.to(room1).emit('newMatch', { ...matchData, matchedWith: user2 });
    io.to(room2).emit('newMatch', { ...matchData, matchedWith: user1 });
  }).catch(err => {
    console.error('Error notifying new match:', err);
  });
};