import AuthService from '../services/authService.js';
import UserService from '../services/userService.js';
import {
  validateSignup,
  validateLogin,
  validateUpdateProfile,
} from '../lib/validators.js';
import { asyncHandler } from '../lib/errors.js';
import logger from '../lib/logger.js';

// Register a new user
export const signup = asyncHandler(async (req, res) => {
  const validatedData = validateSignup(req.body);
  const userData = await AuthService.signup(validatedData);
  const { token, refreshToken } = AuthService.generateTokens(userData._id);

  res.status(201).json({
    success: true,
    userData,
    token,
    refreshToken,
    message: 'Account created successfully',
  });
});

// Login a user
export const login = asyncHandler(async (req, res) => {
  const validatedData = validateLogin(req.body);
  const userData = await AuthService.login(validatedData);
  const { token, refreshToken } = AuthService.generateTokens(userData._id);

  logger.info('User login successful', { userId: userData._id, email: userData.email });

  res.json({
    success: true,
    userData,
    token,
    refreshToken,
    message: 'Login successful',
  });
});

// Check if user is authenticated
export const checkAuth = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.user._id);

  res.json({
    success: true,
    user,
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const validatedData = validateUpdateProfile(req.body);
  const user = await UserService.updateProfile(req.user._id, validatedData);

  res.json({
    success: true,
    user,
    message: 'Profile updated successfully',
  });
});

// Get user by ID
export const getUser = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);

  res.json({
    success: true,
    user,
  });
});

// Search users
export const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const users = await UserService.searchUsers(q, parseInt(limit, 10));

  res.json({
    success: true,
    users,
  });
});