// lib/logger.js
// 2026 Structured logging with Pino-compatible format
// Install Pino for production: npm install pino pino-pretty pino-http

/**
 * 2026 BEST PRACTICES:
 * - Structured JSON logging for cloud-native environments
 * - Pino is 10-40x faster than Winston/Bunyan
 * - Hierarchical context with child loggers for request tracking
 * - Performance monitoring built-in
 * - Compatible with CloudWatch, DataDog, ELK stack
 * 
 * Log Levels (by importance):
 * - debug (0): Detailed info for development/debugging
 * - info (20): General informational messages
 * - warn (30): Warning, something unexpected but handled
 * - error (40): Error occurred, operation failed
 * - fatal (50): System is unusable, process will exit
 */

const LOG_LEVELS = {
  debug: 0,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

class Logger {
  constructor(level = 'info', context = {}) {
    this.level = level;
    this.environment = process.env.NODE_ENV || 'development';
    this.context = context;
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  formatMessage(level, message, data = {}) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      environment: this.environment,
      ...this.context,
      ...data,
    };

    return JSON.stringify(logEntry);
  }

  error(message, error = null, context = {}) {
    if (!this.shouldLog('error')) return;

    const data = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
      }),
    };

    console.error(this.formatMessage('error', message, data));
  }

  warn(message, context = {}) {
    if (!this.shouldLog('warn')) return;

    console.warn(this.formatMessage('warn', message, context));
  }

  info(message, context = {}) {
    if (!this.shouldLog('info')) return;

    console.log(this.formatMessage('info', message, context));
  }

  debug(message, context = {}) {
    if (!this.shouldLog('debug')) return;

    if (this.environment !== 'test') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  fatal(message, error = null, context = {}) {
    const data = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    console.error(this.formatMessage('fatal', message, data));
    process.exit(1);
  }

  // Performance tracking (2026 pattern)
  startTimer() {
    return Date.now();
  }

  logPerformance(operation, startTime, threshold = 100) {
    const duration = Date.now() - startTime;
    const level = duration > threshold ? 'warn' : 'info';
    const message = `${operation} completed`;

    this[level](message, {
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      slow: duration > threshold,
    });
  }

  // Child logger for request context (2026 pattern)
  child(metadata = {}) {
    return new Logger(this.level, { ...this.context, ...metadata });
  }

  // Specialized logging methods
  logRequest(method, path, statusCode, duration, context = {}) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${path}`;

    this[level](message, {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...context,
    });
  }

  logDatabaseQuery(collection, operation, duration, context = {}) {
    this.debug(`Database: ${operation} on ${collection}`, {
      collection,
      operation,
      duration: `${duration}ms`,
      ...context,
    });
  }

  logSocketEvent(userId, event, data = {}) {
    this.debug(`Socket event: ${event}`, {
      userId,
      event,
      ...data,
    });
  }

  logAuthentication(action, userId, success, context = {}) {
    const message = `Authentication: ${action}`;
    const level = success ? 'info' : 'warn';

    this[level](message, {
      userId,
      action,
      success,
      ...context,
    });
  }

  // Cache logging (2026 pattern)
  logCache(operation, key, hit, duration = null) {
    const message = `Cache ${operation} - ${hit ? 'HIT' : 'MISS'}`;
    const level = hit ? 'debug' : 'info';

    this[level](message, {
      operation,
      key,
      hit,
      ...(duration && { duration: `${duration}ms` }),
    });
  }
}

// Create singleton logger instance
const logger = new Logger(
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
);

export default logger;

/**
 * Express HTTP logging middleware (2026 best practice)
 * Usage in server.js:
 * app.use(createHttpLogger());
 */
export function createHttpLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log incoming request
    logger.debug('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.userId || 'anonymous',
      queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.logRequest(req.method, req.path, res.statusCode, duration, {
        userId: req.userId || 'anonymous',
      });
    });

    next();
  };
}

/**
 * Example Usage Patterns for 2026:
 * 
 * 1. Basic logging
 * logger.info('Message sent', { messageId: '123', senderId: 'user1' });
 * 
 * 2. Error with context
 * catch (error) {
 *   logger.error('Failed to send message', error, {
 *     userId: req.userId,
 *     receiverId: req.params.id
 *   });
 * }
 * 
 * 3. Performance tracking
 * const timer = logger.startTimer();
 * const users = await getUsersForSidebar(userId);
 * logger.logPerformance('Sidebar query', timer, 200);  // Warn if > 200ms
 * 
 * 4. Cache logging
 * const cacheTimer = logger.startTimer();
 * const cached = await cache.get(`sidebar_${userId}`);
 * if (cached) {
 *   logger.logCache('get', `sidebar_${userId}`, true, logger.startTimer() - cacheTimer);
 * } else {
 *   logger.logCache('get', `sidebar_${userId}`, false);
 * }
 * 
 * 5. Child logger for request context (2026 pattern)
 * const requestLogger = logger.child({ requestId: req.id, userId: req.userId });
 * requestLogger.info('Starting bulk delete', { count: 50 });
 * 
 * 6. Socket.IO event logging
 * logger.logSocketEvent(userId, 'message:send', { messageId, receiverId });
 * 
 * 7. Database query logging
 * const queryTimer = logger.startTimer();
 * const users = await User.find({ status: 'active' });
 * logger.logDatabaseQuery('User', 'find', logger.startTimer() - queryTimer);
 */
