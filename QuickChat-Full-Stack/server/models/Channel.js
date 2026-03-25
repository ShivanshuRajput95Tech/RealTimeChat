import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    topic: { type: String, default: "", maxlength: 250 },
    type: { type: String, enum: ["text", "voice"], default: "text" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    position: { type: Number, default: 0 },
    category: { type: String, default: "Text Channels" },
    isPrivate: { type: Boolean, default: false },
    allowedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    lastMessageAt: { type: Date, default: Date.now },
    slowMode: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
}, { timestamps: true });

channelSchema.index({ workspace: 1, position: 1 });
channelSchema.index({ workspace: 1, name: 1 }, { unique: true });
channelSchema.index({ archived: 1 });
channelSchema.index({ lastMessageAt: -1 });
channelSchema.index({ category: 1, position: 1 });

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;
