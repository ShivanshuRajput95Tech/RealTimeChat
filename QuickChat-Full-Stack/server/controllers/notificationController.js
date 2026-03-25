import Notification from "../models/Notification.js";
import { safeEmitToUser } from "../socket.js";
import logger from "../lib/logger.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50, offset = 0, unreadOnly = false } = req.query;

        const query = { recipient: userId };
        if (unreadOnly === "true") query.read = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .populate("sender", "fullName profilePic")
            .lean();

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            read: false,
        });

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        logger.error("getNotifications error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.json({ success: true, notification });
    } catch (error) {
        logger.error("markAsRead error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        logger.error("markAllAsRead error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });

        res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
        logger.error("deleteNotification error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.deleteMany({ recipient: userId });
        res.json({ success: true, message: "All notifications cleared" });
    } catch (error) {
        logger.error("clearAllNotifications error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            read: false,
        });
        res.json({ success: true, count });
    } catch (error) {
        logger.error("getUnreadCount error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createNotification = async ({ recipientId, senderId, type, title, body, link, data }) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type,
            title,
            body: body || "",
            link: link || "",
            data: data || {},
        });

        const populated = await Notification.findById(notification._id)
            .populate("sender", "fullName profilePic")
            .lean();

        safeEmitToUser(recipientId.toString(), "notification", populated);

        return notification;
    } catch (error) {
        logger.error("createNotification error:", error.message);
        return null;
    }
};
