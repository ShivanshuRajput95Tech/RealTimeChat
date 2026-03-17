// lib/errors.js
// Centralized error handling for production applications

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Duplicate key (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new ConflictError(`${field} already exists`);
  }

  // Cast error (MongoDB)
  if (err.name === 'CastError') {
    err = new ValidationError(`Invalid ${err.path}`, err.path);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err = new UnauthorizedError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    err = new UnauthorizedError('Token expired');
  }

  // Operational error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code || 'ERROR',
      message: err.message,
      ...(err.field && { field: err.field }),
    });
  }

  // Programming or unknown error
  console.error('Unhandled Error:', err);

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Internal Server Error',
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  errorHandler,
  asyncHandler,
};
