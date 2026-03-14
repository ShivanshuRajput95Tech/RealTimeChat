import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
<<<<<<< HEAD
=======
        index: true
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
<<<<<<< HEAD
=======
        index: true
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
    },

    text: {
        type: String,
<<<<<<< HEAD
    },

    image: {
        type: String,
=======
        trim: true,
        maxlength: 2000
    },

    image: {
        type: String
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
    },

    seen: {
        type: Boolean,
<<<<<<< HEAD
        default: false,
    },
}, { timestamps: true });

// Database indexes for optimal query performance
messageSchema.index({ senderId: 1, receiverId: 1 }); // For conversation queries
messageSchema.index({ receiverId: 1, seen: 1 }); // For unseen message counts
messageSchema.index({ createdAt: 1 }); // For chronological sorting
messageSchema.index({ senderId: 1, createdAt: -1 }); // For sender's message history
=======
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
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

const Message = mongoose.model("Message", messageSchema);

export default Message;