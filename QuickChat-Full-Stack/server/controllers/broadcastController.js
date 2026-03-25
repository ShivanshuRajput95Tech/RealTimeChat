import Message from "../models/Message.js";
import Workspace from "../models/Workspace.js";
import { safeEmitToUser } from "../socket.js";
import logger from "../lib/logger.js";

export const sendBroadcast = async (req, res) => {
    try {
        const { text, workspaceId } = req.body;
        const senderId = req.user._id;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const memberEntry = workspace.members.find(
            (m) => m.user.toString() === senderId.toString()
        );
        const isOwner = workspace.owner.toString() === senderId.toString();
        const isAdmin = memberEntry && (memberEntry.role === "admin" || memberEntry.role === "owner");

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Only admins can send broadcasts" });
        }

        const broadcast = await Message.create({
            senderId,
            text,
            type: "broadcast",
            metadata: { workspaceId },
        });

        const populatedBroadcast = await Message.findById(broadcast._id)
            .populate("senderId", "fullName profilePic")
            .lean();

        workspace.members.forEach((member) => {
            safeEmitToUser(member.user.toString(), "newBroadcast", populatedBroadcast);
        });

        res.json({ success: true, broadcast: populatedBroadcast });
    } catch (error) {
        logger.error("sendBroadcast error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBroadcasts = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        const query = { type: "broadcast", deleted: false };
        if (workspaceId) {
            query["metadata.workspaceId"] = workspaceId;
        }

        const broadcasts = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("senderId", "fullName profilePic")
            .lean();

        res.json({ success: true, broadcasts });
    } catch (error) {
        logger.error("getBroadcasts error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
