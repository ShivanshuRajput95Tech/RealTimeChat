import Note from "../models/Note.js";
import logger from "../lib/logger.js";

export const getNotes = async (req, res) => {
    try {
        const userId = req.user._id;
        const { workspaceId, channelId, groupId } = req.query;

        const query = {
            $or: [
                { createdBy: userId },
                { collaborators: userId },
            ],
        };

        if (workspaceId) query.workspaceId = workspaceId;
        if (channelId) query.channelId = channelId;
        if (groupId) query.groupId = groupId;

        const notes = await Note.find(query)
            .populate("createdBy", "fullName profilePic")
            .populate("collaborators", "fullName profilePic")
            .sort({ isPinned: -1, updatedAt: -1 })
            .lean();

        res.json({ success: true, notes });
    } catch (error) {
        logger.error("getNotes error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createNote = async (req, res) => {
    try {
        const { title, content, workspaceId, channelId, groupId, collaborators, tags } = req.body;
        const userId = req.user._id;

        if (!title) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        const note = await Note.create({
            title,
            content: content || "",
            workspaceId,
            channelId,
            groupId,
            createdBy: userId,
            collaborators: collaborators || [],
            tags: tags || [],
        });

        const populatedNote = await Note.findById(note._id)
            .populate("createdBy", "fullName profilePic")
            .populate("collaborators", "fullName profilePic")
            .lean();

        res.status(201).json({ success: true, note: populatedNote });
    } catch (error) {
        logger.error("createNote error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { title, content, collaborators, isPinned, tags } = req.body;
        const userId = req.user._id;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        const isOwner = note.createdBy.toString() === userId.toString();
        const isCollaborator = note.collaborators.includes(userId);

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ success: false, message: "Not authorized to edit this note" });
        }

        if (title) note.title = title;
        if (content !== undefined) note.content = content;
        if (collaborators) note.collaborators = collaborators;
        if (isPinned !== undefined) note.isPinned = isPinned;
        if (tags) note.tags = tags;

        await note.save();

        const populatedNote = await Note.findById(noteId)
            .populate("createdBy", "fullName profilePic")
            .populate("collaborators", "fullName profilePic")
            .lean();

        res.json({ success: true, note: populatedNote });
    } catch (error) {
        logger.error("updateNote error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const userId = req.user._id;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        if (note.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the owner can delete this note" });
        }

        await Note.findByIdAndDelete(noteId);

        res.json({ success: true, message: "Note deleted" });
    } catch (error) {
        logger.error("deleteNote error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getNoteById = async (req, res) => {
    try {
        const { noteId } = req.params;
        const userId = req.user._id;

        const note = await Note.findById(noteId)
            .populate("createdBy", "fullName profilePic")
            .populate("collaborators", "fullName profilePic")
            .lean();

        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        const isOwner = note.createdBy._id.toString() === userId.toString();
        const isCollaborator = note.collaborators.some(c => c._id.toString() === userId.toString());

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ success: false, message: "Not authorized to view this note" });
        }

        res.json({ success: true, note });
    } catch (error) {
        logger.error("getNoteById error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};