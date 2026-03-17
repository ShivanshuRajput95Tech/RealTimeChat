// lib/security.js
// 2026 Security utilities and best practices

/**
 * 2026 BEST PRACTICES FOR SECURITY:
 * 
 * 1. Helmet.js for secure HTTP headers
 * 2. Content Security Policy (CSP)
 * 3. CORS with whitelist
 * 4. Rate limiting on sensitive endpoints
 * 5. Input validation with Zod (see schemas.js)
 * 6. Prepared statements (Mongoose handles this)
 * 7. Password hashing with bcrypt
 * 8. JWT with short expiry + refresh tokens
 * 9. HTTPS everywhere
 * 10. No sensitive data in logs/errors
 * 
 * Install: npm install helmet bcryptjs jsonwebtoken cors
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

/**
 * Password Security (2026 best practice)
 * Use bcrypt with salt rounds = 12 (takes ~250ms to hash)
 */
export const password = {
  /**
   * Hash password with bcrypt
   * @param {string} plainPassword - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hash(plainPassword) {
    if (!plainPassword || plainPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    try {
      const saltRounds = 12; // 2026 standard: 12+ rounds
      return await bcrypt.hash(plainPassword, saltRounds);
    } catch (error) {
      logger.error('Password hashing failed', error);
      throw new Error('Failed to secure password');
    }
  },

  /**
   * Compare password with hash
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Previously hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async compare(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Password comparison failed', error);
      return false;
    }
  },
};

/**
 * JWT Token Management (2026 best practice)
 * Short-lived access tokens + long-lived refresh tokens
 */
export const jwt_tokens = {
  /**
   * Create access token (short-lived)
   * @param {Object} payload - Token payload (userId, email, role)
   * @param {number} expiresIn - Expiration in seconds (default: 15 min)
   * @returns {string} Signed JWT token
   */
  createAccessToken(payload, expiresIn = '15m') {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    try {
      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
        algorithm: 'HS256',
        issuer: 'QuickChat',
      });
    } catch (error) {
      logger.error('Failed to create access token', error);
      throw new Error('Token creation failed');
    }
  },

  /**
   * Create refresh token (long-lived)
   * @param {Object} payload - Token payload (userId)
   * @param {number} expiresIn - Expiration in seconds (default: 7 days)
   * @returns {string} Signed JWT token
   */
  createRefreshToken(payload, expiresIn = '7d') {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }
    try {
      return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn,
        algorithm: 'HS256',
        issuer: 'QuickChat',
      });
    } catch (error) {
      logger.error('Failed to create refresh token', error);
      throw new Error('Token creation failed');
    }
  },

  /**
   * Verify access token
   * @param {string} token - JWT token to verify
   * @returns {Object|null} Decoded payload or null if invalid
   */
  verifyAccessToken(token) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'QuickChat',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Access token expired', { expiredAt: error.expiredAt });
      } else {
        logger.warn('Invalid access token', { error: error.message });
      }
      return null;
    }
  },

  /**
   * Verify refresh token
   * @param {string} token - JWT token to verify
   * @returns {Object|null} Decoded payload or null if invalid
   */
  verifyRefreshToken(token) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
        issuer: 'QuickChat',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Refresh token expired', { expiredAt: error.expiredAt });
      } else {
        logger.warn('Invalid refresh token', { error: error.message });
      }
      return null;
    }
  },
};

/**
 * Security Headers Configuration (2026 best practice)
 * Use with Helmet.js for defense-in-depth
 * 
 * Install: npm install helmet
 * 
 * Usage in server.js:
 * import helmet from 'helmet';
 * app.use(helmet(getHelmetConfig()));
 */
export function getHelmetConfig() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.cloudinary.com"],
        fontSrc: ["'self'", "data:"],
        mediaSrc: ["'self'", "blob:"],
      },
    },
    crossOriginEmbedderPolicy: false, // For file uploads
    frameguard: {
      action: 'deny', // Prevent clickjacking
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    xssFilter: true,
    noSniff: true,
  };
}

/**
 * CORS Configuration (2026 best practice)
 * Whitelist trusted domains only
 * 
 * Install: npm install cors
 * 
 * Usage in server.js:
 * import cors from 'cors';
 * app.use(cors(getCorsConfig()));
 */
export function getCorsConfig() {
  const allowedOrigins = [
    'http://localhost:5173', // Local development
    'http://localhost:3000',
    process.env.CLIENT_URL || 'https://quickchat.vercel.app',
  ].filter(Boolean);

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
  };
}

/**
 * Rate Limiting Configuration (2026 best practice)
 * Prevent brute force and abuse
 * 
 * Install: npm install express-rate-limit
 * 
 * Usage in routes:
 * import rateLimit from 'express-rate-limit';
 * 
 * const loginLimiter = rateLimit({
 *   windowMs: 15 * 60 * 1000,
 *   max: 5,
 *   message: 'Too many login attempts, try again later',
 *   standardHeaders: true,
 *   legacyHeaders: false,
 * });
 * 
 * router.post('/login', loginLimiter, handleLogin);
 */
export function createRateLimitConfig(windowMs = 15 * 60 * 1000, max = 100) {
  return {
    windowMs, // 15 minutes by default
    max, // 100 requests per window by default
    message: 'Too many requests, please try again later',
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.userId || req.ip;
    },
  };
}

/**
 * Data Sanitization (2026 best practice)
 * Remove sensitive fields from responses
 */
export function sanitizeUser(user) {
  if (!user) return null;

  const { password, refreshToken, __v, ...safe } = user.toObject ? user.toObject() : user;
  return safe;
}

export function sanitizeMessage(message) {
  if (!message) return null;
  // Messages can be returned as-is if user needs to see full content
  return message.toObject ? message.toObject() : message;
}

/**
 * Secure Cookie Options (2026 best practice)
 * Use httpOnly to prevent XSS access
 */
export function getSecureCookieOptions() {
  return {
    httpOnly: true, // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

/**
 * Input Sanitization (2026 best practice)
 * Prevent NoSQL injection in string inputs
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous MongoDB operators
  return input.replace(/[\$\{\}]/g, '').trim();
}

/**
 * Example 2026 Security Pattern in Routes:
 * 
 * import { password, jwt_tokens, sanitizeUser } from './lib/security.js';
 * 
 * // Login endpoint
 * router.post('/login', async (req, res) => {
 *   try {
 *     const user = await User.findOne({ email: req.body.email });
 *     if (!user || !await password.compare(req.body.password, user.password)) {
 *       return res.status(401).json({ message: 'Invalid credentials' });
 *     }
 *     
 *     const accessToken = jwt_tokens.createAccessToken({
 *       userId: user._id,
 *       email: user.email
 *     }, '15m');
 *     
 *     const refreshToken = jwt_tokens.createRefreshToken({
 *       userId: user._id
 *     }, '7d');
 *     
 *     res.cookie('refreshToken', refreshToken, getSecureCookieOptions());
 *     res.json({
 *       user: sanitizeUser(user),
 *       accessToken
 *     });
 *   } catch (error) {
 *     logger.error('Login failed', error);
 *     res.status(500).json({ message: 'Internal server error' });
 *   }
 * });
 */
