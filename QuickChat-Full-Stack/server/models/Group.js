import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    avatar: { type: String, default: "" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: Date.now },
    settings: {
        onlyAdminsCanPost: { type: Boolean, default: false },
        onlyAdminsCanEditInfo: { type: Boolean, default: true },
        inviteEnabled: { type: Boolean, default: true },
    },
    inviteCode: { type: String, default: "" },
}, { timestamps: true });

groupSchema.index({ members: 1 });
groupSchema.index({ admins: 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ inviteCode: 1 });
groupSchema.index({ lastMessageAt: -1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
