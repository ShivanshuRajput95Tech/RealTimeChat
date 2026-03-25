import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { messageLimiter } from "../middleware/rateLimiter.js";
import {
    createPoll,
    votePoll,
    closePoll,
    getPoll,
    getReminders,
    cancelReminder,
} from "../controllers/pollController.js";

const pollRouter = express.Router();

pollRouter.post("/", protectRoute, messageLimiter, createPoll);
pollRouter.get("/:pollId", protectRoute, getPoll);
pollRouter.post("/:pollId/vote", protectRoute, votePoll);
pollRouter.post("/:pollId/close", protectRoute, closePoll);
pollRouter.get("/reminders/list", protectRoute, getReminders);
pollRouter.delete("/reminders/:reminderId", protectRoute, cancelReminder);

export default pollRouter;
