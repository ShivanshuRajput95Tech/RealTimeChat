// lib/logger.js
// Structured logging for production applications

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.environment = process.env.NODE_ENV || 'development';
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  formatMessage(level, message, data = {}) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      environment: this.environment,
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

  // Specialized logging methods
  logRequest(method, path, statusCode, duration, context = {}) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${path}`;

    this[level](message, {
      statusCode,
      duration: `${duration}ms`,
      ...context,
    });
  }

  logDatabaseQuery(collection, operation, duration, context = {}) {
    this.debug(`Database: ${operation} on ${collection}`, {
      duration: `${duration}ms`,
      ...context,
    });
  }

  logSocketEvent(userId, event, data = {}) {
    this.debug(`Socket event: ${event}`, {
      userId,
      ...data,
    });
  }

  logAuthentication(action, userId, success, context = {}) {
    const message = `Authentication: ${action}`;
    const level = success ? 'info' : 'warn';

    this[level](message, {
      userId,
      success,
      ...context,
    });
  }
}

// Create singleton logger instance
const logger = new Logger(
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
);

export default logger;
