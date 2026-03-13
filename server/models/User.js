import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },

    fullName: {
        type: String,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    profilePic: {
        type: String,
        default: ""
    },

    bio: {
        type: String,
        default: "",
        maxlength: 200
    }
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;