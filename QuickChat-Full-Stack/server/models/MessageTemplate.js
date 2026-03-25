import mongoose from "mongoose";

const messageTemplateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    shortcut: { type: String },
    category: { type: String, default: "general" },
    isGlobal: { type: Boolean, default: false },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    usageCount: { type: Number, default: 0 },
}, { timestamps: true });

messageTemplateSchema.index({ userId: 1 });
messageTemplateSchema.index({ workspaceId: 1 });
messageTemplateSchema.index({ shortcut: 1 });

const MessageTemplate = mongoose.model("MessageTemplate", messageTemplateSchema);

export default MessageTemplate;