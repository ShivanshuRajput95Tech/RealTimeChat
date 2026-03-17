import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance (2026 optimized)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1 });

// Text index for search (2026 best practice)
// Enables O(1) search instead of O(n) regex scans
userSchema.index({ fullName: 'text', email: 'text' });

// Compound index for user filtering
userSchema.index({ status: 1, createdAt: -1 });

// Expiry index for auto-cleanup of old accounts (optional)
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const User = mongoose.model("User", userSchema);

export default User;
