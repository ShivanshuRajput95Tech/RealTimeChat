import rateLimit from "express-rate-limit";
import logger from "../lib/logger.js";

const createLimiter = (options) => {
    return rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => process.env.NODE_ENV === "development" && !process.env.FORCE_RATE_LIMIT,
        keyGenerator: (req) => req.ip || req.connection.remoteAddress,
        ...options,
    });
};

const getEnvNumber = (key, defaultValue) => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
};

export const generalLimiter = createLimiter({
    windowMs: getEnvNumber("RATE_LIMIT_WINDOW_MS", 60 * 1000),
    max: getEnvNumber("RATE_LIMIT_MAX_REQUESTS", 100),
    message: { success: false, message: "Too many requests, please try again later" },
});

export const authLimiter = createLimiter({
    windowMs: getEnvNumber("AUTH_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
    max: getEnvNumber("AUTH_RATE_LIMIT_MAX_REQUESTS", 10),
    message: { success: false, message: "Too many auth attempts, please try again later" },
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `auth:${req.ip}`,
});

export const messageLimiter = createLimiter({
    windowMs: getEnvNumber("MESSAGE_RATE_LIMIT_WINDOW_MS", 60 * 1000),
    max: getEnvNumber("MESSAGE_RATE_LIMIT_MAX_REQUESTS", 30),
    message: { success: false, message: "Too many messages, please slow down" },
    keyGenerator: (req) => `msg:${req.user?._id || req.ip}`,
});

export const uploadLimiter = createLimiter({
    windowMs: getEnvNumber("UPLOAD_RATE_LIMIT_WINDOW_MS", 60 * 1000),
    max: getEnvNumber("UPLOAD_RATE_LIMIT_MAX_REQUESTS", 10),
    message: { success: false, message: "Too many uploads, please try again later" },
    keyGenerator: (req) => `upload:${req.user?._id || req.ip}`,
});

export const aiLimiter = createLimiter({
    windowMs: getEnvNumber("AI_RATE_LIMIT_WINDOW_MS", 60 * 1000),
    max: getEnvNumber("AI_RATE_LIMIT_MAX_REQUESTS", 10),
    message: { success: false, message: "Too many AI requests, please wait a moment" },
    keyGenerator: (req) => `ai:${req.user?._id || req.ip}`,
});

export default { generalLimiter, authLimiter, messageLimiter, uploadLimiter, aiLimiter };
