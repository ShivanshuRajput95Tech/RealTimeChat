import aiService, { QUICKBOT_ID } from "../services/aiService.js";
import Message from "../models/Message.js";
import SentimentLog from "../models/SentimentLog.js";
import Reminder from "../models/Reminder.js";
import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import Group from "../models/Group.js";
import logger from "../lib/logger.js";
import { getIO, userSocketMap } from "../socket.js";

export const getSmartReplies = async (req, res) => {
    try {
        const { conversationId, channelId, groupId } = req.query;
        const userId = req.user._id;

        let contextQuery = {};
        if (channelId) {
            contextQuery.channelId = channelId;
        } else if (groupId) {
            contextQuery.groupId = groupId;
        } else if (conversationId) {
            contextQuery.$or = [
                { senderId: userId, receiverId: conversationId },
                { senderId: conversationId, receiverId: userId },
            ];
        }

        const recentMessages = await Message.find({ ...contextQuery, deleted: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("senderId", "fullName")
            .lean();

        if (recentMessages.length === 0) {
            return res.json({ success: true, suggestions: [] });
        }

        const reversed = recentMessages.reverse();
        const lastMessage = reversed[reversed.length - 1];

        if (lastMessage.senderId._id.toString() === userId.toString()) {
            return res.json({ success: true, suggestions: [] });
        }

        const context = reversed
            .slice(0, -1)
            .map((m) => `${m.senderId.fullName}: ${m.text}`)
            .join("\n");

        const suggestions = await aiService.generateReplySuggestions(context, lastMessage.text);

        res.json({ success: true, suggestions: suggestions || [] });
    } catch (error) {
        logger.error("getSmartReplies error:", error.message);
        res.json({ success: true, suggestions: [] });
    }
};

export const translateMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { targetLang } = req.body;

        if (!targetLang) {
            return res.status(400).json({ success: false, message: "targetLang is required" });
        }

        const message = await Message.findById(messageId);
        if (!message || !message.text) {
            return res.status(404).json({ success: false, message: "Message not found or empty" });
        }

        const translatedText = await aiService.translateText(message.text, targetLang);
        if (translatedText) {
            await Message.findByIdAndUpdate(messageId, {
                aiTranslatedText: translatedText,
                aiTranslatedLang: targetLang,
            });
        }

        res.json({ success: true, translatedText: translatedText || message.text });
    } catch (error) {
        logger.error("translateMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const detectLanguage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: "Text is required" });
        }
        const language = await aiService.detectLanguage(text);
        res.json({ success: true, language });
    } catch (error) {
        logger.error("detectLanguage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const draftMessage = async (req, res) => {
    try {
        const { instructions } = req.body;
        if (!instructions) {
            return res.status(400).json({ success: false, message: "Instructions are required" });
        }
        const draft = await aiService.draftMessage(instructions);
        res.json({ success: true, draft: draft || "Could not generate draft." });
    } catch (error) {
        logger.error("draftMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkToxicity = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: "Text is required" });
        }
        const result = await aiService.detectToxicity(text);
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error("checkToxicity error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const searchWithAI = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user._id;
        if (!query) {
            return res.status(400).json({ success: false, message: "Query is required" });
        }

        const userWorkspaceIds = await Workspace.find({ "members.user": userId }).distinct("_id");
        const [userChannelIds, userGroupIds] = await Promise.all([
            Channel.find({ workspace: { $in: userWorkspaceIds } }).distinct("_id"),
            Group.find({ members: userId }).distinct("_id"),
        ]);

        const allMessages = await Message.find({
            deleted: false,
            text: { $exists: true, $ne: "" },
            $or: [
                { senderId: userId },
                { receiverId: userId },
                { channelId: { $in: userChannelIds } },
                { groupId: { $in: userGroupIds } },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(200)
            .populate("senderId", "fullName profilePic")
            .select("text senderId receiverId channelId groupId createdAt embedding")
            .lean();

        const messagesWithEmbeddings = allMessages.filter(m => m.embedding && m.embedding.length > 0);

        if (messagesWithEmbeddings.length > 10) {
            const relevantMessages = await aiService.ragSearch(query, messagesWithEmbeddings, 5);
            if (relevantMessages.length > 0) {
                const aiAnswer = await aiService.answerFromContext(query, relevantMessages);
                return res.json({
                    success: true,
                    type: "ai",
                    answer: aiAnswer,
                    sources: relevantMessages.map(m => ({
                        _id: m._id,
                        text: m.text,
                        senderId: m.senderId,
                        similarity: m.similarity,
                        createdAt: m.createdAt,
                    })),
                });
            }
        }

        const regexResults = allMessages
            .filter(m => m.text && m.text.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 20);

        res.json({
            success: true,
            type: "keyword",
            messages: regexResults,
            total: regexResults.length,
        });
    } catch (error) {
        logger.error("searchWithAI error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const autoComplete = async (req, res) => {
    try {
        const { partial } = req.body;
        if (!partial || partial.length < 3) {
            return res.json({ success: true, suggestions: [] });
        }
        const suggestions = await aiService.autoComplete(partial);
        res.json({ success: true, suggestions: suggestions || [] });
    } catch (error) {
        logger.error("autoComplete error:", error.message);
        res.json({ success: true, suggestions: [] });
    }
};

export const detectSentiment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: "Text is required" });
        }
        const result = await aiService.detectSentiment(text);
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error("detectSentiment error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateMeetingNotes = async (req, res) => {
    try {
        const { channelId, groupId, conversationId, messageIds } = req.body;
        const userId = req.user._id;

        let messages = [];
        let participants = [];

        if (messageIds && messageIds.length > 0) {
            messages = await Message.find({ _id: { $in: messageIds }, deleted: false })
                .sort({ createdAt: 1 })
                .populate("senderId", "fullName")
                .lean();
        } else if (channelId) {
            messages = await Message.find({ channelId, deleted: false })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate("senderId", "fullName")
                .lean();
            messages = messages.reverse();
            const channel = await Channel.findById(channelId).lean();
            if (channel) {
                const workspace = await Workspace.findById(channel.workspace).lean();
                if (workspace) participants = workspace.members.map(m => ({ _id: m.user }));
            }
        } else if (groupId) {
            messages = await Message.find({ groupId, deleted: false })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate("senderId", "fullName")
                .lean();
            messages = messages.reverse();
        } else if (conversationId) {
            messages = await Message.find({
                deleted: false,
                $or: [
                    { senderId: userId, receiverId: conversationId },
                    { senderId: conversationId, receiverId: userId },
                ],
            })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate("senderId", "fullName")
                .lean();
            messages = messages.reverse();
        }

        if (messages.length === 0) {
            return res.status(400).json({ success: false, message: "No messages found" });
        }

        const senderNames = [...new Set(messages.map(m => m.senderId?.fullName).filter(Boolean))];
        participants = senderNames.map(name => ({ fullName: name }));

        const formattedMessages = messages.map(m => ({
            senderName: m.senderId?.fullName || "User",
            text: m.text || "[media]",
        }));

        const notes = await aiService.generateMeetingNotes(formattedMessages, participants);

        res.json({
            success: true,
            notes,
            messageCount: messages.length,
            participants: participants.map(p => p.fullName),
        });
    } catch (error) {
        logger.error("generateMeetingNotes error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const coachMessage = async (req, res) => {
    try {
        const { text, tone } = req.body;
        if (!text || text.length < 5) {
            return res.status(400).json({ success: false, message: "Text too short for coaching" });
        }
        const result = await aiService.coachMessage(text, tone || "professional");
        res.json({ success: true, coaching: result });
    } catch (error) {
        logger.error("coachMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const quickBotChat = async (req, res) => {
    try {
        const { message, history, channelId, groupId, conversationId } = req.body;
        const userId = req.user._id;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        let workspaceContext = "";
        if (channelId) {
            const channel = await Channel.findById(channelId).lean();
            if (channel) {
                workspaceContext = `Channel: #${channel.name}. Topic: ${channel.topic || "No topic"}`;
                const recentMsgs = await Message.find({ channelId, deleted: false })
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .populate("senderId", "fullName")
                    .lean();
                workspaceContext += "\nRecent messages:\n" +
                    recentMsgs.reverse().map(m => `${m.senderId?.fullName}: ${m.text || "[media]"}`).join("\n");
            }
        } else if (groupId) {
            const group = await Group.findById(groupId).lean();
            if (group) workspaceContext = `Group: ${group.name}. ${group.description || ""}`;
        }

        const conversationHistory = (history || []).slice(-10);
        const response = await aiService.quickBotRespond(message, workspaceContext, conversationHistory);

        const { text, action } = aiService.extractAction(response);

        if (action) {
            if (action.action === "set_reminder") {
                const delayMs = parseDuration(action.delay || "1h");
                const remindAt = new Date(Date.now() + delayMs);
                const reminder = await Reminder.create({
                    userId,
                    message: action.message,
                    remindAt,
                    channelId,
                    groupId,
                    conversationId,
                });
                return res.json({
                    success: true,
                    response: text + `\n\nReminder set for ${remindAt.toLocaleString()}`,
                    action: { type: "reminder_created", reminderId: reminder._id, remindAt },
                });
            }

            if (action.action === "create_poll") {
                return res.json({
                    success: true,
                    response: text,
                    action: {
                        type: "create_poll",
                        question: action.question,
                        options: action.options,
                    },
                });
            }
        }

        res.json({ success: true, response: text || "I'm not sure how to respond to that." });
    } catch (error) {
        logger.error("quickBotChat error:", error.message);
        res.status(500).json({ success: false, message: "QuickBot is having trouble right now." });
    }
};

export const streamChat = async (req, res) => {
    try {
        const { message, history, systemPrompt } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: "Message required" });
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const messages = [
            { role: "system", content: systemPrompt || "You are a helpful AI assistant in a chat app. Be concise and helpful." },
            ...(history || []).slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
        ];

        const stream = await aiService.callLLMStream(
            systemPrompt || "You are a helpful AI assistant.",
            message
        );

        if (!stream) {
            res.write(`data: ${JSON.stringify({ error: "AI not available" })}\n\n`);
            res.write("data: [DONE]\n\n");
            return res.end();
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.startsWith("data: "));

            for (const line of lines) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                    res.write("data: [DONE]\n\n");
                    break;
                }
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                        res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                } catch {}
            }
        }

        res.end();
    } catch (error) {
        logger.error("streamChat error:", error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
};

export const getSentimentDashboard = async (req, res) => {
    try {
        const { workspaceId, channelId, days = 7 } = req.query;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const query = { createdAt: { $gte: since } };
        if (workspaceId) query.workspaceId = workspaceId;
        if (channelId) query.channelId = channelId;

        const aggregation = await SentimentLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    avgScore: { $avg: "$score" },
                    positive: { $sum: { $cond: [{ $eq: ["$label", "positive"] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ["$label", "neutral"] }, 1, 0] } },
                    negative: { $sum: { $cond: [{ $eq: ["$label", "negative"] }, 1, 0] } },
                    total: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const overall = await SentimentLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: "$score" },
                    totalMessages: { $sum: 1 },
                    positive: { $sum: { $cond: [{ $eq: ["$label", "positive"] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ["$label", "neutral"] }, 1, 0] } },
                    negative: { $sum: { $cond: [{ $eq: ["$label", "negative"] }, 1, 0] } },
                },
            },
        ]);

        res.json({
            success: true,
            daily: aggregation,
            overall: overall[0] || { avgScore: 0, totalMessages: 0, positive: 0, neutral: 0, negative: 0 },
        });
    } catch (error) {
        logger.error("getSentimentDashboard error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getConversationCanvas = async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const userId = req.user._id;

        let query = { deleted: false, text: { $exists: true, $ne: "" } };

        if (workspaceId) {
            const channels = await Channel.find({ workspace: workspaceId }).distinct("_id");
            query.channelId = { $in: channels };
        } else {
            const userWorkspaceIds = await Workspace.find({ "members.user": userId }).distinct("_id");
            const userChannelIds = await Channel.find({ workspace: { $in: userWorkspaceIds } }).distinct("_id");
            query.channelId = { $in: userChannelIds };
        }

        const recentMessages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(500)
            .populate("senderId", "fullName profilePic")
            .populate("channelId", "name")
            .select("text senderId channelId createdAt")
            .lean();

        const topicClusters = await aiService.generateTopicClusters(recentMessages);

        const channelNodes = {};
        for (const msg of recentMessages) {
            const cId = msg.channelId?._id?.toString();
            if (!cId) continue;
            if (!channelNodes[cId]) {
                channelNodes[cId] = {
                    id: cId,
                    label: msg.channelId.name,
                    type: "channel",
                    messageCount: 0,
                    activeUsers: new Set(),
                    lastActive: msg.createdAt,
                };
            }
            channelNodes[cId].messageCount++;
            channelNodes[cId].activeUsers.add(msg.senderId?._id?.toString());
        }

        const nodes = Object.values(channelNodes).map(n => ({
            ...n,
            activeUsers: n.activeUsers.size,
            size: Math.min(Math.max(n.messageCount / 5, 3), 15),
        }));

        const edges = [];
        const channelPairs = {};
        for (let i = 0; i < recentMessages.length - 1; i++) {
            const a = recentMessages[i].channelId?._id?.toString();
            const b = recentMessages[i + 1].channelId?._id?.toString();
            if (a && b && a !== b) {
                const key = [a, b].sort().join("-");
                channelPairs[key] = (channelPairs[key] || 0) + 1;
            }
        }
        for (const [key, weight] of Object.entries(channelPairs)) {
            const [a, b] = key.split("-");
            edges.push({ source: a, target: b, weight });
        }

        res.json({
            success: true,
            canvas: {
                nodes: nodes.slice(0, 30),
                edges: edges.slice(0, 50),
                topics: topicClusters,
                messageCount: recentMessages.length,
            },
        });
    } catch (error) {
        logger.error("getConversationCanvas error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

function parseDuration(str) {
    const match = str.match(/^(\d+)(s|m|h|d|w)$/i);
    if (!match) return 3600000;
    const val = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case "s": return val * 1000;
        case "m": return val * 60000;
        case "h": return val * 3600000;
        case "d": return val * 86400000;
        case "w": return val * 604800000;
        default: return 3600000;
    }
}
