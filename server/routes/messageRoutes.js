import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    getMessages,
    getUsersForSidebar,
    markMessageAsSeen,
    sendMessage
} from "../controllers/messageController.js";

const router = express.Router();

// Get users for sidebar
router.get("/users", protectRoute, getUsersForSidebar);

// Mark message as seen
router.put("/mark/:id", protectRoute, markMessageAsSeen);

// Get messages with a user
router.get("/:id", protectRoute, getMessages);

// Send message
router.post("/send/:id", protectRoute, sendMessage);

export default router;