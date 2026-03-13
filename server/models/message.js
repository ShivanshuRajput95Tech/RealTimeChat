 import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    text: {
        type: String,
    },

    image: {
        type: String,
    },

    seen: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Database indexes for optimal query performance
messageSchema.index({ senderId: 1, receiverId: 1 }); // For conversation queries
messageSchema.index({ receiverId: 1, seen: 1 }); // For unseen message counts
messageSchema.index({ createdAt: 1 }); // For chronological sorting
messageSchema.index({ senderId: 1, createdAt: -1 }); // For sender's message history

const Message = mongoose.model("Message", messageSchema);

export default Message;