import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import Channel from "../models/Channel.js";
import Workspace from "../models/Workspace.js";
import cloudinary from "../lib/cloudinary.js";
import { safeEmitToUser, userSocketMap } from "../socket.js";
import redis from "../lib/redis.js";
import logger from "../lib/logger.js";
import { createNotification } from "./notificationController.js";
import aiService from "../services/aiService.js";
import SentimentLog from "../models/SentimentLog.js";
import { trackUserActivity } from "../lib/activityTracker.js";

const processMessageInBackground = (message) => {
    if (!message.text || message.text.length < 10) return;
    // Sentiment scoring
    aiService.detectSentiment(message.text).then(sentiment => {
        if (!sentiment) return;
        SentimentLog.create({
            userId: message.senderId,
            workspaceId: message.metadata?.workspaceId || null,
            channelId: message.channelId,
            messageId: message._id,
            score: sentiment.score,
            label: sentiment.label,
            confidence: sentiment.confidence,
        }).catch(() => {});
    }).catch(() => {});
    // Embedding generation for RAG search
    aiService.generateEmbedding(message.text).then(embedding => {
        if (embedding) {
            Message.findByIdAndUpdate(message._id, { embedding }).catch(() => {});
        }
    }).catch(() => {});
};

const emitToTarget = (targetId, event, data) => {
    const socketId = userSocketMap[targetId];
    if (socketId) {
        safeEmitToUser(targetId, event, data);
    }
};

