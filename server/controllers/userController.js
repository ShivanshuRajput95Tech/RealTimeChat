import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";


// Signup
export const signup = async(req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            bio,
        });

        await newUser.save();

        const token = generateToken(newUser._id);

        const { password: _, ...userData } = newUser._doc;

        res.json({
            success: true,
            userData,
            token,
            message: "Account created successfully",
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: "An error occurred" });
    }
};


// Login
export const login = async(req, res) => {
    try {

        const { email, password } = req.body;

        const userData = await User.findOne({ email });

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            userData.password
        );

        if (!isPasswordCorrect) {
            return res.json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = generateToken(userData._id);

        const { password: _, ...userWithoutPassword } = userData._doc;

        res.json({
            success: true,
            userData: userWithoutPassword,
            token,
            message: "Login Success",
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Server error" });
    }
};


// Check Authentication
export const checkAuth = async(req, res) => {
    try {

        res.json({
            success: true,
            userData: req.user
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Server error"
        });

    }
}; //Controller to update user profile details//Controller to update user profile detailsimport User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

// Controller to update user profile details
export const updateProfile = async(req, res) => {

    try {

        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id;

        let updatedUser;

        if (!profilePic) {

            updatedUser = await User.findByIdAndUpdate(
                userId, { bio, fullName }, { new: true }
            );

        } else {

            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(
                userId, {
                    profilePic: upload.secure_url,
                    bio,
                    fullName
                }, { new: true }
            );

        }

        res.json({
            success: true,
            userData: updatedUser
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error updating profile"
        });

    }

};