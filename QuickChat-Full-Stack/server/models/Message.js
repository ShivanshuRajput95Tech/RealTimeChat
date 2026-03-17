import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      maxlength: 5000,
    },
    image: {
      type: String,
    },
    seen: {
      type: Boolean,
      default: false,
      index: true,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance (2026 optimized)
// Primary index for conversation queries (O(log n) instead of O(n))
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// For unread message counts and filtering
messageSchema.index({ receiverId: 1, seen: 1, createdAt: -1 });

// For sender-focused queries (e.g., user's outgoing messages)
messageSchema.index({ senderId: 1, createdAt: -1 });

// For message cleanup/archival (TTL index for auto-deletion if needed)
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

// Avoid individual indexes when compound indexes exist
// Individual indexes on fields are created automatically by mongoose
// but we explicitly define compounds for clarity and control

const Message = mongoose.model("Message", messageSchema);

export default Message;