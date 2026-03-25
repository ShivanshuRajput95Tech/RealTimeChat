import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import User from "../models/User.js";
import { generateInviteCode } from "../lib/invite.js";
import { getIO, userSocketMap } from "../socket.js";
import logger from "../lib/logger.js";

export const createWorkspace = async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Workspace name required" });

        const workspace = await Workspace.create({
            name,
            description: description || "",
            icon: icon || "",
            owner: req.user._id,
            members: [{ user: req.user._id, role: "owner" }],
            inviteCode: generateInviteCode(),
        });

        const generalChannel = await Channel.create({
            name: "general",
            type: "text",
            workspace: workspace._id,
            category: "Text Channels",
        });

        await User.findByIdAndUpdate(req.user._id, {
            $push: { workspaces: workspace._id },
        });

        res.status(201).json({ success: true, workspace, channels: [generalChannel] });
    } catch (error) {
        logger.error("createWorkspace error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({ "members.user": req.user._id })
            .populate("owner", "fullName profilePic")
            .populate("members.user", "fullName profilePic status")
            .lean();

        const workspaceIds = workspaces.map(ws => ws._id);
        const allChannels = await Channel.find({ workspace: { $in: workspaceIds }, archived: false })
            .sort({ position: 1 })
            .lean();

        const channelsByWorkspace = {};
        for (const ws of workspaces) {
            channelsByWorkspace[ws._id] = allChannels.filter(
                ch => ch.workspace.toString() === ws._id.toString()
            );
        }

        res.json({ success: true, workspaces, channelsByWorkspace });
    } catch (error) {
        logger.error("getWorkspaces error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId)
            .populate("owner", "fullName profilePic")
            .populate("members.user", "fullName profilePic status bio");

        if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

        const channels = await Channel.find({ workspace: workspaceId, archived: false }).sort({ position: 1 });

        res.json({ success: true, workspace, channels });
    } catch (error) {
        logger.error("getWorkspace error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, icon, settings } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (icon) updateData.icon = icon;
        if (settings) {
            Object.keys(settings).forEach(key => {
                updateData[`settings.${key}`] = settings[key];
            });
        }

        const workspace = await Workspace.findByIdAndUpdate(workspaceId, updateData, { new: true })
            .populate("members.user", "fullName profilePic status");

        res.json({ success: true, workspace });
    } catch (error) {
        logger.error("updateWorkspace error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the owner can delete a workspace" });
        }

        await Channel.deleteMany({ workspace: workspaceId });
        await User.updateMany(
            { workspaces: workspaceId },
            { $pull: { workspaces: workspaceId } }
        );
        await Workspace.findByIdAndDelete(workspaceId);

        res.json({ success: true, message: "Workspace deleted" });
    } catch (error) {
        logger.error("deleteWorkspace error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const regenerateInviteCode = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findByIdAndUpdate(
            workspaceId,
            { inviteCode: generateInviteCode() },
            { new: true }
        );
        res.json({ success: true, inviteCode: workspace.inviteCode });
    } catch (error) {
        logger.error("regenerateInviteCode error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const joinWorkspace = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) return res.status(400).json({ success: false, message: "Invite code required" });

        const workspace = await Workspace.findOne({ inviteCode, inviteEnabled: true });
        if (!workspace) return res.status(404).json({ success: false, message: "Invalid or expired invite" });

        const isMember = workspace.members.some(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (isMember) return res.status(409).json({ success: false, message: "Already a member" });

        workspace.members.push({ user: req.user._id, role: "member" });
        await workspace.save();

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { workspaces: workspace._id },
        });

        const populatedWorkspace = await Workspace.findById(workspace._id)
            .populate("members.user", "fullName profilePic status");

        try {
            const ioInstance = getIO();
            workspace.members.forEach((member) => {
                const socketId = userSocketMap[member.user.toString()];
                if (socketId) {
                    ioInstance.to(socketId).emit("workspace:memberJoined", {
                        workspaceId: workspace._id,
                        user: { _id: req.user._id, fullName: req.user.fullName, profilePic: req.user.profilePic },
                    });
                }
            });
        } catch (err) {
            logger.warn("Socket.IO not available for workspace notification");
        }

        res.json({ success: true, workspace: populatedWorkspace });
    } catch (error) {
        logger.error("joinWorkspace error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const leaveWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);

        if (workspace.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "Owner cannot leave. Transfer ownership or delete workspace." });
        }

        workspace.members = workspace.members.filter(
            (m) => m.user.toString() !== req.user._id.toString()
        );
        await workspace.save();

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { workspaces: workspaceId },
        });

        res.json({ success: true, message: "Left workspace" });
    } catch (error) {
        logger.error("leaveWorkspace error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        const { role } = req.body;

        if (!["admin", "moderator", "member"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const workspace = await Workspace.findById(workspaceId);
        const memberIndex = workspace.members.findIndex(
            (m) => m.user.toString() === userId
        );

        if (memberIndex === -1) {
            return res.status(404).json({ success: false, message: "User is not a member" });
        }

        if (workspace.owner.toString() === userId) {
            return res.status(400).json({ success: false, message: "Cannot change owner role" });
        }

        workspace.members[memberIndex].role = role;
        await workspace.save();

        res.json({ success: true, message: "Role updated" });
    } catch (error) {
        logger.error("updateMemberRole error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        const workspace = await Workspace.findById(workspaceId);

        if (workspace.owner.toString() === userId) {
            return res.status(400).json({ success: false, message: "Cannot remove the owner" });
        }

        workspace.members = workspace.members.filter(
            (m) => m.user.toString() !== userId
        );
        await workspace.save();

        await User.findByIdAndUpdate(userId, {
            $pull: { workspaces: workspaceId },
        });

        res.json({ success: true, message: "Member removed" });
    } catch (error) {
        logger.error("removeMember error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
