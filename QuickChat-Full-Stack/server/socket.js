import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "./models/User.js";
import logger from "./lib/logger.js";

let _io = null;
export const userSocketMap = {};

export const getIO = () => _io;

export const safeEmit = (event, data) => {
    try {
        const ioInstance = getIO();
        if (ioInstance) ioInstance.emit(event, data);
    } catch {}
};

export const safeEmitToRoom = (room, event, data) => {
    try {
        const ioInstance = getIO();
        if (ioInstance) ioInstance.to(room).emit(event, data);
    } catch {}
};

export const safeEmitToUser = (userId, event, data) => {
    try {
        const ioInstance = getIO();
        if (ioInstance) {
            const socketId = userSocketMap[userId];
            if (socketId) {
                ioInstance.to(socketId).emit(event, data);
            }
        }
    } catch {}
};

const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
        if (process.env.NODE_ENV === 'development') {
            const userId = socket.handshake.query.userId;
            if (userId) {
                socket.user = { _id: userId };
                return next();
            }
        }
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            const userId = socket.handshake.query.userId;
            if (userId) {
                socket.user = { _id: userId };
                return next();
            }
        }
        logger.warn(`Socket authentication failed: ${error.message}`);
        next(new Error("Authentication error: Invalid token"));
    }
};

export const initSocketIO = (httpServer, corsOptions) => {
    _io = new Server(httpServer, {
        cors: corsOptions,
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    _io.use(authenticateSocket);

    _io.on("connection", (socket) => {
        const userId = socket.user?._id;
        const userName = socket.user?.fullName || "anonymous";

        logger.info(`User Connected: ${userName} (${userId || "unknown"})`);

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            userSocketMap[userId] = socket.id;
            User.findByIdAndUpdate(userId, { status: "online" }).catch(() => {});
            _io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }

        socket.on("typing", ({ receiverId, channelId, groupId }) => {
            if (receiverId) safeEmitToUser(receiverId, "userTyping", { userId, channelId, groupId });
            if (channelId) socket.to(`channel:${channelId}`).emit("userTyping", { userId, channelId });
            if (groupId) socket.to(`group:${groupId}`).emit("userTyping", { userId, groupId });
        });

        socket.on("stopTyping", ({ receiverId, channelId, groupId }) => {
            if (receiverId) safeEmitToUser(receiverId, "userStopTyping", { userId, channelId, groupId });
            if (channelId) socket.to(`channel:${channelId}`).emit("userStopTyping", { userId, channelId });
            if (groupId) socket.to(`group:${groupId}`).emit("userStopTyping", { userId, groupId });
        });

        socket.on("joinChannel", (channelId) => {
            socket.join(`channel:${channelId}`);
            socket.to(`channel:${channelId}`).emit("userJoined", { userId, channelId });
        });

        socket.on("leaveChannel", (channelId) => {
            socket.leave(`channel:${channelId}`);
            socket.to(`channel:${channelId}`).emit("userLeft", { userId, channelId });
        });

        socket.on("joinGroup", (groupId) => {
            socket.join(`group:${groupId}`);
            socket.to(`group:${groupId}`).emit("userJoined", { userId, groupId });
        });

        socket.on("leaveGroup", (groupId) => {
            socket.leave(`group:${groupId}`);
            socket.to(`group:${groupId}`).emit("userLeft", { userId, groupId });
        });

        socket.on("statusChange", async ({ status, statusText }) => {
            if (userId) {
                const update = { status };
                if (statusText !== undefined) update.statusText = statusText;
                await User.findByIdAndUpdate(userId, update).catch(() => {});
                _io.emit("userStatusChange", { userId, status, statusText });
            }
        });

        socket.on("messageReacted", ({ messageId, reactions, targetId, channelId, groupId }) => {
            if (channelId) {
                socket.to(`channel:${channelId}`).emit("messageReactions", { messageId, reactions });
            } else if (groupId) {
                socket.to(`group:${groupId}`).emit("messageReactions", { messageId, reactions });
            } else if (targetId) {
                safeEmitToUser(targetId, "messageReactions", { messageId, reactions });
            }
        });

        socket.on("markRead", ({ conversationId }) => {
            safeEmitToUser(conversationId, "conversationRead", { userId });
        });

        socket.on("call-offer", ({ offer, to, type, from, fromName }) => {
            safeEmitToUser(to, "call-offer", { offer, type, from, fromName });
        });

        socket.on("call-answer", ({ answer, to }) => {
            safeEmitToUser(to, "call-answer", { answer });
        });

        socket.on("ice-candidate", ({ candidate, to }) => {
            safeEmitToUser(to, "ice-candidate", { candidate });
        });

        socket.on("call-ended", ({ to }) => {
            safeEmitToUser(to, "call-ended", {});
        });

        socket.on("call-rejected", ({ to }) => {
            safeEmitToUser(to, "call-rejected", {});
        });

        // Voice recording indicator
        socket.on("voice-recording-start", ({ receiverId, channelId, groupId }) => {
            if (receiverId) safeEmitToUser(receiverId, "userRecordingVoice", { userId });
            if (channelId) socket.to(`channel:${channelId}`).emit("userRecordingVoice", { userId, channelId });
            if (groupId) socket.to(`group:${groupId}`).emit("userRecordingVoice", { userId, groupId });
        });

        socket.on("voice-recording-stop", ({ receiverId, channelId, groupId }) => {
            if (receiverId) safeEmitToUser(receiverId, "userStopRecordingVoice", { userId });
            if (channelId) socket.to(`channel:${channelId}`).emit("userStopRecordingVoice", { userId, channelId });
            if (groupId) socket.to(`group:${groupId}`).emit("userStopRecordingVoice", { userId, groupId });
        });

        // Poll events
        socket.on("poll-created", ({ pollId, channelId, groupId }) => {
            if (channelId) socket.to(`channel:${channelId}`).emit("newPoll", { pollId, channelId });
            if (groupId) socket.to(`group:${groupId}`).emit("newPoll", { pollId, groupId });
        });

        socket.on("poll-voted", ({ pollId, channelId, groupId, poll }) => {
            if (channelId) socket.to(`channel:${channelId}`).emit("pollUpdated", { pollId, poll });
            if (groupId) socket.to(`group:${groupId}`).emit("pollUpdated", { pollId, poll });
        });

        socket.on("disconnect", async () => {
            logger.info(`User Disconnected: ${userId || "anonymous"}`);
            if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                delete userSocketMap[userId];
                await User.findByIdAndUpdate(userId, { 
                    status: "offline",
                    lastSeen: new Date()
                }).catch(() => {});
                _io.emit("getOnlineUsers", Object.keys(userSocketMap));
                _io.emit("userStatusChange", { userId, status: "offline", lastSeen: new Date() });
            }
        });

        // Message status updates
        socket.on("messageDelivered", ({ messageId, to }) => {
            safeEmitToUser(to, "messageStatusUpdate", { messageId, status: "delivered" });
        });

        socket.on("messageRead", ({ messageId, to }) => {
            safeEmitToUser(to, "messageStatusUpdate", { messageId, status: "read" });
        });
    });

    return _io;
};
