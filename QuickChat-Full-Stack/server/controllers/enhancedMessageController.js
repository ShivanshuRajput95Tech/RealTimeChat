import Message from "../models/Message.js";
import MessageTemplate from "../models/MessageTemplate.js";
import User from "../models/User.js";
import { safeEmitToUser, userSocketMap } from "../socket.js";
import logger from "../lib/logger.js";

export const searchMessages = async (req, res) => {
    try {
        const { query, channelId, groupId, userId, startDate, endDate, limit = 50 } = req.query;
        const userIdParam = req.user._id;

        if (!query && !channelId && !groupId && !userId && !startDate) {
            return res.status(400).json({ success: false, message: "At least one search parameter required" });
        }

        const searchQuery = { deleted: false };

        if (query) {
            searchQuery.$or = [
                { text: { $regex: query, $options: "i" } },
                { "file.name": { $regex: query, $options: "i" } },
            ];
        }

        if (channelId) searchQuery.channelId = channelId;
        if (groupId) searchQuery.groupId = groupId;
        
        if (userId) {
            searchQuery.$or = searchQuery.$or || [];
            searchQuery.$or.push({ senderId: userId }, { receiverId: userId });
        }

        if (startDate || endDate) {
            searchQuery.createdAt = {};
            if (startDate) searchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) searchQuery.createdAt.$lte = new Date(endDate);
        }

        const messages = await Message.find(searchQuery)
            .populate("senderId", "fullName profilePic")
            .populate("receiverId", "fullName profilePic")
            .populate("channelId", "name")
            .populate("groupId", "name")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ success: true, messages, count: messages.length });
    } catch (error) {
        logger.error("searchMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const setMessagePriority = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { priority } = req.body;
        const userId = req.user._id;

        if (!["normal", "high", "urgent"].includes(priority)) {
            return res.status(400).json({ success: false, message: "Invalid priority value" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Can only set priority on your own messages" });
        }

        message.priority = priority;
        await message.save();

        const populatedMessage = await Message.findById(messageId)
            .populate("senderId", "fullName profilePic")
            .lean();

        if (message.receiverId) {
            safeEmitToUser(message.receiverId.toString(), "messagePriorityUpdated", {
                messageId,
                priority,
            });
        }

        if (message.channelId) {
            safeEmitToUser(`channel:${message.channelId}`, "messagePriorityUpdated", {
                messageId,
                priority,
            });
        }

        if (message.groupId) {
            safeEmitToUser(`group:${message.groupId}`, "messagePriorityUpdated", {
                messageId,
                priority,
            });
        }

        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        logger.error("setMessagePriority error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTemplates = async (req, res) => {
    try {
        const userId = req.user._id;
        const { workspaceId } = req.query;

        const query = {
            $or: [
                { userId },
                { isGlobal: true },
                { workspaceId },
            ],
        };

        const templates = await MessageTemplate.find(query)
            .sort({ usageCount: -1, createdAt: -1 })
            .lean();

        res.json({ success: true, templates });
    } catch (error) {
        logger.error("getTemplates error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTemplate = async (req, res) => {
    try {
        const { title, content, shortcut, category, isGlobal, workspaceId } = req.body;
        const userId = req.user._id;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: "Title and content are required" });
        }

        if (shortcut) {
            const existing = await MessageTemplate.findOne({ shortcut, userId });
            if (existing) {
                return res.status(400).json({ success: false, message: "Shortcut already in use" });
            }
        }

        const template = await MessageTemplate.create({
            userId,
            title,
            content,
            shortcut,
            category: category || "general",
            isGlobal: isGlobal || false,
            workspaceId,
        });

        res.status(201).json({ success: true, template });
    } catch (error) {
        logger.error("createTemplate error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const { title, content, shortcut, category } = req.body;
        const userId = req.user._id;

        const template = await MessageTemplate.findById(templateId);
        if (!template) {
            return res.status(404).json({ success: false, message: "Template not found" });
        }

        if (template.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Can only edit your own templates" });
        }

        if (title) template.title = title;
        if (content) template.content = content;
        if (shortcut) template.shortcut = shortcut;
        if (category) template.category = category;

        await template.save();

        res.json({ success: true, template });
    } catch (error) {
        logger.error("updateTemplate error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user._id;

        const template = await MessageTemplate.findById(templateId);
        if (!template) {
            return res.status(404).json({ success: false, message: "Template not found" });
        }

        if (template.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Can only delete your own templates" });
        }

        await MessageTemplate.findByIdAndDelete(templateId);

        res.json({ success: true, message: "Template deleted" });
    } catch (error) {
        logger.error("deleteTemplate error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const useTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;

        const template = await MessageTemplate.findByIdAndUpdate(
            templateId,
            { $inc: { usageCount: 1 } },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ success: false, message: "Template not found" });
        }

        res.json({ success: true, template });
    } catch (error) {
        logger.error("useTemplate error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserLastSeen = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const targetUser = await User.findById(userId).select("lastSeen privacy status").lean();
        
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!targetUser.privacy?.showLastSeen && targetUser._id.toString() !== currentUserId.toString()) {
            return res.json({ success: true, lastSeen: null, message: "User hides last seen" });
        }

        const canView = targetUser.privacy?.showLastSeen || targetUser._id.toString() === currentUserId.toString();
        
        res.json({ 
            success: true, 
            lastSeen: canView ? targetUser.lastSeen : null,
            isOnline: targetUser.status === "online",
            status: targetUser.status,
        });
    } catch (error) {
        logger.error("getUserLastSeen error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMessageStatus = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { status } = req.body;

        if (!["sending", "sent", "delivered", "read"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        message.status = status;
        if (status === "read") {
            message.seen = true;
            message.seenAt = new Date();
            if (!message.seenBy.includes(req.user._id)) {
                message.seenBy.push(req.user._id);
            }
        }

        await message.save();

        const populatedMessage = await Message.findById(messageId)
            .populate("senderId", "fullName profilePic")
            .lean();

        safeEmitToUser(message.senderId.toString(), "messageStatusUpdated", {
            messageId,
            status,
        });

        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        logger.error("updateMessageStatus error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};