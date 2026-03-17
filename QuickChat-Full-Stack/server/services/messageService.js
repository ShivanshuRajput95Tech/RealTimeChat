// services/messageService.js
// Message business logic layer

import Message from '../models/Message.js';
import User from '../models/User.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import logger from '../lib/logger.js';
import cloudinary from '../lib/cloudinary.js';

export class MessageService {
  static async getUsersForSidebar(userId) {
    logger.debug('Fetching users for sidebar', { userId });

    try {
      // Get all users except current user
      const users = await User.find({ _id: { $ne: userId } })
        .select('-password')
        .lean();

      // Get unseen message counts using aggregation
      const unseenCounts = await Message.aggregate([
        {
          $match: {
            receiverId: userId,
            seen: false,
          },
        },
        {
          $group: {
            _id: '$senderId',
            count: { $sum: 1 },
          },
        },
      ]);

      const unseenMessages = unseenCounts.reduce((acc, item) => {
        acc[item._id.toString()] = item.count;
        return acc;
      }, {});

      logger.debug('Users fetched successfully', { userId, count: users.length });

      return { users, unseenMessages };
    } catch (error) {
      logger.error('Error fetching users', error, { userId });
      throw error;
    }
  }

  static async getMessages(userId, otherUserId, page = 1, limit = 50) {
    logger.debug('Fetching messages', { userId, otherUserId, page, limit });

    try {
      const skip = (page - 1) * limit;

      const query = {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      };

      // Get total count
      const total = await Message.countDocuments(query);

      // Get messages with pagination
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Mark messages as seen
      await Message.updateMany(
        {
          senderId: otherUserId,
          receiverId: userId,
          seen: false,
        },
        { seen: true },
      );

      logger.debug('Messages fetched successfully', {
        userId,
        otherUserId,
        count: messages.length,
        total,
      });

      return {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching messages', error, { userId, otherUserId });
      throw error;
    }
  }

  static async sendMessage(senderId, receiverId, messageData) {
    const { text, image } = messageData;

    logger.debug('Sending message', { senderId, receiverId, hasImage: !!image });

    try {
      // Verify receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        throw new NotFoundError('Recipient');
      }

      let imageUrl = null;
      if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'realtimechat/messages',
          resource_type: 'auto',
        });
        imageUrl = uploadResponse.secure_url;
      }

      // Create message
      const message = await Message.create({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        seen: false,
      });

      logger.info('Message sent successfully', {
        messageId: message._id,
        senderId,
        receiverId,
      });

      return message;
    } catch (error) {
      logger.error('Error sending message', error, { senderId, receiverId });
      throw error;
    }
  }

  static async editMessage(messageId, userId, text) {
    logger.debug('Editing message', { messageId, userId });

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new NotFoundError('Message');
      }

      if (message.senderId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }

      message.text = text;
      message.editedAt = new Date();
      await message.save();

      logger.info('Message edited successfully', { messageId, userId });

      return message;
    } catch (error) {
      logger.error('Error editing message', error, { messageId, userId });
      throw error;
    }
  }

  static async deleteMessage(messageId, userId) {
    logger.debug('Deleting message', { messageId, userId });

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new NotFoundError('Message');
      }

      if (message.senderId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }

      message.deletedAt = new Date();
      await message.save();

      logger.info('Message deleted successfully', { messageId, userId });

      return message;
    } catch (error) {
      logger.error('Error deleting message', error, { messageId, userId });
      throw error;
    }
  }

  static async markMessageAsRead(messageId) {
    try {
      await Message.findByIdAndUpdate(messageId, { seen: true });
    } catch (error) {
      logger.error('Error marking message as read', error, { messageId });
      throw error;
    }
  }
}

export default MessageService;
