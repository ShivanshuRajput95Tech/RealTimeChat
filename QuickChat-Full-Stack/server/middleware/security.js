import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";
import logger from "../lib/logger.js";

// Enhanced security middleware
export const securityMiddleware = (app) => {
    // Set security HTTP headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                connectSrc: ["'self'", "ws:", "wss:", "https:"],
                frameSrc: ["'self'"],
                objectSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    }));

    // Enable CORS with secure options
    app.use(cors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                process.env.CLIENT_URL || "http://localhost:5173",
                "http://localhost:3000",
                "https://quickchat.app",
                "https://www.quickchat.app",
            ];

            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        maxAge: 86400, // 24 hours
    }));

    // Rate limiting for API endpoints
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === "development" ? 1000 : 100,
        message: {
            success: false,
            message: "Too many requests from this IP, please try again after 15 minutes",
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.ip || req.connection.remoteAddress,
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path === "/api/status";
        },
    });

    app.use("/api/", apiLimiter);

    // Rate limiting for authentication endpoints
    const authLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: process.env.NODE_ENV === "development" ? 100 : 5,
        message: {
            success: false,
            message: "Too many authentication attempts. Please try again after an hour",
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => `auth:${req.ip}`,
    });

    app.use("/api/auth/login", authLimiter);
    app.use("/api/auth/signup", authLimiter);

    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize({
        replaceWith: "_",
        onSanitize: ({ req, key }) => {
            logger.warn(`Sanitized ${key} in request body`);
        },
    }));

    // Data sanitization against XSS
    app.use(xss());

    // Prevent parameter pollution
    app.use(hpp({
        whitelist: ["sort", "fields", "page", "limit", "filter"],
    }));

    // Trust proxy for accurate IP addresses (if behind reverse proxy)
    app.set("trust proxy", 1);

    // Remove X-Powered-By header
    app.disable("x-powered-by");
};

// Request timing middleware
export const requestTiming = (req, res, next) => {
    req.requestTime = new Date();
    const start = Date.now();

    // Log request completion
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            logger.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
        }
    });

    next();
};

// Request ID middleware
export const requestId = (req, res, next) => {
    req.id = req.headers["x-request-id"] || generateRequestId();
    res.setHeader("X-Request-Id", req.id);
    next();
};

const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Response compression middleware
export const compressionMiddleware = (app) => {
    app.use(compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
            if (req.headers["x-no-compression"]) {
                return false;
            }
            return compression.filter(req, res);
        },
    }));
};

// Maintenance mode middleware
export const maintenanceMode = (req, res, next) => {
    if (process.env.MAINTENANCE_MODE === "true") {
        return res.status(503).json({
            success: false,
            message: "Server is under maintenance. Please try again later.",
        });
    }
    next();
};

export default {
    securityMiddleware,
    requestTiming,
    requestId,
    compressionMiddleware,
    maintenanceMode,
};