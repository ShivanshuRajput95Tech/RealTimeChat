import Message from '../models/Message.js';
import User from '../models/User.js';
import Channel from '../models/Channel.js';
import Group from '../models/Group.js';
import Workspace from '../models/Workspace.js';
import logger from '../lib/logger.js';

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const messageQuery = { senderId: userId, ...(Object.keys(dateFilter).length && { createdAt: dateFilter }) };
    const receivedQuery = { receiverId: userId, ...(Object.keys(dateFilter).length && { createdAt: dateFilter }) };

    const [
      sentMessages,
      receivedMessages,
      totalChannels,
      totalGroups,
      totalWorkspaces,
      activeDays,
    ] = await Promise.all([
      Message.countDocuments(messageQuery),
      Message.countDocuments(receivedQuery),
      Channel.countDocuments({ members: userId }),
      Group.countDocuments({ members: userId }),
      Workspace.countDocuments({ members: userId }),
      Message.distinct('createdAt', messageQuery).then(dates => {
        const uniqueDays = new Set(dates.map(d => d.toISOString().split('T')[0]));
        return uniqueDays.size;
      }),
    ]);

    const channelMessages = await Message.aggregate([
      { $match: { senderId: userId, channelId: { $ne: null }, ...(Object.keys(dateFilter).length && { createdAt: dateFilter }) } },
      { $group: { _id: '$channelId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const dailyStats = await Message.aggregate([
      { $match: { senderId: userId, ...(Object.keys(dateFilter).length && { createdAt: dateFilter }) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    const responseTime = await Message.aggregate([
      { $match: { receiverId: userId, seenAt: { $exists: true, $ne: null } } },
      {
        $project: {
          responseTime: {
            $subtract: ['$seenAt', '$createdAt'],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
    ]);

    res.json({
      success: true,
      analytics: {
        sentMessages,
        receivedMessages,
        totalChannels,
        totalGroups,
        totalWorkspaces,
        activeDays,
        topChannels: channelMessages,
        dailyStats,
        avgResponseTime: responseTime[0]?.avgResponseTime || 0,
      },
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activity = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: { $cond: [{ $eq: ['$senderId', userId] }, 1, 0] } },
          received: { $sum: { $cond: [{ $eq: ['$receiverId', userId] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, activity });
  } catch (error) {
    logger.error('User activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};
