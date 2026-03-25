import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protectRoute, getNotifications);
notificationRouter.get("/unread-count", protectRoute, getUnreadCount);
notificationRouter.put("/read-all", protectRoute, markAllAsRead);
notificationRouter.put("/:notificationId/read", protectRoute, markAsRead);
notificationRouter.delete("/:notificationId", protectRoute, deleteNotification);
notificationRouter.delete("/", protectRoute, clearAllNotifications);

export default notificationRouter;
