import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["invited", "accepted", "declined", "joined", "left"], default: "invited" },
        joinedAt: Date,
        leftAt: Date,
    }],
    type: { type: String, enum: ["instant", "scheduled"], default: "instant" },
    status: { type: String, enum: ["waiting", "active", "ended"], default: "waiting" },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: { type: String, enum: ["daily", "weekly", "biweekly", "monthly", null], default: null },
    settings: {
        allowScreenShare: { type: Boolean, default: true },
        allowRecording: { type: Boolean, default: false },
        muteOnJoin: { type: Boolean, default: true },
        waitingRoom: { type: Boolean, default: false },
        maxParticipants: { type: Number, default: 50 },
    },
    recordingUrl: { type: String },
    meetingCode: { type: String, unique: true },
}, { timestamps: true });

meetingSchema.index({ workspace: 1, status: 1 });
meetingSchema.index({ host: 1, scheduledAt: 1 });
meetingSchema.index({ "participants.user": 1, scheduledAt: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
