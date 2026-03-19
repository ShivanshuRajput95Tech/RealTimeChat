// services/messageService.js
// Message business logic layer

import Message from '../models/Message.js';
import User from '../models/User.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import logger from '../lib/logger.js';
import cloudinary from '../lib/cloudinary.js';
import { validateObjectId } from '../lib/validators.js';

export class MessageService {
  static async getUsersForSidebar(userId) {
    logger.debug('Fetching users for sidebar', { userId });

    try {
      const users = await User.find({ _id: { $ne: userId } }).select('-password').lean();

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
    const validatedOtherUserId = validateObjectId(otherUserId, 'selectedUserId');
    logger.debug('Fetching messages', { userId, otherUserId: validatedOtherUserId, page, limit });

    try {
      const skip = (page - 1) * limit;
      const query = {
        $or: [
          { senderId: userId, receiverId: validatedOtherUserId },
          { senderId: validatedOtherUserId, receiverId: userId },
        ],
      };

      const total = await Message.countDocuments(query);
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      await Message.updateMany(
        {
          senderId: validatedOtherUserId,
          receiverId: userId,
          seen: false,
        },
        { seen: true },
      );

      logger.debug('Messages fetched successfully', {
        userId,
        otherUserId: validatedOtherUserId,
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
      logger.error('Error fetching messages', error, { userId, otherUserId: validatedOtherUserId });
      throw error;
    }
  }

  static async sendMessage(senderId, receiverId, messageData) {
    const validatedReceiverId = validateObjectId(receiverId, 'receiverId');
    const { text, image } = messageData;

    logger.debug('Sending message', { senderId, receiverId: validatedReceiverId, hasImage: !!image });

    try {
      const receiver = await User.findById(validatedReceiverId);
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

      const message = await Message.create({
        senderId,
        receiverId: validatedReceiverId,
        text,
        image: imageUrl,
        seen: false,
      });

      logger.info('Message sent successfully', {
        messageId: message._id,
        senderId,
        receiverId: validatedReceiverId,
      });

      return message;
    } catch (error) {
      logger.error('Error sending message', error, { senderId, receiverId: validatedReceiverId });
      throw error;
    }
  }

  static async editMessage(messageId, userId, text) {
    logger.debug('Editing message', { messageId, userId });

    try {
      const message = await Message.findById(validateObjectId(messageId, 'messageId'));
      if (!message) {
        throw new NotFoundError('Message');
      }
      if (message.senderId.toString() !== userId.toString()) {
        throw new ForbiddenError('You can only edit your own messages');
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
      const message = await Message.findById(validateObjectId(messageId, 'messageId'));
      if (!message) {
        throw new NotFoundError('Message');
      }
      if (message.senderId.toString() !== userId.toString()) {
        throw new ForbiddenError('You can only delete your own messages');
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

  static async markMessageAsRead(messageId, userId) {
    const validatedMessageId = validateObjectId(messageId, 'messageId');

    try {
      const message = await Message.findById(validatedMessageId);
      if (!message) {
        throw new NotFoundError('Message');
      }
      if (message.receiverId.toString() !== userId.toString()) {
        throw new ForbiddenError('You can only mark your own received messages as read');
      }

      message.seen = true;
      await message.save();
      return message;
    } catch (error) {
      logger.error('Error marking message as read', error, { messageId: validatedMessageId, userId });
      throw error;
    }
  }
}

export default MessageService;
