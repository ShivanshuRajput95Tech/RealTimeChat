import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";

const ROLE_HIERARCHY = { owner: 4, admin: 3, moderator: 2, member: 1 };

const resolveWorkspaceId = async (req) => {
    if (req.params.workspaceId) return req.params.workspaceId;
    if (req.body.workspaceId) return req.body.workspaceId;
    const channelId = req.params.channelId;
    if (channelId) {
        const channel = await Channel.findById(channelId).select("workspace").lean();
        if (channel) return channel.workspace.toString();
    }
    return null;
};

export const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const workspaceId = await resolveWorkspaceId(req);
            if (!workspaceId) {
                return res.status(400).json({ success: false, message: "Workspace ID required" });
            }

            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return res.status(404).json({ success: false, message: "Workspace not found" });
            }

            const member = workspace.members.find(
                (m) => m.user.toString() === req.user._id.toString()
            );

            if (!member) {
                return res.status(403).json({ success: false, message: "Not a member of this workspace" });
            }

            if (!allowedRoles.includes(member.role)) {
                return res.status(403).json({ success: false, message: "Insufficient permissions" });
            }

            req.workspace = workspace;
            req.memberRole = member.role;
            next();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
};

export const requireMinRole = (minRole) => {
    return async (req, res, next) => {
        try {
            const workspaceId = await resolveWorkspaceId(req);
            if (!workspaceId) {
                return res.status(400).json({ success: false, message: "Workspace ID required" });
            }

            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return res.status(404).json({ success: false, message: "Workspace not found" });
            }

            const member = workspace.members.find(
                (m) => m.user.toString() === req.user._id.toString()
            );

            if (!member) {
                return res.status(403).json({ success: false, message: "Not a member of this workspace" });
            }

            if (ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[minRole]) {
                return res.status(403).json({ success: false, message: "Insufficient permissions" });
            }

            req.workspace = workspace;
            req.memberRole = member.role;
            next();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
};

export const requireWorkspaceMember = async (req, res, next) => {
    try {
        const workspaceId = await resolveWorkspaceId(req);
        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Workspace ID required" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const isMember = workspace.members.some(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this workspace" });
        }

        req.workspace = workspace;
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
