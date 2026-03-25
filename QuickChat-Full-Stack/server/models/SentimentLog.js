import mongoose from "mongoose";

const sentimentLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    score: { type: Number, min: -1, max: 1, required: true },
    label: { type: String, enum: ["positive", "neutral", "negative"], required: true },
    confidence: { type: Number, min: 0, max: 1 },
}, { timestamps: true });

sentimentLogSchema.index({ workspaceId: 1, createdAt: -1 });
sentimentLogSchema.index({ channelId: 1, createdAt: -1 });
sentimentLogSchema.index({ userId: 1, createdAt: -1 });
sentimentLogSchema.index({ createdAt: 1 });

const SentimentLog = mongoose.model("SentimentLog", sentimentLogSchema);
export default SentimentLog;
