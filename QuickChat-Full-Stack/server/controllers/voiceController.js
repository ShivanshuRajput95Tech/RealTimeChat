import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { getIO, userSocketMap } from "../socket.js";
import logger from "../lib/logger.js";

export const sendVoiceMessage = async (req, res) => {
    try {
        const { audio, receiverId, channelId, groupId, duration } = req.body;
        const senderId = req.user._id;

        if (!audio) {
            return res.status(400).json({ success: false, message: "Audio data is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(audio, {
            folder: "messages/voice",
            resource_type: "video",
            format: "webm",
        });

        const messageData = {
            senderId,
            text: "",
            type: "file",
            file: {
                url: uploadResponse.secure_url,
                name: `voice-${Date.now()}.webm`,
                size: uploadResponse.bytes,
                type: "audio/webm",
                duration: duration || 0,
                isVoice: true,
            },
        };

        if (receiverId) messageData.receiverId = receiverId;
        if (channelId) messageData.channelId = channelId;
        if (groupId) messageData.groupId = groupId;

        const newMessage = await Message.create(messageData);

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic")
            .lean();

        if (receiverId) {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                try { getIO().to(receiverSocketId).emit("newMessage", populatedMessage); } catch {}
            }
        } else if (channelId) {
            try { getIO().to(`channel:${channelId}`).emit("newMessage", populatedMessage); } catch {}
        } else if (groupId) {
            try { getIO().to(`group:${groupId}`).emit("newMessage", populatedMessage); } catch {}
        }

        res.status(201).json({ success: true, newMessage: populatedMessage });
    } catch (error) {
        logger.error("sendVoiceMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const transcribeVoice = async (req, res) => {
    try {
        const { audioUrl } = req.body;
        if (!audioUrl) {
            return res.status(400).json({ success: false, message: "Audio URL is required" });
        }

        const AI_API_KEY = process.env.OPENAI_API_KEY;
        const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.openai.com/v1";

        if (!AI_API_KEY) {
            return res.status(503).json({ success: false, message: "AI not configured" });
        }

        const audioResponse = await fetch(audioUrl);
        const audioBuffer = await audioResponse.arrayBuffer();

        const formData = new FormData();
        formData.append("file", new Blob([audioBuffer], { type: "audio/webm" }), "voice.webm");
        formData.append("model", "whisper-1");

        const transcribeResponse = await fetch(`${AI_BASE_URL}/audio/transcriptions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${AI_API_KEY}`,
            },
            body: formData,
        });

        const data = await transcribeResponse.json();

        if (!transcribeResponse.ok) {
            throw new Error(data.error?.message || "Transcription failed");
        }

        res.json({ success: true, transcription: data.text });
    } catch (error) {
        logger.error("transcribeVoice error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
