import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "moderator", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
    nickname: { type: String, default: "" },
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    icon: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [memberSchema],
    inviteCode: { type: String, unique: true, sparse: true },
    inviteEnabled: { type: Boolean, default: true },
    settings: {
        defaultChannelType: { type: String, enum: ["text", "voice"], default: "text" },
        allowMemberInvites: { type: Boolean, default: true },
        allowMemberCreateChannels: { type: Boolean, default: false },
        messageRetentionDays: { type: Number, default: 0 },
    },
}, { timestamps: true });

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ "members.user": 1 });
workspaceSchema.index({ inviteCode: 1 });
workspaceSchema.index({ createdAt: -1 });

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;
