import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";


// Signup
export const signup = async(req, res) => {
    try {
        const { fullName, email, password, bio } = req.body;

        // Validation
        if (!fullName?.trim() || !email?.trim() || !password?.trim() || !bio?.trim()) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            return res.status(409).json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            bio: bio.trim(),
        });

        await newUser.save();

        const token = generateToken(newUser._id);

        const { password: _, ...userData } = newUser._doc;

        res.status(201).json({
            success: true,
            userData,
            token,
            message: "Account created successfully",
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// Login
export const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const userData = await User.findOne({ email: email.toLowerCase().trim() });

        if (!userData) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(userData._id);

        const { password: _, ...userWithoutPassword } = userData._doc;

        res.json({
            success: true,
            userData: userWithoutPassword,
            token,
            message: "Login successful",
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
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