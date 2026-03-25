import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, default: "" },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPinned: { type: Boolean, default: false },
    tags: [{ type: String }],
}, { timestamps: true });

noteSchema.index({ workspaceId: 1 });
noteSchema.index({ channelId: 1 });
noteSchema.index({ groupId: 1 });
noteSchema.index({ createdBy: 1 });
noteSchema.index({ title: "text", content: "text" });

const Note = mongoose.model("Note", noteSchema);

export default Note;