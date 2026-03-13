import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    text: {
        type: String,
        trim: true,
        maxlength: 2000
    },

    image: {
        type: String
    },

    seen: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Prevent empty messages
messageSchema.pre("validate", function(next) {
    if (!this.text && !this.image) {
        return next(new Error("Message cannot be empty"));
    }
    next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;