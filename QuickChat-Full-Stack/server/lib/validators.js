// lib/validators.js
// Input validation utilities for production-ready validation

import { ValidationError } from './errors.js';

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
  return email.trim().toLowerCase();
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    throw new ValidationError('Password is required', 'password');
  }
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters', 'password');
  }
  if (password.length > 100) {
    throw new ValidationError('Password is too long', 'password');
  }
  return password;
};

// Username/Full name validation
export const validateFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    throw new ValidationError('Full name is required', 'fullName');
  }

  const trimmed = fullName.trim();
  if (trimmed.length < 2) {
    throw new ValidationError('Full name must be at least 2 characters', 'fullName');
  }
  if (trimmed.length > 100) {
    throw new ValidationError('Full name is too long', 'fullName');
  }
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    throw new ValidationError('Full name contains invalid characters', 'fullName');
  }

  return trimmed;
};

// Bio validation
export const validateBio = (bio) => {
  if (bio === undefined || bio === null) {
    return '';
  }
  if (typeof bio !== 'string') {
    throw new ValidationError('Bio must be a string', 'bio');
  }

  const trimmed = bio.trim();
  if (trimmed.length > 500) {
    throw new ValidationError('Bio must be less than 500 characters', 'bio');
  }

  return trimmed;
};

// Message text validation
export const validateMessageText = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > 5000) {
    throw new ValidationError('Message is too long (max 5000 characters)', 'text');
  }

  return trimmed;
};

// Message image validation
export const validateMessageImage = (image, fieldName = 'image') => {
  if (!image) {
    return null;
  }
  if (typeof image !== 'string') {
    throw new ValidationError('Image must be a base64 string', fieldName);
  }
  if (image.length > 5242880) {
    throw new ValidationError('Image is too large (max 4MB)', fieldName);
  }

  return image;
};

// MongoDB ObjectId validation
export const validateObjectId = (id, fieldName = 'id') => {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  if (!/^[0-9a-f]{24}$/i.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }

  return id;
};

// Signup data validation
export const validateSignup = (data) => {
  const { email, password, fullName, bio } = data;

  return {
    email: validateEmail(email),
    password: validatePassword(password),
    fullName: validateFullName(fullName),
    bio: validateBio(bio),
  };
};

// Login data validation
export const validateLogin = (data) => {
  const { email, password } = data;

  return {
    email: validateEmail(email),
    password: validatePassword(password),
  };
};

// Update profile validation
export const validateUpdateProfile = (data) => {
  const { fullName, bio, profilePic } = data;
  const result = {};

  if (fullName !== undefined) {
    result.fullName = validateFullName(fullName);
  }
  if (bio !== undefined) {
    result.bio = validateBio(bio);
  }
  if (profilePic !== undefined) {
    result.profilePic = validateMessageImage(profilePic, 'profilePic');
  }
  if (Object.keys(result).length === 0) {
    throw new ValidationError('At least one field must be provided for update', 'profile');
  }

  return result;
};

// Send message validation
export const validateSendMessage = (data) => {
  const { text, image } = data;
  const validatedText = validateMessageText(text);
  const validatedImage = validateMessageImage(image);

  if (!validatedText && !validatedImage) {
    throw new ValidationError('Message must contain text or image', 'message');
  }

  return {
    text: validatedText,
    image: validatedImage,
  };
};

// Pagination validation
export const validatePagination = (page, limit) => {
  const parsedPage = Number.parseInt(page || '1', 10);
  const parsedLimit = Number.parseInt(limit || '50', 10);

  return {
    page: Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1),
    limit: Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 100),
  };
};

// Search query validation
export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    throw new ValidationError('Search query is required', 'query');
  }

  const trimmed = query.trim();
  if (trimmed.length < 1) {
    throw new ValidationError('Search query must not be empty', 'query');
  }
  if (trimmed.length > 100) {
    throw new ValidationError('Search query is too long', 'query');
  }

  return trimmed;
};

export default {
  ValidationError,
  validateEmail,
  validatePassword,
  validateFullName,
  validateBio,
  validateMessageText,
  validateMessageImage,
  validateObjectId,
  validateSignup,
  validateLogin,
  validateUpdateProfile,
  validateSendMessage,
  validatePagination,
  validateSearchQuery,
};
