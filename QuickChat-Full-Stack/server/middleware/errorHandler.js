import logger from "../lib/logger.js";
import AppError from "../utils/AppError.js";

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
    let error = { ...err, message: err.message };
    
    // Log error
    logger.error(`[${req.id || "NO_ID"}] ${err.message}`, {
        error: err,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id || req.userId,
        body: req.body,
        query: req.query,
        params: req.params,
    });

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = "Validation error";
        const details = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message,
        }));
        error = new AppError(message, 400, "VALIDATION_ERROR", details);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate value for field: ${field}`;
        error = new AppError(message, 409, "DUPLICATE_FIELD", { field, value: err.keyValue[field] });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === "CastError") {
        const message = `Invalid ${err.path}: ${err.value}`;
        error = new AppError(message, 400, "INVALID_ID");
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        error = new AppError("Invalid token", 401, "INVALID_TOKEN");
    }

    if (err.name === "TokenExpiredError") {
        error = new AppError("Token expired", 401, "TOKEN_EXPIRED");
    }

    // Multer errors (file upload)
    if (err.code === "LIMIT_FILE_SIZE") {
        error = new AppError("File too large", 400, "FILE_TOO_LARGE");
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        error = new AppError("Unexpected file field", 400, "UNEXPECTED_FILE");
    }

    // CORS error
    if (err.message === "Not allowed by CORS") {
        error = new AppError("CORS policy violation", 403, "CORS_ERROR");
    }

    // Default to 500 if status code not set
    if (!error.statusCode) {
        error.statusCode = 500;
        error.status = "error";
    }

    // Prepare response
    const response = {
        success: false,
        message: error.message || "Internal server error",
        error: {
            code: error.code || "INTERNAL_ERROR",
            status: error.status || "error",
        },
    };

    // Add details in development or for specific error codes
    if (process.env.NODE_ENV === "development" || error.details) {
        if (error.details) {
            response.error.details = error.details;
        }
        if (process.env.NODE_ENV === "development") {
            response.error.stack = err.stack;
        }
    }

    // Add request ID if available
    if (req.id) {
        response.requestId = req.id;
    }

    res.status(error.statusCode).json(response);
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, "ROUTE_NOT_FOUND");
    next(error);
};

// Async error wrapper to catch async errors
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Rate limit error handler
export const rateLimitHandler = (req, res) => {
    const error = new AppError(
        "Too many requests, please try again later",
        429,
        "RATE_LIMIT_EXCEEDED"
    );
    
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id || "anonymous"}`);
    
    res.status(429).json({
        success: false,
        message: error.message,
        error: {
            code: error.code,
            retryAfter: req.rateLimit?.resetTime,
        },
    });
};

// Maintenance mode handler
export const maintenanceHandler = (req, res) => {
    res.status(503).json({
        success: false,
        message: "Server is under maintenance. Please try again later.",
        error: {
            code: "MAINTENANCE_MODE",
            estimatedTime: process.env.MAINTENANCE_ESTIMATED_TIME || "Unknown",
        },
    });
};

export default {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    rateLimitHandler,
    maintenanceHandler,
};