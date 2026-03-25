import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import {
    getSmartReplies,
    translateMessage,
    detectLanguage,
    draftMessage,
    checkToxicity,
    searchWithAI,
    autoComplete,
    detectSentiment,
    generateMeetingNotes,
    coachMessage,
    quickBotChat,
    streamChat,
    getSentimentDashboard,
    getConversationCanvas,
} from "../controllers/aiController.js";
import aiService from "../services/aiService.js";

const aiRouter = express.Router();

aiRouter.get("/smart-replies", protectRoute, getSmartReplies);
aiRouter.get("/search", protectRoute, searchWithAI);
aiRouter.post("/translate/:messageId", protectRoute, translateMessage);
aiRouter.post("/translate", protectRoute, async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        if (!text) return res.json({ success: false, message: "Text required" });
        const translated = await aiService.translateText(text, targetLanguage || "English");
        res.json({ success: true, translatedText: translated || text });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});
aiRouter.post("/detect-language", protectRoute, detectLanguage);
aiRouter.post("/draft", protectRoute, aiLimiter, draftMessage);
aiRouter.post("/moderate", protectRoute, checkToxicity);
aiRouter.post("/autocomplete", protectRoute, autoComplete);

aiRouter.post("/smart-reply", protectRoute, async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || messages.length === 0) {
            return res.json({ success: true, suggestions: ["Got it!", "Thanks!", "Sounds good!"] });
        }
        const lastMessages = messages.slice(-5);
        const lastMessage = lastMessages[lastMessages.length - 1];
        const context = lastMessages.slice(0, -1)
            .map(m => `${m.senderName || "User"}: ${m.text || ""}`)
            .join("\n");
        const suggestions = await aiService.generateReplySuggestions(context, lastMessage.text || "[no text]");
        res.json({
            success: true,
            suggestions: suggestions.length > 0 ? suggestions : ["Got it!", "Sounds good!", "Let me check"],
        });
    } catch (error) {
        res.json({ success: true, suggestions: ["Got it!", "Sounds good!", "Let me check"] });
    }
});

aiRouter.post("/summarize", protectRoute, async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || messages.length === 0) {
            return res.json({ success: true, summary: "No messages to summarize." });
        }
        const formatted = messages.map(m => ({
            senderName: m.senderName || "User",
            text: m.text || "[image]",
        }));
        const summary = await aiService.summarizeConversation(formatted);
        res.json({ success: true, summary: summary || "Could not generate summary." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

aiRouter.post("/chat", protectRoute, aiLimiter, async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.json({ success: false, message: "Message required" });
        const contextStr = (history || [])
            .slice(-10)
            .map(m => `${m.role}: ${m.content}`)
            .join("\n");
        const prompt = `You are an AI assistant in a chat app. Be concise and helpful.\n${contextStr ? `Context:\n${contextStr}\n` : ""}User: ${message}\nAssistant:`;
        const response = await aiService.callLLM("You are a helpful AI assistant.", prompt, {
            maxTokens: 300,
            temperature: 0.7,
        });
        res.json({ success: true, response: response || "I'm not sure how to respond to that." });
    } catch (error) {
        res.json({ success: true, response: "I'm having trouble right now. Try again later." });
    }
});

aiRouter.post("/sentiment", protectRoute, detectSentiment);
aiRouter.get("/sentiment-dashboard", protectRoute, getSentimentDashboard);
aiRouter.post("/meeting-notes", protectRoute, aiLimiter, generateMeetingNotes);
aiRouter.post("/coach", protectRoute, aiLimiter, coachMessage);
aiRouter.post("/quickbot", protectRoute, aiLimiter, quickBotChat);
aiRouter.post("/stream", protectRoute, aiLimiter, streamChat);
aiRouter.get("/canvas", protectRoute, getConversationCanvas);

export default aiRouter;
