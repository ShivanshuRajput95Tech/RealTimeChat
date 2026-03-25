import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import Workspace from "../models/Workspace.js";
import { safeEmitToUser, safeEmitToRoom } from "../socket.js";
import cloudinary from "../lib/cloudinary.js";
import logger from "../lib/logger.js";
import { trackUserActivity } from "../lib/activityTracker.js";

export const createChannel = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, topic, type, category, isPrivate, allowedMembers } = req.body;

        if (!name) return res.status(400).json({ success: false, message: "Channel name required" });

        const existing = await Channel.findOne({ workspace: workspaceId, name: name.toLowerCase().trim() });
        if (existing) return res.status(409).json({ success: false, message: "Channel with this name already exists" });

        const channel = await Channel.create({
            name: name.toLowerCase().trim(),
            topic: topic || "",
            type: type || "text",
            workspace: workspaceId,
            category: category || "Text Channels",
            isPrivate: isPrivate || false,
            allowedMembers: allowedMembers || [],
        });

        const workspace = await Workspace.findById(workspaceId);
        workspace.members.forEach((member) => {
            safeEmitToUser(member.user.toString(), "channel:created", { workspaceId, channel });
        });

        res.status(201).json({ success: true, channel });
    } catch (error) {
        logger.error("createChannel error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getChannels = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const channels = await Channel.find({ workspace: workspaceId, archived: false }).sort({ category: 1, position: 1 });
        res.json({ success: true, channels });
    } catch (error) {
        logger.error("getChannels error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await Channel.findById(channelId).populate("pinnedMessages");
        if (!channel) return res.status(404).json({ success: false, message: "Channel not found" });
        if (channel.archived) return res.status(404).json({ success: false, message: "Channel is archived" });
        res.json({ success: true, channel });
    } catch (error) {
        logger.error("getChannel error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { name, topic, category, position, isPrivate, allowedMembers, slowMode } = req.body;

        const updateData = {};
        if (name) updateData.name = name.toLowerCase().trim();
        if (topic !== undefined) updateData.topic = topic;
        if (category) updateData.category = category;
        if (position !== undefined) updateData.position = position;
        if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
        if (allowedMembers) updateData.allowedMembers = allowedMembers;
        if (slowMode !== undefined) updateData.slowMode = slowMode;

        const channel = await Channel.findByIdAndUpdate(channelId, updateData, { new: true });
        res.json({ success: true, channel });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "A channel with this name already exists in the workspace" });
        }
        logger.error("updateChannel error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        await Message.deleteMany({ channelId });
        await Channel.findByIdAndDelete(channelId);
        res.json({ success: true, message: "Channel deleted" });
    } catch (error) {
        logger.error("deleteChannel error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getChannelMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { limit = 50, before } = req.query;

        const query = { channelId, deleted: false };
        if (before) query.createdAt = { $lt: new Date(before) };

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("senderId", "fullName profilePic")
            .populate("replyTo", "text senderId")
            .lean();

        res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
        logger.error("getChannelMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendChannelMessage = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { text, image, replyTo, type } = req.body;

        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ success: false, message: "Channel not found" });

        if (channel.slowMode > 0) {
            const lastMessage = await Message.findOne({
                channelId,
                senderId: req.user._id,
            }).sort({ createdAt: -1 });

            if (lastMessage) {
                const timeSince = (Date.now() - lastMessage.createdAt.getTime()) / 1000;
                if (timeSince < channel.slowMode) {
                    return res.status(429).json({
                        success: false,
                        message: `Slow mode: wait ${Math.ceil(channel.slowMode - timeSince)}s`,
                    });
                }
            }
        }

        const messageData = {
            senderId: req.user._id,
            channelId,
            text: text || "",
            type: type || "text",
        };

        if (image && image.startsWith("data:")) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "channels",
                resource_type: "image",
            });
            messageData.image = uploadResponse.secure_url;
            messageData.type = "image";
        } else if (image) {
            messageData.image = image;
        }
        if (replyTo) {
            messageData.replyTo = replyTo;
            await Message.findByIdAndUpdate(replyTo, { $inc: { threadCount: 1 } });
        }

        const newMessage = await Message.create(messageData);

        await Channel.findByIdAndUpdate(channelId, { lastMessageAt: new Date() });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic")
            .populate("replyTo", "text senderId");

        const workspace = await Workspace.findById(channel.workspace);
        workspace.members.forEach((member) => {
            safeEmitToUser(member.user.toString(), "channel:newMessage", {
                channelId,
                message: populatedMessage,
            });
        });

        trackUserActivity(req.user._id, { channelId });

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        logger.error("sendChannelMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const pinMessage = async (req, res) => {
    try {
        const { channelId, messageId } = req.params;
        const channel = await Channel.findById(channelId);

        if (channel.pinnedMessages.includes(messageId)) {
            channel.pinnedMessages = channel.pinnedMessages.filter((id) => id.toString() !== messageId);
            await Message.findByIdAndUpdate(messageId, { pinned: false });
        } else {
            channel.pinnedMessages.push(messageId);
            await Message.findByIdAndUpdate(messageId, { pinned: true });
        }

        await channel.save();
        res.json({ success: true, pinnedMessages: channel.pinnedMessages });
    } catch (error) {
        logger.error("pinMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const archiveChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await Channel.findByIdAndUpdate(channelId, { archived: true }, { new: true });
        res.json({ success: true, channel });
    } catch (error) {
        logger.error("archiveChannel error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
