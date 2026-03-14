import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

// Socket.IO with optimized settings
export const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT"],
        credentials: true
    },
    // Performance optimizations
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
});

// store online users - use Map for better performance
export const userSocketMap = new Map();

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("add-user", (userId) => {
        userSocketMap.set(userId, socket.id);
        // Broadcast updated online users list
        io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        // Find and remove disconnected user
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                // Broadcast updated online users list
                io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
                break;
            }
        }
    });
});

// Trust proxy when running behind a proxy (e.g., Codespaces preview or reverse proxies)
// This is required for express-rate-limit to correctly identify client IPs.
app.set("trust proxy", 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting with different limits for different routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

// Compression middleware
app.use(compression());

// CORS configuration (allow dev preview origins + local tooling)
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, server-side, etc.)
        if (!origin) return callback(null, true);

        // Allow explicit frontend URL
        if (allowedOrigin && origin === allowedOrigin) return callback(null, true);

        // Allow localhost dev servers
        if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
            return callback(null, true);
        }

        // Allow GitHub Codespaces / Preview deploy URLs
        if (/\.githubpreview\.dev$/.test(origin) || /\.github\.dev$/.test(origin)) {
            return callback(null, true);
        }

        // Allow other non-production environments for convenience
        if (process.env.NODE_ENV !== "production") return callback(null, true);

        // Otherwise, reject
        callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    exposedHeaders: ["Authorization", "token"],
    credentials: true
}));

// Apply rate limiting
app.use(limiter);

// Auth routes with stricter rate limiting
app.use("/api/auth", authLimiter);

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization middleware
app.use((req, res, next) => {
    // Basic XSS prevention
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    if (req.body) sanitize(req.body);
    next();
});

// Routes
app.get("/api/status", (req, res) => {
    res.send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// Database
await connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});