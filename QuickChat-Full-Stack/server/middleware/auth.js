import User from '../models/User.js';
import AuthService from '../services/authService.js';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../lib/errors.js';
import logger from '../lib/logger.js';

// Middleware to protect routes
export const protectRoute = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (!authHeader) {
    throw new UnauthorizedError('Token missing');
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  const decoded = AuthService.verifyToken(token);

  const user = await User.findById(decoded.userId).select('-password');
  if (!user) {
    throw new NotFoundError('User');
  }

  req.user = user;
  logger.debug('Protected route authorized', { userId: user._id, path: req.path });
  next();
});
