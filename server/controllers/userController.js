import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
<<<<<<< HEAD
=======
import cloudinary from "../lib/cloudinary.js";
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

/* ==============================
   SIGNUP
============================== */

export const signup = async(req, res) => {
    try {
<<<<<<< HEAD
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
=======

        const { fullName, email, password, bio } = req.body;

        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Account already exists"
            });
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        }

        const hashedPassword = await bcrypt.hash(password, 10);

<<<<<<< HEAD
        const newUser = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            bio: bio.trim(),
=======
        const newUser = await User.create({
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            bio
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        });

        const token = generateToken(newUser._id);

        const { password: _, ...userData } = newUser.toObject();

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            userData,
            token
        });

    } catch (error) {
<<<<<<< HEAD
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
=======

        console.error("Signup error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
    }
};


/* ==============================
   LOGIN
============================== */

export const login = async(req, res) => {

    try {
        const { email, password } = req.body;

<<<<<<< HEAD
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
=======
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = generateToken(user._id);

        const { password: _, ...userData } = user.toObject();

        res.json({
            success: true,
<<<<<<< HEAD
            userData: userWithoutPassword,
            token,
            message: "Login successful",
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
=======
            message: "Login successful",
            userData,
            token
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
    }
};


/* ==============================
   CHECK AUTH
============================== */

export const checkAuth = async(req, res) => {

    try {

        res.json({
            success: true,
            userData: req.user
        });

    } catch (error) {

        console.error("Auth check error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};


/* ==============================
   UPDATE PROFILE
============================== */

export const updateProfile = async(req, res) => {

    try {

        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        let updateData = {
            bio,
            fullName
        };

        if (profilePic) {

            const upload = await cloudinary.uploader.upload(profilePic, {
                folder: "chat-app-profiles"
            });

            updateData.profilePic = upload.secure_url;

        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData, { new: true }
        ).select("-password");

        res.json({
            success: true,
            userData: updatedUser
        });

    } catch (error) {

        console.error("Profile update error:", error);

        res.status(500).json({
            success: false,
            message: "Error updating profile"
        });

    }

};