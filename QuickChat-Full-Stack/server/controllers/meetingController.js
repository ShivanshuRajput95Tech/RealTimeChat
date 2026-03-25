import Meeting from "../models/Meeting.js";
import Workspace from "../models/Workspace.js";
import { getIO, userSocketMap, safeEmitToUser, safeEmitToRoom } from "../socket.js";
import logger from "../lib/logger.js";
import crypto from "crypto";

const generateMeetingCode = () => {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `${code.slice(0,4)}-${code.slice(4)}`;
};

export const createMeeting = async (req, res) => {
    try {
        const { title, description, workspaceId, channelId, type, scheduledAt, participants, settings, isRecurring, recurringPattern } = req.body;
        const hostId = req.user._id;

        if (!title || !workspaceId) {
            return res.status(400).json({ success: false, message: "Title and workspace are required" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const isMember = workspace.members.some(m => m.user.toString() === hostId.toString());
        if (!isMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this workspace" });
        }

        const participantList = (participants || []).map(p => ({
            user: typeof p === "string" ? p : p.user || p,
            status: "invited",
        }));

        const meeting = await Meeting.create({
            title,
            description: description || "",
            workspace: workspaceId,
            channel: channelId,
            host: hostId,
            participants: participantList,
            type: type || "instant",
            status: type === "scheduled" ? "waiting" : "waiting",
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            isRecurring: isRecurring || false,
            recurringPattern: recurringPattern || null,
            settings: {
                allowScreenShare: settings?.allowScreenShare ?? true,
                allowRecording: settings?.allowRecording ?? false,
                muteOnJoin: settings?.muteOnJoin ?? true,
                waitingRoom: settings?.waitingRoom ?? false,
                maxParticipants: settings?.maxParticipants ?? 50,
            },
            meetingCode: generateMeetingCode(),
        });

        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate("host", "fullName profilePic")
            .populate("participants.user", "fullName profilePic")
            .lean();

        if (channelId) {
            safeEmitToRoom(`channel:${channelId}`, "meeting:created", {
                meeting: populatedMeeting,
                createdBy: { _id: req.user._id, fullName: req.user.fullName },
            });
        }

        for (const p of participantList) {
            const socketId = userSocketMap[p.user.toString()];
            if (socketId) {
                safeEmitToUser(p.user.toString(), "meeting:invite", {
                    meeting: populatedMeeting,
                    invitedBy: { _id: req.user._id, fullName: req.user.fullName },
                });
            }
        }

        res.status(201).json({ success: true, meeting: populatedMeeting });
    } catch (error) {
        logger.error("createMeeting error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWorkspaceMeetings = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { status, upcoming } = req.query;

        const query = { workspace: workspaceId };
        if (status) query.status = status;
        if (upcoming === "true") {
            query.scheduledAt = { $gte: new Date() };
            query.status = { $ne: "ended" };
        }

        const meetings = await Meeting.find(query)
            .sort({ scheduledAt: upcoming === "true" ? 1 : -1 })
            .limit(50)
            .populate("host", "fullName profilePic")
            .populate("participants.user", "fullName profilePic")
            .lean();

        res.json({ success: true, meetings });
    } catch (error) {
        logger.error("getWorkspaceMeetings error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;

        const meeting = await Meeting.findById(meetingId)
            .populate("host", "fullName profilePic")
            .populate("participants.user", "fullName profilePic status")
            .lean();

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        res.json({ success: true, meeting });
    } catch (error) {
        logger.error("getMeeting error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const joinMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user._id;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.status === "ended") {
            return res.status(400).json({ success: false, message: "Meeting has ended" });
        }

        const participantIndex = meeting.participants.findIndex(
            p => p.user.toString() === userId.toString()
        );

        if (participantIndex > -1) {
            meeting.participants[participantIndex].status = "joined";
            meeting.participants[participantIndex].joinedAt = new Date();
        } else {
            meeting.participants.push({ user: userId, status: "joined", joinedAt: new Date() });
        }

        if (meeting.status === "waiting") {
            meeting.status = "active";
            meeting.startedAt = new Date();
        }

        await meeting.save();

        const populatedMeeting = await Meeting.findById(meetingId)
            .populate("host", "fullName profilePic")
            .populate("participants.user", "fullName profilePic")
            .lean();

        safeEmitToRoom(`meeting:${meetingId}`, "meeting:userJoined", {
            meetingId,
            user: { _id: req.user._id, fullName: req.user.fullName, profilePic: req.user.profilePic },
            meeting: populatedMeeting,
        });

        res.json({ success: true, meeting: populatedMeeting });
    } catch (error) {
        logger.error("joinMeeting error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const leaveMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user._id;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        const participantIndex = meeting.participants.findIndex(
            p => p.user.toString() === userId.toString()
        );

        if (participantIndex > -1) {
            meeting.participants[participantIndex].status = "left";
            meeting.participants[participantIndex].leftAt = new Date();
        }

        await meeting.save();

        safeEmitToRoom(`meeting:${meetingId}`, "meeting:userLeft", {
            meetingId,
            userId,
        });

        res.json({ success: true, message: "Left meeting" });
    } catch (error) {
        logger.error("leaveMeeting error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const endMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user._id;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.host.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the host can end the meeting" });
        }

        meeting.status = "ended";
        meeting.endedAt = new Date();
        if (meeting.startedAt) {
            meeting.duration = Math.round((meeting.endedAt - meeting.startedAt) / 60000);
        }
        await meeting.save();

        safeEmitToRoom(`meeting:${meetingId}`, "meeting:ended", { meetingId });

        if (meeting.isRecurring && meeting.recurringPattern) {
            const nextDate = new Date(meeting.scheduledAt || meeting.startedAt);
            switch (meeting.recurringPattern) {
                case "daily": nextDate.setDate(nextDate.getDate() + 1); break;
                case "weekly": nextDate.setDate(nextDate.getDate() + 7); break;
                case "biweekly": nextDate.setDate(nextDate.getDate() + 14); break;
                case "monthly": nextDate.setMonth(nextDate.getMonth() + 1); break;
            }

            await Meeting.create({
                title: meeting.title,
                description: meeting.description,
                workspace: meeting.workspace,
                channel: meeting.channel,
                host: meeting.host,
                participants: meeting.participants.map(p => ({ user: p.user, status: "invited" })),
                type: "scheduled",
                status: "waiting",
                scheduledAt: nextDate,
                isRecurring: true,
                recurringPattern: meeting.recurringPattern,
                settings: meeting.settings,
                meetingCode: generateMeetingCode(),
            });
        }

        res.json({ success: true, message: "Meeting ended", duration: meeting.duration });
    } catch (error) {
        logger.error("endMeeting error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { title, description, scheduledAt, participants, settings } = req.body;
        const userId = req.user._id;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.host.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the host can update the meeting" });
        }

        if (title) meeting.title = title;
        if (description !== undefined) meeting.description = description;
        if (scheduledAt) meeting.scheduledAt = new Date(scheduledAt);
        if (settings) Object.assign(meeting.settings, settings);
        if (participants) {
            meeting.participants = participants.map(p => ({
                user: typeof p === "string" ? p : p.user || p,
                status: "invited",
            }));
        }

        await meeting.save();

        const populatedMeeting = await Meeting.findById(meetingId)
            .populate("host", "fullName profilePic")
            .populate("participants.user", "fullName profilePic")
            .lean();

        res.json({ success: true, meeting: populatedMeeting });
    } catch (error) {
        logger.error("updateMeeting error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user._id;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.host.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the host can delete the meeting" });
        }

        safeEmitToRoom(`meeting:${meetingId}`, "meeting:cancelled", { meetingId });
        await Meeting.findByIdAndDelete(meetingId);

        res.json({ success: true, message: "Meeting deleted" });
    } catch (error) {
        logger.error("deleteMeeting error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const respondToInvite = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { response } = req.body;
        const userId = req.user._id;

        if (!["accepted", "declined"].includes(response)) {
            return res.status(400).json({ success: false, message: "Response must be 'accepted' or 'declined'" });
        }

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        const participantIndex = meeting.participants.findIndex(
            p => p.user.toString() === userId.toString()
        );

        if (participantIndex === -1) {
            return res.status(404).json({ success: false, message: "You are not invited to this meeting" });
        }

        meeting.participants[participantIndex].status = response;
        await meeting.save();

        const hostSocketId = userSocketMap[meeting.host.toString()];
        if (hostSocketId) {
            safeEmitToUser(meeting.host.toString(), "meeting:inviteResponse", {
                meetingId,
                userId,
                response,
            });
        }

        res.json({ success: true, message: `Invite ${response}` });
    } catch (error) {
        logger.error("respondToInvite error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const meeting = await Meeting.findOne({ meetingCode: code.toUpperCase() })
            .populate("host", "fullName profilePic")
            .populate("participants.user", "fullName profilePic")
            .lean();

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        res.json({ success: true, meeting });
    } catch (error) {
        logger.error("getByCode error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
