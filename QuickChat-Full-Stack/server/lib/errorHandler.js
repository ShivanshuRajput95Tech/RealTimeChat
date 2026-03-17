// lib/errorHandler.js
// 2026 Centralized error handling and custom error classes

/**
 * 2026 BEST PRACTICES FOR ERROR HANDLING:
 * 
 * 1. Custom error classes for different scenarios
 * 2. Consistent error response format
 * 3. No sensitive data in error responses
 * 4. Proper HTTP status codes
 * 5. Structured error logging
 * 6. Error recovery strategies
 * 7. Request ID tracking for debugging
 */

import logger from './logger.js';

/**
 * Base ApiError class
 * All application errors should extend this
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      timeStamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        details: this.details,
        stack: this.stack,
      }),
    };
  }
}

/**
 * Validation Error (400)
 * Request data doesn't match schema
 */
export class ValidationError extends ApiError {
  constructor(message, field = null, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.field && { field: this.field }),
    };
  }
}

/**
 * Authentication Error (401)
 * User is not authenticated or token is invalid
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Not authenticated', reason = 'MISSING_TOKEN') {
    super(message, 401, 'AUTHENTICATION_ERROR', { reason });
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error (403)
 * User is authenticated but doesn't have permission
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'Not authorized', resource = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', { resource });
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error (404)
 * Resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(resource, identifier = null) {
    const message = `${resource} not found${identifier ? ` (${identifier})` : ''}`;
    super(message, 404, 'NOT_FOUND', { resource, identifier });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error (409)
 * Resource already exists or constraint violation
 */
export class ConflictError extends ApiError {
  constructor(message, resource = null, field = null) {
    super(message, 409, 'CONFLICT', { resource, field });
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate Limit Error (429)
 * Too many requests
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * External Service Error (502/503)
 * Third-party service is down or unreachable
 */
export class ServiceError extends ApiError {
  constructor(service, statusCode = 503, message = null) {
    super(
      message || `${service} service temporarily unavailable`,
      statusCode,
      'SERVICE_UNAVAILABLE',
      { service, statusCode }
    );
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * Database Error (500)
 * Database operation failed
 */
export class DatabaseError extends ApiError {
  constructor(operation, originalError = null) {
    super(
      'Database operation failed',
      500,
      'DATABASE_ERROR',
      { operation, originalError: originalError?.message }
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Business Logic Error (400/422)
 * Semantic error (e.g., can't message yourself)
 */
export class BusinessLogicError extends ApiError {
  constructor(message, statusCode = 422, context = {}) {
    super(message, statusCode, 'BUSINESS_LOGIC_ERROR', context);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

/**
 * Global error handler middleware (2026 best practice)
 * Must be the LAST middleware in app.use() chain
 * 
 * Usage in server.js:
 * app.use(errorHandler);
 */
export function errorHandler(err, req, res, next) {
  // Extract request context for logging
  const requestId = req.id || req.headers['x-request-id'] || 'unknown';
  const requestLogger = logger.child({ requestId });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    requestLogger.warn('API Error', {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
      userId: req.userId || 'anonymous',
    });

    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');

    requestLogger.warn('Validation Error', {
      path: req.path,
      message: messages,
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors,
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];

    requestLogger.warn('Duplicate key error', {
      field,
      value,
      collection: err.collection,
    });

    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_KEY',
      field,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    requestLogger.warn('JWT Error', {
      error: err.message,
      path: req.path,
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    requestLogger.debug('Token expired', {
      path: req.path,
      expiredAt: err.expiredAt,
    });

    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Handle unexpected errors
  requestLogger.error('Unexpected error', err, {
    path: req.path,
    method: req.method,
    userId: req.userId || 'anonymous',
    statusCode: err.statusCode || 500,
  });

  // Return generic error in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId,
    });
  }

  // Return detailed error in development
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    code: 'INTERNAL_ERROR',
    requestId,
    stack: err.stack,
  });
}

/**
 * Error catching wrapper for async route handlers (2026 pattern)
 * Eliminates need for try-catch in every route
 * 
 * Usage:
 * router.post('/send/:id', asyncHandler(async (req, res) => {
 *   const result = await messageService.sendMessage(...);
 *   res.json({ success: true, data: result });
 * }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validate MongoDB ObjectId
 */
export function validateObjectId(id, fieldName = 'ID') {
  if (!id || !/^[0-9a-f]{24}$/i.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }
  return id;
}

/**
 * Check resource ownership
 * Throw AuthorizationError if user doesn't own resource
 */
export function checkOwnership(resourceOwnerId, currentUserId, resourceType = 'resource') {
  if (resourceOwnerId.toString() !== currentUserId.toString()) {
    throw new AuthorizationError(
      `You cannot modify this ${resourceType}`,
      resourceType
    );
  }
}

/**
 * Example 2026 Error Handling Pattern:
 * 
 * router.post('/send/:id', asyncHandler(async (req, res) => {
 *   // Validate ID
 *   const receiverId = validateObjectId(req.params.id, 'receiverId');
 *   
 *   // Check authentication
 *   if (!req.userId) {
 *     throw new AuthenticationError('Login required');
 *   }
 *   
 *   // Prevent self-messaging
 *   if (receiverId === req.userId) {
 *     throw new BusinessLogicError('Cannot message yourself');
 *   }
 *   
 *   // Get receiver
 *   const receiver = await User.findById(receiverId);
 *   if (!receiver) {
 *     throw new NotFoundError('User', receiverId);
 *   }
 *   
 *   // Send message
 *   try {
 *     const message = await Message.create({
 *       senderId: req.userId,
 *       receiverId,
 *       text: req.body.text,
 *       image: req.body.image
 *     });
 *     
 *     res.status(201).json({
 *       success: true,
 *       data: message
 *     });
 *   } catch (error) {
 *     if (error.code === 11000) {
 *       // Caught automatically by errorHandler
 *       throw error;
 *     }
 *     throw new DatabaseError('create message', error);
 *   }
 * }));
 * 
 * // Global error handler catches all errors
 * app.use(errorHandler);
 */
