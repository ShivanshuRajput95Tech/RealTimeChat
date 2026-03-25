import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { sendBroadcast, getBroadcasts } from "../controllers/broadcastController.js";
import { broadcastValidation } from "../middleware/validation.js";

const broadcastRouter = express.Router();

broadcastRouter.post("/send", protectRoute, broadcastValidation, sendBroadcast);
broadcastRouter.get("/", protectRoute, getBroadcasts);

export default broadcastRouter;
