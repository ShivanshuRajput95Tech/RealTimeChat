import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import jwt from 'jsonwebtoken';
import { connectDB } from './lib/db.js';
import { errorHandler } from './lib/errors.js';
import logger from './lib/logger.js';
import config from './config/env.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

export const userSocketMap = new Map();

io.use((socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      logger.warn('Socket connection failed: token required', { socketId: socket.id });
      return next(new Error('Authentication error: token required'));
    }

    token = token.replace(/^Bearer\s+/i, '');
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded.userId;
    logger.debug('Socket authenticated', { userId: decoded.userId, socketId: socket.id });
    return next();
  } catch (err) {
    logger.warn('Socket authentication failed', { error: err.message, socketId: socket.id });
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  logger.info('User connected', { userId, socketId: socket.id });

  if (userId) {
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);
    logger.debug('User socket mapped', {
      userId,
      socketId: socket.id,
      totalSockets: userSocketMap.get(userId).size,
    });
  }

  io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));

  socket.on('typing', (data) => {
    if (data.receiverId && userSocketMap.has(data.receiverId)) {
      for (const socketId of userSocketMap.get(data.receiverId)) {
        io.to(socketId).emit('typing', { userId });
      }
      logger.debug('Typing event transmitted', { from: userId, to: data.receiverId });
    }
  });

  socket.on('stopTyping', (data) => {
    if (data.receiverId && userSocketMap.has(data.receiverId)) {
      for (const socketId of userSocketMap.get(data.receiverId)) {
        io.to(socketId).emit('stopTyping', { userId });
      }
    }
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected', { userId, socketId: socket.id });
    if (userId && userSocketMap.has(userId)) {
      const sockets = userSocketMap.get(userId);
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSocketMap.delete(userId);
      }
      logger.debug('User socket removed', { userId, remainingSockets: sockets.size });
    }
    io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));
  });
});

app.use(express.json({ limit: '4mb' }));
app.use(cors(config.cors));

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logRequest(req.method, req.path, res.statusCode, duration, {
      userId: req.user?._id,
      ipAddress: req.ip,
    });
  });

  next();
});

app.get('/api/status', (req, res) => {
  res.json({ success: true, message: 'Server is live', timestamp: new Date().toISOString() });
});
app.use('/api/auth', userRouter);
app.use('/api/messages', messageRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});

app.use(errorHandler);

await connectDB();

const PORT = config.port;

if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { environment: config.environment });
  });
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} already in use`, error, { port: PORT });
    process.exit(1);
  }

  logger.error('Server error', error);
  process.exit(1);
});

export default server;
