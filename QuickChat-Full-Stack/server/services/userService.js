// services/userService.js
// User business logic layer

import User from '../models/User.js';
import cloudinary from '../lib/cloudinary.js';
import { NotFoundError } from '../lib/errors.js';
import logger from '../lib/logger.js';

export class UserService {
  static async getUserById(userId) {
    logger.debug('Fetching user', { userId });

    try {
      const user = await User.findById(userId).select('-password').lean();

      if (!user) {
        throw new NotFoundError('User');
      }

      logger.debug('User fetched successfully', { userId });

      return UserService.formatUserResponse(user);
    } catch (error) {
      logger.error('Error fetching user', error, { userId });
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    logger.debug('Updating user profile', { userId });

    try {
      const { fullName, bio, profilePic } = updateData;

      const updateFields = {};

      if (fullName !== undefined) {
        updateFields.fullName = fullName;
      }

      if (bio !== undefined) {
        updateFields.bio = bio;
      }

      if (profilePic !== undefined && profilePic) {
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
          folder: 'realtimechat/profiles',
          resource_type: 'auto',
          quality: 'auto',
          aspect_ratio: '1:1',
          crop: 'fill',
        });
        updateFields.profilePic = uploadResponse.secure_url;
      }

      const user = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
      }).select('-password');

      if (!user) {
        throw new NotFoundError('User');
      }

      logger.info('User profile updated successfully', { userId });

      return UserService.formatUserResponse(user);
    } catch (error) {
      logger.error('Error updating user profile', error, { userId });
      throw error;
    }
  }

  static async updateUserStatus(userId, status) {
    logger.debug('Updating user status', { userId, status });

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { status, lastSeen: new Date() },
        { new: true },
      ).select('-password');

      if (!user) {
        throw new NotFoundError('User');
      }

      logger.debug('User status updated', { userId, status });

      return user;
    } catch (error) {
      logger.error('Error updating user status', error, { userId });
      throw error;
    }
  }

  static async searchUsers(query, limit = 20) {
    logger.debug('Searching users', { query });

    try {
      const users = await User.find({
        $or: [
          { fullName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      })
        .select('-password')
        .limit(limit)
        .lean();

      logger.debug('Users searched successfully', { query, count: users.length });

      return users.map((user) => UserService.formatUserResponse(user));
    } catch (error) {
      logger.error('Error searching users', error, { query });
      throw error;
    }
  }

  static async deleteUser(userId) {
    logger.warn('Deleting user', { userId });

    try {
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        throw new NotFoundError('User');
      }

      logger.warn('User deleted successfully', { userId });

      return true;
    } catch (error) {
      logger.error('Error deleting user', error, { userId });
      throw error;
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
      createdAt: user.createdAt,
    };
  }
}

export default UserService;
