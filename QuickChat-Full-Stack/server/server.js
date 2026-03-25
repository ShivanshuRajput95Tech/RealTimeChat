import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import http from "http";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import { redis } from "./lib/redis.js";
import logger from "./lib/logger.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
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

// Request ID middleware
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
});

// Security & performance middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(generalLimiter);

// Health check
app.get("/api/status", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        redis: (() => { try { return redis.isReady() ? "connected" : "disconnected" } catch { return "disconnected" } })(),
        memory: process.memoryUsage(),
    });
});

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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error(`[${req.id}] Unhandled error:`, err.stack || err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
});

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
