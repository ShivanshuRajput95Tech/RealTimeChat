import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
        type: String,
        enum: ["message", "mention", "reaction", "reply", "thread", "workspace_invite", "group_invite", "system"],
        required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    data: {
        messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
        channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
        workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
