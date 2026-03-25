import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    bio: { type: String },
    status: {
        type: String,
        enum: ["online", "idle", "dnd", "offline"],
        default: "offline",
    },
    statusText: { type: String, default: "" },
    workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }],
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    settings: {
        theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
        notifications: { type: Boolean, default: true },
        soundEnabled: { type: Boolean, default: true },
        language: { type: String, default: "en" },
        pushEnabled: { type: Boolean, default: true },
        quietHours: {
            enabled: { type: Boolean, default: false },
            start: { type: String, default: "22:00" },
            end: { type: String, default: "08:00" },
        },
    },
    privacy: {
        showLastSeen: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        showReadReceipts: { type: Boolean, default: true },
    },
    lastSeen: { type: Date, default: null },
    lastActive: { type: Date, default: Date.now },
    weeklyActivity: [{
        date: { type: Date },
        messageCount: { type: Number, default: 0 },
        channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    }],
}, { timestamps: true });

userSchema.index({ workspaces: 1 });
userSchema.index({ groups: 1 });
userSchema.index({ status: 1 });
userSchema.index({ fullName: "text", email: "text" });
userSchema.index({ "weeklyActivity.date": 1 });

const User = mongoose.model("User", userSchema);

export default User;
