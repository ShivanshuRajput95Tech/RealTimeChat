import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { _id: false });

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    forwardedFromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String },
    image: { type: String },
    file: {
        url: { type: String },
        name: { type: String },
        size: { type: Number },
        type: { type: String },
        duration: { type: Number },
        isVoice: { type: Boolean, default: false },
    },
    type: { type: String, enum: ["text", "image", "file", "system", "broadcast", "template"], default: "text" },
    status: { type: String, enum: ["sending", "sent", "delivered", "read"], default: "sent" },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    priority: { type: String, enum: ["normal", "high", "urgent"], default: "normal" },
    isFormatted: { type: Boolean, default: false },
    formattedText: { type: String },
    reactions: [reactionSchema],
    pinned: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    deleted: { type: Boolean, default: false },
    threadCount: { type: Number, default: 0 },
    scheduled: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    embedding: { type: [Number], select: false },
    aiSummary: { type: String },
    aiTranslatedText: { type: String },
    aiTranslatedLang: { type: String },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    metadata: {
        device: { type: String },
        platform: { type: String },
        location: { type: String },
        workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    },
}, { timestamps: true });

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ threadId: 1, createdAt: 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ scheduled: 1, scheduledAt: 1 });
messageSchema.index({ text: "text" });
messageSchema.index({ mentions: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ forwardedFrom: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
