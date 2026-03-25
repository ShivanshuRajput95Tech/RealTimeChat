// Custom Application Error class
class AppError extends Error {
    constructor(message, statusCode, code = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
export class NotFoundError extends AppError {
    constructor(message = "Resource not found", details = null) {
        super(message, 404, "NOT_FOUND", details);
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed", details = null) {
        super(message, 400, "VALIDATION_ERROR", details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, "AUTHENTICATION_ERROR");
    }
}

export class AuthorizationError extends AppError {
    constructor(message = "Insufficient permissions") {
        super(message, 403, "AUTHORIZATION_ERROR");
    }
}

export class ConflictError extends AppError {
    constructor(message = "Resource already exists", details = null) {
        super(message, 409, "CONFLICT", details);
    }
}

export class RateLimitError extends AppError {
    constructor(message = "Too many requests") {
        super(message, 429, "RATE_LIMIT_ERROR");
    }
}

export class ExternalServiceError extends AppError {
    constructor(message = "External service unavailable", details = null) {
        super(message, 502, "EXTERNAL_SERVICE_ERROR", details);
    }
}

export class DatabaseError extends AppError {
    constructor(message = "Database operation failed", details = null) {
        super(message, 500, "DATABASE_ERROR", details);
    }
}

export default AppError;