const emitToChannel = (channelId, event, data) => {
    safeEmitToRoom(`channel:${channelId}`, event, data);
};

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const cacheKey = `users:sidebar:${userId}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password").lean();

        const unseenCounts = await Message.aggregate([
            {
                $match: {
                    senderId: { $in: filteredUsers.map(u => u._id) },
                    receiverId: userId,
                    seen: false,
                },
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 },
                },
            },
        ]);

        const unseenMessages = {};
        for (const item of unseenCounts) {
            unseenMessages[item._id.toString()] = item.count;
        }

        const response = { success: true, users: filteredUsers, unseenMessages };
        await redis.set(cacheKey, JSON.stringify(response), 300);
        res.json(response);
    } catch (error) {
        logger.error("getUsersForSidebar error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        const { before, limit = 50 } = req.query;

        const cacheKey = `messages:${myId}:${selectedUserId}:${before || "all"}:${limit}`;

        const cached = await redis.get(cacheKey);
        if (cached && !before) {
            return res.json(JSON.parse(cached));
        }

        const query = {
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("senderId", "fullName profilePic")
            .lean();

        const reversed = messages.reverse();

        if (!before) {
            await Message.updateMany(
                { senderId: selectedUserId, receiverId: myId, seen: false },
                { seen: true, seenAt: new Date() }
            );

            const senderSocketId = userSocketMap[selectedUserId];
            if (senderSocketId) {
                emitToTarget(selectedUserId, "messagesSeen", { by: myId });
            }

            await redis.set(cacheKey, JSON.stringify({ success: true, messages: reversed }), 60);
        }

        res.json({ success: true, messages: reversed });
    } catch (error) {
        logger.error("getMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMessageById = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId)
            .populate("senderId", "fullName profilePic")
            .populate("replyTo")
            .lean();

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        res.json({ success: true, message });
    } catch (error) {
        logger.error("getMessageById error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByIdAndUpdate(
            id,
            { seen: true, seenAt: new Date() },
            { new: true }
        );

        if (message) {
            const senderSocketId = userSocketMap[message.senderId.toString()];
            if (senderSocketId) {
                emitToTarget(message.senderId.toString(), "messageSeen", { messageId: id, by: req.user._id });
            }
        }

        res.json({ success: true });
    } catch (error) {
        logger.error("markMessageAsSeen error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const myId = req.user._id;

        const result = await Message.updateMany(
            {
                $or: [
                    { senderId: conversationId, receiverId: myId },
                    { receiverId: conversationId, senderId: myId },
                ],
                seen: false,
            },
            { seen: true, seenAt: new Date() }
        );

        const targetSocketId = userSocketMap[conversationId];
        if (targetSocketId) {
            emitToTarget(conversationId, "messagesSeen", { by: myId, count: result.modifiedCount });
        }

        await redis.del(`messages:${conversationId}:${myId}:all:50`);
        await redis.del(`messages:${myId}:${conversationId}:all:50`);

        res.json({ success: true, count: result.modifiedCount });
    } catch (error) {
        logger.error("markMessagesAsRead error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, replyTo, file } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        if (!text && !image && !file) {
            return res.status(400).json({ success: false, message: "Message content is required" });
        }

        const receiver = await User.findById(receiverId).select("_id").lean();
        if (!receiver) {
            return res.status(404).json({ success: false, message: "Receiver not found" });
        }

        if (replyTo) {
            const parentMessage = await Message.findById(replyTo).select("_id").lean();
            if (!parentMessage) {
                return res.status(404).json({ success: false, message: "Reply target message not found" });
            }
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "messages",
                resource_type: "image",
            });
            imageUrl = uploadResponse.secure_url;
        }

        let fileData;
        if (file) {
            const uploadResponse = await cloudinary.uploader.upload(file, {
                folder: "messages/files",
                resource_type: "auto",
            });
            fileData = {
                url: uploadResponse.secure_url,
                name: req.body.fileName || uploadResponse.original_filename || "file",
                size: uploadResponse.bytes || 0,
                type: uploadResponse.resource_type || "application/octet-stream",
            };
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text || "",
            image: imageUrl,
            file: fileData,
            type: imageUrl ? "image" : fileData ? "file" : "text",
            replyTo,
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic")
            .populate("replyTo", "text senderId")
            .lean();

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            emitToTarget(receiverId, "newMessage", populatedMessage);
        }

        if (!receiverSocketId) {
            createNotification({
                recipientId: receiverId,
                senderId,
                type: replyTo ? "reply" : "message",
                title: `New message from ${populatedMessage.senderId.fullName}`,
                body: text ? (text.length > 100 ? text.slice(0, 100) + "..." : text) : (imageUrl ? "Sent an image" : "Sent a file"),
                data: { messageId: newMessage._id },
            }).catch((err) => logger.warn("Notification creation failed:", err.message));
        }

        await redis.del(`messages:${senderId}:${receiverId}:all:50`);
        await redis.del(`messages:${receiverId}:${senderId}:all:50`);

        processMessageInBackground(newMessage);
        trackUserActivity(senderId);

        res.status(201).json({ success: true, newMessage: populatedMessage });
    } catch (error) {
        logger.error("sendMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ success: false, message: "Message not found" });
        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Can only edit your own messages" });
        }

        message.text = text;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        const populatedMessage = await Message.findById(messageId)
            .populate("senderId", "fullName profilePic")
            .lean();

        if (message.receiverId) {
            const receiverSocketId = userSocketMap[message.receiverId.toString()];
            if (receiverSocketId) {
                emitToTarget(message.receiverId.toString(), "messageUpdated", populatedMessage);
            }
        }

        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        logger.error("editMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ success: false, message: "Message not found" });
        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Can only delete your own messages" });
        }

        message.deleted = true;
        message.text = "";
        message.image = "";
        message.file = undefined;
        await message.save();

        if (message.receiverId) {
            const receiverSocketId = userSocketMap[message.receiverId.toString()];
            if (receiverSocketId) {
                emitToTarget(message.receiverId.toString(), "messageDeleted", { messageId });
            }
        }

        res.json({ success: true, messageId });
    } catch (error) {
        logger.error("deleteMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ success: false, message: "Message not found" });

        const existingReaction = message.reactions.find((r) => r.emoji === emoji);

        if (existingReaction) {
            if (existingReaction.users.includes(userId)) {
                existingReaction.users = existingReaction.users.filter(
                    (u) => u.toString() !== userId.toString()
                );
                if (existingReaction.users.length === 0) {
                    message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
                }
            } else {
                existingReaction.users.push(userId);
            }
        } else {
            message.reactions.push({ emoji, users: [userId] });
        }

        await message.save();

        const updatedMessage = await Message.findById(messageId)
            .populate("reactions.users", "fullName profilePic")
            .lean();

        const targetId = message.senderId.toString() === userId.toString()
                ? message.receiverId
                : message.senderId;
            if (targetId) {
                emitToTarget(targetId.toString(), "messageReactionUpdated", {
                    messageId,
                    reactions: updatedMessage.reactions,
                });
            }

        res.json({ success: true, reactions: updatedMessage.reactions });
    } catch (error) {
        logger.error("toggleReaction error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getThreadMessages = async (req, res) => {
    try {
        const { messageId } = req.params;
        const messages = await Message.find({ threadId: messageId, deleted: false })
            .sort({ createdAt: 1 })
            .populate("senderId", "fullName profilePic")
            .lean();

        res.json({ success: true, messages });
    } catch (error) {
        logger.error("getThreadMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendThreadReply = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text, image } = req.body;

        const parentMessage = await Message.findById(messageId);
        if (!parentMessage) return res.status(404).json({ success: false, message: "Parent message not found" });

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "messages/threads",
                resource_type: "image",
            });
            imageUrl = uploadResponse.secure_url;
        }

        const reply = await Message.create({
            senderId: req.user._id,
            threadId: messageId,
            channelId: parentMessage.channelId,
            groupId: parentMessage.groupId,
            receiverId: parentMessage.receiverId,
            text,
            image: imageUrl,
            type: imageUrl ? "image" : "text",
        });

        await Message.findByIdAndUpdate(messageId, { $inc: { threadCount: 1 } });

        const populatedReply = await Message.findById(reply._id)
            .populate("senderId", "fullName profilePic")
            .lean();

        res.status(201).json({ success: true, message: populatedReply });
    } catch (error) {
        logger.error("sendThreadReply error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const togglePinMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        const senderId = message.senderId?.toString ? message.senderId.toString() : message.senderId;
        const receiverId = message.receiverId?.toString ? message.receiverId.toString() : message.receiverId;
        const userId = req.user._id.toString();

        const isOwner = senderId === userId;
        const isReceiver = receiverId === userId;

        if (!isOwner && !isReceiver) {
            return res.status(403).json({ success: false, message: "Can only pin messages you're involved in" });
        }

        message.pinned = !message.pinned;
        await message.save();

        const response = { success: true, pinned: message.pinned, messageId };

        if (receiverId && receiverId !== userId) {
            emitToTarget(receiverId, "messagePinned", response);
        }

        res.json(response);
    } catch (error) {
        logger.error("togglePinMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const searchMessages = async (req, res) => {
    try {
        const { q, type = "all", limit = 50, offset = 0 } = req.query;
        const userId = req.user._id;

        const userWorkspaceIds = await Workspace.find({ "members.user": userId }).distinct("_id");
        const [userChannelIds, userGroupIds] = await Promise.all([
            Channel.find({ workspace: { $in: userWorkspaceIds } }).distinct("_id"),
            Group.find({ members: userId }).distinct("_id"),
        ]);

        const query = {
            $and: [
                { deleted: false },
                {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId },
                        { channelId: { $in: userChannelIds } },
                        { groupId: { $in: userGroupIds } },
                    ],
                },
            ],
        };

        if (q) {
            query.$and.push({
                $or: [
                    { text: { $regex: q, $options: "i" } },
                    { "file.name": { $regex: q, $options: "i" } },
                ],
            });
        }

        if (type === "direct") {
            query.$and.push({ channelId: null, groupId: null });
        } else if (type === "channel") {
            query.$and.push({ channelId: { $ne: null } });
        } else if (type === "group") {
            query.$and.push({ groupId: { $ne: null } });
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .populate("senderId", "fullName profilePic")
            .lean();

        const total = await Message.countDocuments(query);

        res.json({ success: true, messages, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        logger.error("searchMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPinnedMessages = async (req, res) => {
    try {
        const { channelId, groupId, conversationId } = req.query;
        const userId = req.user._id;

        const query = { pinned: true, deleted: false };

        if (channelId) {
            query.channelId = channelId;
        } else if (groupId) {
            query.groupId = groupId;
        } else if (conversationId) {
            query.$or = [
                { senderId: conversationId, receiverId: userId },
                { senderId: userId, receiverId: conversationId },
            ];
        } else {
            query.$or = [
                { senderId: userId },
                { receiverId: userId },
            ];
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("senderId", "fullName profilePic")
            .lean();

        res.json({ success: true, messages });
    } catch (error) {
        logger.error("getPinnedMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getScheduledMessages = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            senderId: userId,
            scheduled: true,
            scheduledAt: { $gt: new Date() },
        })
            .sort({ scheduledAt: 1 })
            .populate("receiverId", "fullName profilePic")
            .populate("channelId", "name")
            .populate("groupId", "name")
            .lean();

        res.json({ success: true, messages });
    } catch (error) {
        logger.error("getScheduledMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const scheduleMessage = async (req, res) => {
    try {
        const { text, image, receiverId, channelId, groupId, scheduledAt } = req.body;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "messages/scheduled",
                resource_type: "image",
            });
            imageUrl = uploadResponse.secure_url;
        }

        const message = await Message.create({
            senderId,
            receiverId,
            channelId,
            groupId,
            text,
            image: imageUrl,
            type: imageUrl ? "image" : "text",
            scheduled: true,
            scheduledAt: new Date(scheduledAt),
        });

        await redis.zadd("scheduled:messages", new Date(scheduledAt).getTime(), message._id.toString());

        const populatedMessage = await Message.findById(message._id)
            .populate("receiverId", "fullName profilePic")
            .populate("channelId", "name")
            .populate("groupId", "name")
            .lean();

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        logger.error("scheduleMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelScheduledMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findOne({
            _id: messageId,
            senderId: userId,
            scheduled: true,
        });

        if (!message) {
            return res.status(404).json({ success: false, message: "Scheduled message not found" });
        }

        await message.deleteOne();
        await redis.zrem("scheduled:messages", messageId);

        res.json({ success: true, messageId });
    } catch (error) {
        logger.error("cancelScheduledMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const forwardMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { receiverId, channelId, groupId } = req.body;
        const senderId = req.user._id;

        const originalMessage = await Message.findById(messageId);
        if (!originalMessage || originalMessage.deleted) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        const messageData = {
            senderId,
            text: originalMessage.text || "",
            image: originalMessage.image,
            file: originalMessage.file,
            type: originalMessage.type,
            forwardedFrom: messageId,
            forwardedFromUser: originalMessage.senderId,
        };

        if (receiverId) messageData.receiverId = receiverId;
        if (channelId) messageData.channelId = channelId;
        if (groupId) messageData.groupId = groupId;

        const newMessage = await Message.create(messageData);

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic")
            .populate("forwardedFromUser", "fullName profilePic")
            .lean();

        if (receiverId) {
            emitToTarget(receiverId, "newMessage", populatedMessage);
        } else if (channelId) {
            const channel = await Channel.findById(channelId);
            if (channel) {
                const workspace = await Workspace.findById(channel.workspace);
                if (workspace) {
                    workspace.members.forEach((member) => {
                        emitToTarget(member.user.toString(), "channel:newMessage", {
                            channelId,
                            message: populatedMessage,
                        });
                    });
                }
            }
        } else if (groupId) {
            const group = await Group.findById(groupId);
            if (group) {
                group.members.forEach((memberId) => {
                    emitToTarget(memberId.toString(), "group:newMessage", {
                        groupId,
                        message: populatedMessage,
                    });
                });
            }
        }

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        logger.error("forwardMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const bookmarkMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message || message.deleted) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        const user = await User.findById(userId);
        const isBookmarked = user.bookmarks.includes(messageId);

        if (isBookmarked) {
            await User.findByIdAndUpdate(userId, { $pull: { bookmarks: messageId } });
            res.json({ success: true, bookmarked: false, messageId });
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { bookmarks: messageId } });
            res.json({ success: true, bookmarked: true, messageId });
        }
    } catch (error) {
        logger.error("bookmarkMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBookmarks = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate({
            path: "bookmarks",
            match: { deleted: false },
            populate: [
                { path: "senderId", select: "fullName profilePic" },
                { path: "receiverId", select: "fullName profilePic" },
                { path: "channelId", select: "name" },
                { path: "groupId", select: "name" },
            ],
            options: { sort: { createdAt: -1 }, limit: 100 },
        });

        res.json({ success: true, bookmarks: user.bookmarks || [] });
    } catch (error) {
        logger.error("getBookmarks error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
