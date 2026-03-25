import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { safeEmitToUser } from "../socket.js";
import logger from "../lib/logger.js";
import { generateInviteCode } from "../lib/invite.js";
import { trackUserActivity } from "../lib/activityTracker.js";

export const createGroup = async (req, res) => {
    try {
        const { name, description, members } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Group name required" });

        const memberIds = [...new Set([req.user._id.toString(), ...(members || [])])];

        const group = await Group.create({
            name,
            description: description || "",
            members: memberIds,
            admins: [req.user._id],
            createdBy: req.user._id,
            inviteCode: generateInviteCode(),
        });

        await User.updateMany(
            { _id: { $in: memberIds } },
            { $addToSet: { groups: group._id } }
        );

        const populatedGroup = await Group.findById(group._id)
            .populate("members", "fullName profilePic status")
            .populate("admins", "fullName profilePic");

        memberIds.forEach((userId) => {
                if (userId !== req.user._id.toString()) {
                    safeEmitToUser(userId, "group:created", { group: populatedGroup });
                }
            });

        res.status(201).json({ success: true, group: populatedGroup });
    } catch (error) {
        logger.error("createGroup error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id })
            .populate("members", "fullName profilePic status")
            .populate("admins", "fullName profilePic")
            .sort({ lastMessageAt: -1 });

        res.json({ success: true, groups });
    } catch (error) {
        logger.error("getGroups error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId)
            .populate("members", "fullName profilePic status bio")
            .populate("admins", "fullName profilePic");

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        res.json({ success: true, group });
    } catch (error) {
        logger.error("getGroup error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, avatar, settings } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        const isAdmin = group.admins.some(a => a.toString() === req.user._id.toString());
        const isCreator = group.createdBy.toString() === req.user._id.toString();

        if (group.settings.onlyAdminsCanEditInfo && !isAdmin && !isCreator) {
            return res.status(403).json({ success: false, message: "Only admins can edit group info" });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (settings) updateData.settings = settings;

        if (avatar) {
            const upload = await cloudinary.uploader.upload(avatar);
            updateData.avatar = upload.secure_url;
        }

        const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, { new: true })
            .populate("members", "fullName profilePic status")
            .populate("admins", "fullName profilePic");

        updatedGroup.members.forEach((member) => {
                safeEmitToUser(member._id.toString(), "group:updated", { groupId, group: updatedGroup });
            });

        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        logger.error("updateGroup error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        if (group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the creator can delete the group" });
        }

        await Message.deleteMany({ groupId });
        await User.updateMany(
            { groups: groupId },
            { $pull: { groups: groupId } }
        );
        await Group.findByIdAndDelete(groupId);

        res.json({ success: true, message: "Group deleted" });
    } catch (error) {
        logger.error("deleteGroup error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { members } = req.body;

        const group = await Group.findById(groupId);
        const newMembers = members.filter(
            (id) => !group.members.map((m) => m.toString()).includes(id)
        );

        if (newMembers.length === 0) {
            return res.status(409).json({ success: false, message: "All users are already members" });
        }

        group.members.push(...newMembers);
        await group.save();

        await User.updateMany(
            { _id: { $in: newMembers } },
            { $addToSet: { groups: groupId } }
        );

        const populatedGroup = await Group.findById(groupId)
            .populate("members", "fullName profilePic status")
            .populate("admins", "fullName profilePic");

        newMembers.forEach((userId) => {
                safeEmitToUser(userId, "group:added", { groupId, group: populatedGroup });
            });

        res.json({ success: true, group: populatedGroup });
    } catch (error) {
        logger.error("addMembers error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const group = await Group.findById(groupId);

        if (group.createdBy.toString() === userId) {
            return res.status(400).json({ success: false, message: "Cannot remove the group creator" });
        }

        group.members = group.members.filter((m) => m.toString() !== userId);
        group.admins = group.admins.filter((a) => a.toString() !== userId);
        await group.save();

        await User.findByIdAndUpdate(userId, { $pull: { groups: groupId } });

        safeEmitToUser(userId, "group:removed", { groupId });

        res.json({ success: true, message: "Member removed" });
    } catch (error) {
        logger.error("removeMember error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        if (group.createdBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "Creator cannot leave. Delete the group instead." });
        }

        group.members = group.members.filter((m) => m.toString() !== req.user._id.toString());
        group.admins = group.admins.filter((a) => a.toString() !== req.user._id.toString());
        await group.save();

        await User.findByIdAndUpdate(req.user._id, { $pull: { groups: groupId } });

        group.members.forEach((memberId) => {
                safeEmitToUser(memberId.toString(), "group:removed", {
                    groupId,
                    userId: req.user._id,
                    fullName: req.user.fullName,
                    type: "left",
                });
            });

        res.json({ success: true, message: "Left group" });
    } catch (error) {
        logger.error("leaveGroup error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { limit = 50, before } = req.query;

        const query = { groupId, deleted: false };
        if (before) query.createdAt = { $lt: new Date(before) };

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("senderId", "fullName profilePic")
            .populate("replyTo", "text senderId")
            .lean();

        res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
        logger.error("getGroupMessages error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image, replyTo, type } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        if (group.settings.onlyAdminsCanPost && !group.admins.includes(req.user._id)) {
            return res.status(403).json({ success: false, message: "Only admins can post in this group" });
        }

        const messageData = {
            senderId: req.user._id,
            groupId,
            text: text || "",
            type: type || "text",
        };

        if (image && image.startsWith("data:")) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "groups",
                resource_type: "image",
            });
            messageData.image = uploadResponse.secure_url;
            messageData.type = "image";
        } else if (image) {
            messageData.image = image;
        }
        if (replyTo) {
            messageData.replyTo = replyTo;
            await Message.findByIdAndUpdate(replyTo, { $inc: { threadCount: 1 } });
        }

        const newMessage = await Message.create(messageData);
        await Group.findByIdAndUpdate(groupId, { lastMessageAt: new Date() });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic")
            .populate("replyTo", "text senderId");

        group.members.forEach((memberId) => {
                safeEmitToUser(memberId.toString(), "group:newMessage", {
                    groupId,
                    message: populatedMessage,
                });
            });

        trackUserActivity(req.user._id, { groupId });

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        logger.error("sendGroupMessage error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ success: false, message: "Invite code required" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        if (!group.settings.inviteEnabled || group.inviteCode !== inviteCode) {
            return res.status(404).json({ success: false, message: "Invalid or expired invite code" });
        }

        const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
        if (isMember) {
            return res.status(409).json({ success: false, message: "Already a member" });
        }

        group.members.push(req.user._id);
        await group.save();

        await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: groupId } });

        const populatedGroup = await Group.findById(groupId)
            .populate("members", "fullName profilePic status")
            .populate("admins", "fullName profilePic");

        group.members.forEach((memberId) => {
            if (memberId.toString() !== req.user._id.toString()) {
                safeEmitToUser(memberId.toString(), "group:memberJoined", {
                    groupId,
                    user: { _id: req.user._id, fullName: req.user.fullName, profilePic: req.user.profilePic },
                });
            }
        });

        res.json({ success: true, group: populatedGroup });
    } catch (error) {
        logger.error("joinGroup error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const regenerateGroupInviteCode = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
        const isCreator = group.createdBy.toString() === req.user._id.toString();

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ success: false, message: "Only admins can regenerate invite code" });
        }

        group.inviteCode = generateInviteCode();
        await group.save();

        res.json({ success: true, inviteCode: group.inviteCode });
    } catch (error) {
        logger.error("regenerateGroupInviteCode error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleGroupInvite = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
        const isCreator = group.createdBy.toString() === req.user._id.toString();

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ success: false, message: "Only admins can toggle invite" });
        }

        group.settings.inviteEnabled = !group.settings.inviteEnabled;
        await group.save();

        res.json({ success: true, inviteEnabled: group.settings.inviteEnabled });
    } catch (error) {
        logger.error("toggleGroupInvite error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroupInviteInfo = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ success: false, message: "Not a member of this group" });
        }

        const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
        const isCreator = group.createdBy.toString() === req.user._id.toString();
        const canManageInvite = isAdmin || isCreator;

        res.json({
            success: true,
            inviteInfo: {
                inviteCode: canManageInvite ? group.inviteCode : undefined,
                inviteEnabled: group.settings.inviteEnabled,
                canManageInvite,
            },
        });
    } catch (error) {
        logger.error("getGroupInviteInfo error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
