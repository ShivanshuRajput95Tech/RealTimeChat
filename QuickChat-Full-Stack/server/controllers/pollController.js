import Poll from "../models/Poll.js";
import Message from "../models/Message.js";
import { getIO, userSocketMap } from "../socket.js";
import logger from "../lib/logger.js";

export const createPoll = async (req, res) => {
    try {
        const { question, options, channelId, groupId, receiverId, anonymous, multipleChoice, expiresAt } = req.body;
        const creatorId = req.user._id;

        if (!question || !options || options.length < 2) {
            return res.status(400).json({ success: false, message: "Question and at least 2 options required" });
        }

        const pollOptions = options.map(opt => ({ text: opt, voters: [] }));

        const poll = await Poll.create({
            creatorId,
            question,
            options: pollOptions,
            channelId,
            groupId,
            receiverId,
            anonymous: anonymous || false,
            multipleChoice: multipleChoice || false,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        });

        const messageData = {
            senderId: creatorId,
            text: `Poll: ${question}`,
            type: "text",
        };
        if (channelId) messageData.channelId = channelId;
        if (groupId) messageData.groupId = groupId;
        if (receiverId) messageData.receiverId = receiverId;

        const message = await Message.create(messageData);
        poll.messageId = message._id;
        await poll.save();

        const populatedPoll = await Poll.findById(poll._id)
            .populate("creatorId", "fullName profilePic")
            .lean();

        const pollPayload = { ...populatedPoll, pollId: populatedPoll._id };

        if (receiverId) {
            const socketId = userSocketMap[receiverId];
            if (socketId) try { getIO().to(socketId).emit("newPoll", pollPayload); } catch {}
        } else if (channelId) {
            try { getIO().to(`channel:${channelId}`).emit("newPoll", pollPayload); } catch {}
        } else if (groupId) {
            try { getIO().to(`group:${groupId}`).emit("newPoll", pollPayload); } catch {}
        }

        res.status(201).json({ success: true, poll: populatedPoll });
    } catch (error) {
        logger.error("createPoll error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const votePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const { optionId } = req.body;
        const userId = req.user._id;

        const poll = await Poll.findById(pollId);
        if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });
        if (poll.closed) return res.status(400).json({ success: false, message: "Poll is closed" });
        if (poll.expiresAt && new Date() > poll.expiresAt) {
            poll.closed = true;
            await poll.save();
            return res.status(400).json({ success: false, message: "Poll has expired" });
        }

        if (!poll.multipleChoice) {
            poll.options.forEach(opt => {
                opt.voters = opt.voters.filter(v => v.toString() !== userId.toString());
            });
        }

        const option = poll.options.id(optionId);
        if (!option) return res.status(404).json({ success: false, message: "Option not found" });

        if (option.voters.some(v => v.toString() === userId.toString())) {
            option.voters = option.voters.filter(v => v.toString() !== userId.toString());
        } else {
            option.voters.push(userId);
        }

        await poll.save();

        const updatedPoll = await Poll.findById(pollId)
            .populate("creatorId", "fullName profilePic")
            .lean();

        if (poll.channelId) {
            try { getIO().to(`channel:${poll.channelId}`).emit("pollUpdated", updatedPoll); } catch {}
        } else if (poll.groupId) {
            try { getIO().to(`group:${poll.groupId}`).emit("pollUpdated", updatedPoll); } catch {}
        } else if (poll.receiverId) {
            const socketId = userSocketMap[poll.receiverId.toString()];
            if (socketId) try { getIO().to(socketId).emit("pollUpdated", updatedPoll); } catch {}
        }

        res.json({ success: true, poll: updatedPoll });
    } catch (error) {
        logger.error("votePoll error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const closePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const poll = await Poll.findById(pollId);

        if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });
        if (poll.creatorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only creator can close poll" });
        }

        poll.closed = true;
        await poll.save();

        const updatedPoll = await Poll.findById(pollId)
            .populate("creatorId", "fullName profilePic")
            .lean();

        res.json({ success: true, poll: updatedPoll });
    } catch (error) {
        logger.error("closePoll error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const poll = await Poll.findById(pollId)
            .populate("creatorId", "fullName profilePic")
            .lean();

        if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

        res.json({ success: true, poll });
    } catch (error) {
        logger.error("getPoll error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getReminders = async (req, res) => {
    try {
        const userId = req.user._id;
        const reminders = await (await import("../models/Reminder.js")).default.find({
            userId,
            sent: false,
        }).sort({ remindAt: 1 }).lean();

        res.json({ success: true, reminders });
    } catch (error) {
        logger.error("getReminders error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelReminder = async (req, res) => {
    try {
        const { reminderId } = req.params;
        const userId = req.user._id;

        const Reminder = (await import("../models/Reminder.js")).default;
        await Reminder.findOneAndDelete({ _id: reminderId, userId });

        res.json({ success: true, message: "Reminder cancelled" });
    } catch (error) {
        logger.error("cancelReminder error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
