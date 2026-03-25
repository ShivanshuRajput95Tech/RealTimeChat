import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    remindAt: { type: Date, required: true },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sourceMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    sent: { type: Boolean, default: false },
    recurring: { type: String, enum: [null, "daily", "weekly", "monthly"], default: null },
}, { timestamps: true });

reminderSchema.index({ remindAt: 1, sent: 1 });
reminderSchema.index({ userId: 1, sent: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
