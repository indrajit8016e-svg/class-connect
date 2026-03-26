import './config.js'; // MUST BE FIRST

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pool from './db/index.js';
import { initDb } from './db/init.js';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dmRoutes from './routes/dmRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize DB
initDb();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(path.dirname(__dirname), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dms', dmRoutes);

app.get('/', (req, res) => {
  res.send('ClassConnect API is running');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Max limit is 10MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  
  if (err.message && (err.message.includes('Invalid file type') || err.message.includes('not supported'))) {
    return res.status(400).json({ message: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Typing State Management
const typingUsers: Record<string, Record<string, { userName: string, lastTimestamp: number }>> = {};

const broadcastTyping = (channelId: string) => {
  if (!typingUsers[channelId]) {
    io.to(channelId).emit('typing_users', []);
    return;
  }
  
  const users = Object.entries(typingUsers[channelId]).map(([id, data]) => ({
    id,
    userName: data.userName,
  }));
  
  io.to(channelId).emit('typing_users', users);
};

// Cleanup stale typing users every 3 seconds
setInterval(() => {
  const now = Date.now();
  let changed = false;
  
  for (const channelId in typingUsers) {
    let channelChanged = false;
    for (const userId in typingUsers[channelId]) {
      if (now - typingUsers[channelId][userId].lastTimestamp > 5000) { // 5s auto-expiry
        delete typingUsers[channelId][userId];
        channelChanged = true;
        changed = true;
      }
    }
    if (channelChanged) broadcastTyping(channelId);
  }
}, 3000);

// Online users tracking
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_user', (userId) => {
    if (!userId) return;
    
    socket.join(`user_${userId}`);
    
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);
    
    console.log(`User ${userId} is online (${onlineUsers.get(userId)!.size} connections)`);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('join_channel', (channelId) => {
    if (!channelId) return;
    socket.join(channelId);
    console.log(`User ${socket.id} joined channel ${channelId}`);
    broadcastTyping(channelId);
  });

  socket.on('send_message', (data) => {
    io.to(data.channelId).emit('receive_message', data);
    
    if (data.group_id) {
      io.to(`group_${data.group_id}`).emit('group_notification', data);
    }
    
    if (typingUsers[data.channelId]?.[data.senderId]) {
      delete typingUsers[data.channelId][data.senderId];
      broadcastTyping(data.channelId);
    }
  });

  socket.on('send_dm', (data) => {
    io.to(`user_${data.receiver_id}`).emit('receive_dm', data);
    io.to(`user_${data.sender_id}`).emit('receive_dm', data);
  });

  socket.on('join_group', (groupId) => {
    if (!groupId) return;
    socket.join(`group_${groupId}`);
    console.log(`User ${socket.id} joined group room group_${groupId}`);
  });

  socket.on('update_message', (data) => {
    io.to(data.channelId).emit('update_message', data);
  });

  socket.on('typing_start', (data: { channelId: string, userId: string, userName: string }) => {
    if (!data.channelId || !data.userId) return;
    if (!typingUsers[data.channelId]) typingUsers[data.channelId] = {};
    
    typingUsers[data.channelId][data.userId] = {
      userName: data.userName,
      lastTimestamp: Date.now(),
    };
    broadcastTyping(data.channelId);
  });

  socket.on("typing_stop", (data: { channelId: string, userId: string }) => {
    if (!data.channelId || !data.userId) return;
    if (typingUsers[data.channelId]?.[data.userId]) {
      delete typingUsers[data.channelId][data.userId];
      broadcastTyping(data.channelId);
    }
  });

  socket.on('dm_typing_start', (data: { receiverId: string, userId: string, userName: string }) => {
    if (!data.receiverId || !data.userId) return;
    io.to(`user_${data.receiverId}`).emit('dm_typing_start', {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('dm_typing_stop', (data: { receiverId: string, userId: string }) => {
    if (!data.receiverId || !data.userId) return;
    io.to(`user_${data.receiverId}`).emit('dm_typing_stop', {
      userId: data.userId
    });
  });

  socket.on('disconnect', () => {

    console.log('User disconnected:', socket.id);
    
    let disconnectedUserId = null;
    for (const [userId, socketIds] of onlineUsers.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          onlineUsers.delete(userId);
          disconnectedUserId = userId;
        }
        break;
      }
    }
    
    if (disconnectedUserId) {
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
