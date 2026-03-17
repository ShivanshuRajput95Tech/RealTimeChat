import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import { connectDB } from "./lib/db.js";
import { errorHandler } from "./lib/errors.js";
import logger from "./lib/logger.js";
import config from "./config/env.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: {
        origin: config.cors.origin,
        credentials: true
    }
})

// Store online users in Map for safety
export const userSocketMap = new Map(); // Map<userId, Set<socketId>>

// Socket.io authentication middleware
io.use((socket, next) => {
    try {
        let token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            logger.warn("Socket connection failed: token required", { socketId: socket.id });
            return next(new Error('Authentication error: token required'));
        }

        // Allow Bearer token or raw token
        token = token.replace(/^Bearer\s+/i, '');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        logger.debug("Socket authenticated", { userId: decoded.userId, socketId: socket.id });
        return next();
    } catch (err) {
        logger.warn("Socket authentication failed", { error: err.message, socketId: socket.id });
        return next(new Error('Authentication error'));
    }
});

// Socket.io connection handler
io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info('User Connected', { userId, socketId: socket.id });

    if (userId) {
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId).add(socket.id);
        logger.debug("User socket mapped", { userId, socketId: socket.id, totalSockets: userSocketMap.get(userId).size });
    }

    io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));

    // Typing indicator events
    socket.on('typing', (data) => {
        if (data.receiverId && userSocketMap.has(data.receiverId)) {
            for (const socketId of userSocketMap.get(data.receiverId)) {
                io.to(socketId).emit('typing', { userId });
            }
            logger.debug("Typing event transmitted", { from: userId, to: data.receiverId });
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
        logger.info('User Disconnected', { userId, socketId: socket.id });
        if (userId && userSocketMap.has(userId)) {
            const sockets = userSocketMap.get(userId);
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                userSocketMap.delete(userId);
            }
            logger.debug("User socket removed", { userId, remainingSockets: sockets.size });
        }
        io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));
    });
});

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors(config.cors));

// Request logging middleware
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

// Routes setup
app.use("/api/status", (req, res)=> {
    res.json({ success: true, message: "Server is live", timestamp: new Date().toISOString() });
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Catch-all 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        code: 'NOT_FOUND'
    });
});

// Error handler middleware (MUST be registered last)
app.use(errorHandler);

// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`, { environment: process.env.NODE_ENV }));
}

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} already in use`, error, { port: PORT });
        process.exit(1);
    } else {
        logger.error("Server error", error);
        process.exit(1);
    }
});

// Export server for Vercel
export default server;
