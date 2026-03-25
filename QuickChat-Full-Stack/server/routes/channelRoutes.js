import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { requireWorkspaceMember, requireMinRole } from "../middleware/rbac.js";
import {
    createChannel,
    getChannels,
    getChannel,
    updateChannel,
    deleteChannel,
    getChannelMessages,
    sendChannelMessage,
    pinMessage,
    archiveChannel,
} from "../controllers/channelController.js";

const channelRouter = express.Router();

channelRouter.post("/:workspaceId", protectRoute, requireMinRole("moderator"), createChannel);
channelRouter.get("/:workspaceId", protectRoute, requireWorkspaceMember, getChannels);
channelRouter.get("/single/:channelId", protectRoute, getChannel);
channelRouter.put("/:channelId", protectRoute, requireMinRole("moderator"), updateChannel);
channelRouter.delete("/:channelId", protectRoute, requireMinRole("admin"), deleteChannel);
channelRouter.get("/:channelId/messages", protectRoute, requireWorkspaceMember, getChannelMessages);
channelRouter.post("/:channelId/messages", protectRoute, requireWorkspaceMember, sendChannelMessage);
channelRouter.put("/:channelId/pin/:messageId", protectRoute, requireMinRole("moderator"), pinMessage);
channelRouter.put("/:channelId/archive", protectRoute, requireMinRole("admin"), archiveChannel);

export default channelRouter;
