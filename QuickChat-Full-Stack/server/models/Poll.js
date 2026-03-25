import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { _id: true });

const pollSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true, maxlength: 500 },
    options: [optionSchema],
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    anonymous: { type: Boolean, default: false },
    multipleChoice: { type: Boolean, default: false },
    expiresAt: { type: Date },
    closed: { type: Boolean, default: false },
}, { timestamps: true });

pollSchema.index({ channelId: 1, createdAt: -1 });
pollSchema.index({ groupId: 1, createdAt: -1 });
pollSchema.index({ expiresAt: 1 });

const Poll = mongoose.model("Poll", pollSchema);
export default Poll;
