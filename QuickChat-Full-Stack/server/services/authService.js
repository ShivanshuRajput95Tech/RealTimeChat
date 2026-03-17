// services/authService.js
// Authentication business logic layer

import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../lib/errors.js';
import logger from '../lib/logger.js';

export class AuthService {
  static async signup(data) {
    const { email, password, fullName, bio } = data;

    logger.info('User signup attempt', { email });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Signup failed: user already exists', { email });
      throw new ConflictError('User with this email already exists');
    }

    try {
      // Hash password
      const salt = await bcrypt.genSalt(config.security.bcryptRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        fullName,
        bio,
      });

      logger.info('User created successfully', { userId: user._id, email });

      return AuthService.formatUserResponse(user);
    } catch (error) {
      logger.error('Signup failed', error, { email });
      throw error;
    }
  }

  static async login(data) {
    const { email, password } = data;

    logger.info('User login attempt', { email });

    // Find user and include hashed password for verification
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('Login failed: user not found', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    if (!user.password) {
      logger.warn('Login failed: password hash missing', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login failed: invalid password', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    logger.info('User logged in successfully', { userId: user._id, email });

    return AuthService.formatUserResponse(user);
  }

  static generateTokens(userId) {
    const token = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { token, refreshToken };
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }

  static formatUserResponse(user) {
    return {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic || '',
      bio: user.bio || '',
      status: user.status || 'offline',
      lastSeen: user.lastSeen,
    };
  }
}

export default AuthService;
