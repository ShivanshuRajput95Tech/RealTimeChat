import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { sendVoiceMessage, transcribeVoice } from "../controllers/voiceController.js";
import { messageLimiter } from "../middleware/rateLimiter.js";

const voiceRouter = express.Router();

voiceRouter.post("/send", protectRoute, messageLimiter, sendVoiceMessage);
voiceRouter.post("/transcribe", protectRoute, transcribeVoice);

export default voiceRouter;
