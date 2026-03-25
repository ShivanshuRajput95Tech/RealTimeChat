import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { messageLimiter } from "../middleware/rateLimiter.js";
import {
    sendMessageValidation,
    updateMessageValidation,
    reactionValidation,
    searchQueryValidation,
    scheduleMessageValidation,
} from "../middleware/validation.js";
import {
    getMessages,
    getUsersForSidebar,
    markMessageAsSeen,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    getThreadMessages,
    sendThreadReply,
    togglePinMessage,
    searchMessages,
    getScheduledMessages,
    scheduleMessage,
    cancelScheduledMessage,
    getPinnedMessages,
    markMessagesAsRead,
    getMessageById,
    forwardMessage,
    bookmarkMessage,
    getBookmarks,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/search", protectRoute, searchQueryValidation, searchMessages);
messageRouter.get("/scheduled", protectRoute, getScheduledMessages);
messageRouter.get("/pinned", protectRoute, getPinnedMessages);
messageRouter.get("/bookmarks/list", protectRoute, getBookmarks);
messageRouter.get("/single/:messageId", protectRoute, getMessageById);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.put("/mark-all/:conversationId", protectRoute, markMessagesAsRead);
messageRouter.post("/send/:id", protectRoute, messageLimiter, sendMessageValidation, sendMessage);
messageRouter.post("/schedule", protectRoute, messageLimiter, scheduleMessageValidation, scheduleMessage);
messageRouter.delete("/schedule/:messageId", protectRoute, cancelScheduledMessage);
messageRouter.put("/:messageId", protectRoute, updateMessageValidation, editMessage);
messageRouter.put("/:messageId/pin", protectRoute, togglePinMessage);
messageRouter.delete("/:messageId", protectRoute, deleteMessage);
messageRouter.post("/:messageId/reactions", protectRoute, reactionValidation, toggleReaction);
messageRouter.get("/:messageId/thread", protectRoute, getThreadMessages);
messageRouter.post("/:messageId/thread", protectRoute, messageLimiter, sendThreadReply);
messageRouter.post("/:messageId/forward", protectRoute, forwardMessage);
messageRouter.post("/:messageId/bookmark", protectRoute, bookmarkMessage);

export default messageRouter;
