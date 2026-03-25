import express from "express";
import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import { redis } from "./lib/redis.js";
import logger from "./lib/logger.js";
import { securityMiddleware, requestTiming, requestId, compressionMiddleware, maintenanceMode } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import workspaceRouter from "./routes/workspaceRoutes.js";
import channelRouter from "./routes/channelRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import broadcastRouter from "./routes/broadcastRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import pollRouter from "./routes/pollRoutes.js";
import voiceRouter from "./routes/voiceRoutes.js";
import meetingRouter from "./routes/meetingRoutes.js";
import enhancedMessageRouter from "./routes/enhancedMessageRoutes.js";
import noteRouter from "./routes/noteRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";
import { initSocketIO, getIO } from "./socket.js";
import { schedulerService } from "./services/schedulerService.js";

if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET is not defined in .env file");
    process.exit(1);
}

const app = express();
const server = http.createServer(app);

initSocketIO(server, {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
});

// Apply enhanced security middleware
securityMiddleware(app);
compressionMiddleware(app);
requestTiming(app);
requestId(app);
maintenanceMode(app);

// Body parsing middleware with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check with comprehensive monitoring
app.get("/api/status", (req, res) => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: uptime,
            formatted: formatUptime(uptime),
        },
        database: {
            status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
            readyState: mongoose.connection.readyState,
        },
        redis: {
            status: (() => { try { return redis.isReady() ? "connected" : "disconnected" } catch { return "disconnected" } })(),
            isConnected: (() => { try { return redis.isReady() } catch { return false } })(),
        },
        memory: {
            rss: formatBytes(memoryUsage.rss),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            heapUsed: formatBytes(memoryUsage.heapUsed),
            external: formatBytes(memoryUsage.external),
            raw: memoryUsage,
        },
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid,
            arch: process.arch,
            env: process.env.NODE_ENV || "development",
        },
    });
});

// Helper function to format uptime
const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

// Helper function to format bytes
const formatBytes = (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/channels", channelRouter);
app.use("/api/groups", groupRouter);
app.use("/api/ai", aiRouter);
app.use("/api/broadcasts", broadcastRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/polls", pollRouter);
app.use("/api/meetings", meetingRouter);
app.use("/api/messages/enhanced", enhancedMessageRouter);
app.use("/api/notes", noteRouter);
app.use("/api/analytics", analyticsRouter);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be after all routes)
app.use(errorHandler);

// Graceful shutdown
let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`${signal} received. Starting graceful shutdown...`);

    try { schedulerService.stop(); } catch {}

    try {
        const ioInstance = getIO();
        if (ioInstance) {
            ioInstance.close();
            logger.info("Socket.IO server closed");
        }
    } catch {}

    try {
        await mongoose.connection.close();
        logger.info("Database connection closed");
    } catch {}

    try {
        if (redis.isReady()) {
            await redis.quit();
            logger.info("Redis connection closed");
        }
    } catch {}

    server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
    });

    setTimeout(() => {
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
});
// Start
await connectDB();

try { await redis.connect(); } catch {
    logger.warn("Redis not available, running without cache");
}

try { schedulerService.start(); } catch (error) {
    logger.warn("Scheduler not started:", error.message);
}

const PORT = process.env.PORT || 5000;
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use. Close the other server or change PORT in .env`);
        process.exit(1);
    }
    throw err;
});
server.listen(PORT, () => logger.info(`Server running on PORT: ${PORT}`));
