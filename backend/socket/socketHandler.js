import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Block from '../models/Block.js';
import {
  addToQueue,
  removeFromQueue,
  findMatch,
  endMatchSession,
  getActiveMatchByUserId,
} from '../services/matchmaking/matchQueue.js';

// Connected sockets map: userId -> socketId
const onlineSocketsMap = new Map();

const broadcastOnlineCount = (io) => {
  if (!io) return;
  const count = onlineSocketsMap.size;
  io.emit('online:count', { onlineCount: count });
};

export const initSocketServer = (io) => {
  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'privacy_dating_secret_key_18plus');
      const user = await User.findById(decoded.id).select(
        '_id username gender country state district accountStatus privacySettings publicKey'
      );

      if (!user || user.accountStatus !== 'active') {
        return next(new Error('Authentication error: User inactive or banned'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineSocketsMap.set(userId, socket.id);
    broadcastOnlineCount(io);

    // 1. MATCHMAKING ENGINE EVENTS
    socket.on('match:start', async ({ genderPref = 'everyone', placePref = 'all' }) => {
      const userSession = {
        userId,
        socketId: socket.id,
        username: socket.user.username,
        gender: socket.user.gender,
        country: socket.user.country,
        state: socket.user.state,
        district: socket.user.district,
        publicKey: socket.user.publicKey || '',
        genderPref: genderPref.toLowerCase(),
        placePref: placePref,
      };

      // Clean any existing match session
      const existingMatch = getActiveMatchByUserId(userId);
      if (existingMatch) {
        endMatchSession(existingMatch.matchId);
      }

      // Add user to searching queue
      addToQueue(userSession);
      socket.emit('match:searching');

      // Attempt to find mutually compatible waiting user
      const match = await findMatch(userSession);
      if (match) {
        // Match Found! Join both users to a private socket room
        const socketA = io.sockets.sockets.get(match.userA.socketId);
        const socketB = io.sockets.sockets.get(match.userB.socketId);

        if (socketA) socketA.join(match.roomName);
        if (socketB) socketB.join(match.roomName);

        // Notify User A
        io.to(match.userA.socketId).emit('match:found', {
          matchId: match.matchId,
          partner: {
            _id: match.userB.userId,
            username: match.userB.username,
            gender: match.userB.gender,
            state: match.userB.state,
            district: match.userB.district,
            publicKey: match.userB.publicKey,
          },
          isInitiator: true, // Caller initiates WebRTC offer
        });

        // Notify User B
        io.to(match.userB.socketId).emit('match:found', {
          matchId: match.matchId,
          partner: {
            _id: match.userA.userId,
            username: match.userA.username,
            gender: match.userA.gender,
            state: match.userA.state,
            district: match.userA.district,
            publicKey: match.userA.publicKey,
          },
          isInitiator: false,
        });
      }
    });

    // 2. INSTANT "NEXT" MATCHING BUTTON
    socket.on('match:next', async ({ genderPref = 'everyone', placePref = 'all' }) => {
      const activeMatch = getActiveMatchByUserId(userId);
      if (activeMatch) {
        const partnerUserId = activeMatch.userA.userId === userId ? activeMatch.userB.userId : activeMatch.userA.userId;
        const partnerSocketId = onlineSocketsMap.get(partnerUserId);

        // Notify partner that user left
        if (partnerSocketId) {
          io.to(partnerSocketId).emit('match:partner_left');
        }

        endMatchSession(activeMatch.matchId);
      }

      // Re-trigger matchmaking for candidate user
      const userSession = {
        userId,
        socketId: socket.id,
        username: socket.user.username,
        gender: socket.user.gender,
        country: socket.user.country,
        state: socket.user.state,
        district: socket.user.district,
        publicKey: socket.user.publicKey || '',
        genderPref: genderPref.toLowerCase(),
        placePref: placePref,
      };

      addToQueue(userSession);
      socket.emit('match:searching');

      const match = await findMatch(userSession);
      if (match) {
        const socketA = io.sockets.sockets.get(match.userA.socketId);
        const socketB = io.sockets.sockets.get(match.userB.socketId);

        if (socketA) socketA.join(match.roomName);
        if (socketB) socketB.join(match.roomName);

        io.to(match.userA.socketId).emit('match:found', {
          matchId: match.matchId,
          partner: {
            _id: match.userB.userId,
            username: match.userB.username,
            gender: match.userB.gender,
            state: match.userB.state,
            district: match.userB.district,
            publicKey: match.userB.publicKey,
          },
          isInitiator: true,
        });

        io.to(match.userB.socketId).emit('match:found', {
          matchId: match.matchId,
          partner: {
            _id: match.userA.userId,
            username: match.userA.username,
            gender: match.userA.gender,
            state: match.userA.state,
            district: match.userA.district,
            publicKey: match.userA.publicKey,
          },
          isInitiator: false,
        });
      }
    });

    // 3. CANCEL MATCHMAKING SEARCH
    socket.on('match:cancel', () => {
      removeFromQueue(userId);
      socket.emit('match:cancelled');
    });

    // 4. REAL-TIME E2EE TEXT CHAT RELAY IN MATCH ROOM
    socket.on('message:send', ({ matchId, recipientId, ciphertext, iv, senderPublicKey }) => {
      if (!recipientId || !ciphertext || !iv) return;

      const recipientSocketId = onlineSocketsMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:receive', {
          matchId,
          senderId: userId,
          ciphertext,
          iv,
          senderPublicKey: senderPublicKey || socket.user.publicKey,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 5. TYPING INDICATORS IN MATCH
    socket.on('typing:start', ({ recipientId }) => {
      const recipientSocketId = onlineSocketsMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:start', { senderId: userId });
      }
    });

    socket.on('typing:stop', ({ recipientId }) => {
      const recipientSocketId = onlineSocketsMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:stop', { senderId: userId });
      }
    });

    // 6. WEBRTC VOICE & VIDEO SIGNALING IN MATCH ROOM
    socket.on('webrtc:offer', ({ targetUserId, offer }) => {
      const targetSocketId = onlineSocketsMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:offer', { senderId: userId, offer });
      }
    });

    socket.on('webrtc:answer', ({ targetUserId, answer }) => {
      const targetSocketId = onlineSocketsMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:answer', { senderId: userId, answer });
      }
    });

    socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
      const targetSocketId = onlineSocketsMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:ice-candidate', { senderId: userId, candidate });
      }
    });

    // 7. DISCONNECT CLEANUP
    socket.on('disconnect', () => {
      onlineSocketsMap.delete(userId);
      removeFromQueue(userId);
      broadcastOnlineCount(io);

      const activeMatch = getActiveMatchByUserId(userId);
      if (activeMatch) {
        const partnerUserId = activeMatch.userA.userId === userId ? activeMatch.userB.userId : activeMatch.userA.userId;
        const partnerSocketId = onlineSocketsMap.get(partnerUserId);

        if (partnerSocketId) {
          io.to(partnerSocketId).emit('match:partner_left');
        }

        endMatchSession(activeMatch.matchId);
      }
    });
  });
};

export { onlineSocketsMap };
