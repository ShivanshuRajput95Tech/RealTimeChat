import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    getMessages,
    getUsersForSidebar,
    markMessageAsSeen,
    sendMessage
} from "../controllers/messageController.js";

const router = express.Router();

/*
   GET users for sidebar
   /api/message/users
*/
router.get("/users", protectRoute, getUsersForSidebar);

/*
   Mark message as seen
   /api/message/mark/:id
*/
router.put("/mark/:id", protectRoute, markMessageAsSeen);

/*
   Get chat messages with a user
   /api/message/:id
*/
router.get("/:id", protectRoute, getMessages);

/*
   Send message to user
   /api/message/:id
*/
router.post("/:id", protectRoute, sendMessage);

export default router;