import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import logger from "../lib/logger.js";

export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields: fullName, email, password" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            bio: bio?.trim() || "",
        });

        const token = generateToken(newUser._id);

        const userResponse = {
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            bio: newUser.bio,
            profilePic: newUser.profilePic,
            status: newUser.status,
        };

        res.status(201).json({ success: true, userData: userResponse, token, message: "Account created successfully" });
    } catch (error) {
        logger.error("signup error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
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

        await User.findByIdAndUpdate(userData._id, { status: "online" });

        const token = generateToken(userData._id);

        const userResponse = {
            _id: userData._id,
            fullName: userData.fullName,
            email: userData.email,
            bio: userData.bio,
            profilePic: userData.profilePic,
            status: userData.status,
            statusText: userData.statusText,
            settings: userData.settings,
        };

        res.json({ success: true, userData: userResponse, token, message: "Login successful" });
    } catch (error) {
        logger.error("login error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        if (fullName && fullName.trim().length < 2) {
            return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
        }

        if (bio && bio.trim().length > 500) {
            return res.status(400).json({ success: false, message: "Bio must be less than 500 characters" });
        }

        let updatedUser;

        if (profilePic && profilePic.startsWith("data:")) {
            try {
                const upload = await cloudinary.uploader.upload(profilePic, {
                    folder: "profiles",
                    resource_type: "image",
                    width: 500,
                    height: 500,
                    crop: "fill",
                });
                updatedUser = await User.findByIdAndUpdate(
                    userId,
                    { 
                        profilePic: upload.secure_url, 
                        bio: bio?.trim(), 
                        fullName: fullName?.trim() 
                    }, 
                    { new: true }
                );
            } catch (uploadError) {
                logger.error("Profile pic upload error:", uploadError.message);
                return res.status(400).json({ success: false, message: "Failed to upload image" });
            }
        } else {
            const updateData = {};
            if (bio !== undefined) updateData.bio = bio.trim();
            if (fullName !== undefined) updateData.fullName = fullName.trim();
            
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: "No fields to update" });
            }
            
            updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        }
        
        const userResponse = {
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            bio: updatedUser.bio,
            profilePic: updatedUser.profilePic,
            status: updatedUser.status,
            statusText: updatedUser.statusText,
            settings: updatedUser.settings,
        };
        
        res.json({ success: true, user: userResponse });
    } catch (error) {
        logger.error("updateProfile error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { theme, notifications, soundEnabled, language } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (theme !== undefined) updateData["settings.theme"] = theme;
        if (notifications !== undefined) updateData["settings.notifications"] = notifications;
        if (soundEnabled !== undefined) updateData["settings.soundEnabled"] = soundEnabled;
        if (language !== undefined) updateData["settings.language"] = language;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No settings to update" });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

        res.json({ success: true, user: updatedUser });
    } catch (error) {
        logger.error("updateSettings error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("fullName profilePic bio status statusText");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        logger.error("getUserById error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }

        const users = await User.find({
            _id: { $ne: req.user._id },
            $or: [
                { fullName: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
            ],
        })
            .select("fullName profilePic bio status")
            .limit(20)
            .lean();

        res.json({ success: true, users });
    } catch (error) {
        logger.error("searchUsers error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWeeklyActivity = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const recentActivity = (user.weeklyActivity || []).filter(
            (a) => new Date(a.date) >= weekAgo
        );

        const dailyStats = {};
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dayName = days[date.getDay()];
            dailyStats[dayName] = 0;
        }

        let totalMessages = 0;
        let topChannel = null;
        let topChannelCount = 0;
        let topGroup = null;
        let topGroupCount = 0;
        const channelCounts = {};
        const groupCounts = {};

        for (const activity of recentActivity) {
            const activityDate = new Date(activity.date);
            activityDate.setHours(0, 0, 0, 0);
            const dayName = days[activityDate.getDay()];

            if (dailyStats.hasOwnProperty(dayName)) {
                dailyStats[dayName] += activity.messageCount;
            }

            totalMessages += activity.messageCount;

            if (activity.channelId) {
                const chId = activity.channelId.toString();
                channelCounts[chId] = (channelCounts[chId] || 0) + activity.messageCount;
                if (channelCounts[chId] > topChannelCount) {
                    topChannelCount = channelCounts[chId];
                    topChannel = activity.channelId;
                }
            }

            if (activity.groupId) {
                const gId = activity.groupId.toString();
                groupCounts[gId] = (groupCounts[gId] || 0) + activity.messageCount;
                if (groupCounts[gId] > topGroupCount) {
                    topGroupCount = groupCounts[gId];
                    topGroup = activity.groupId;
                }
            }
        }

        const chartData = Object.entries(dailyStats).map(([day, count]) => ({
            day,
            messages: count,
        })).reverse();

        res.json({
            success: true,
            stats: {
                totalMessages,
                dailyAverage: Math.round((totalMessages / 7) * 10) / 10,
                chartData,
                mostActiveDay: chartData.reduce((max, curr) => curr.messages > max.messages ? curr : max, chartData[0]),
                topChannel: topChannel ? { id: topChannel, messages: topChannelCount } : null,
                topGroup: topGroup ? { id: topGroup, messages: topGroupCount } : null,
            },
        });
    } catch (error) {
        logger.error("getWeeklyActivity error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserActivityById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const recentActivity = (user.weeklyActivity || []).filter(
            (a) => new Date(a.date) >= weekAgo
        );

        const dailyStats = {};
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            dailyStats[days[date.getDay()]] = 0;
        }

        let totalMessages = 0;
        for (const activity of recentActivity) {
            const activityDate = new Date(activity.date);
            activityDate.setHours(0, 0, 0, 0);
            const dayName = days[activityDate.getDay()];
            if (dailyStats.hasOwnProperty(dayName)) {
                dailyStats[dayName] += activity.messageCount;
            }
            totalMessages += activity.messageCount;
        }

        const chartData = Object.entries(dailyStats).map(([day, count]) => ({
            day,
            messages: count,
        })).reverse();

        res.json({
            success: true,
            stats: {
                totalMessages,
                dailyAverage: Math.round((totalMessages / 7) * 10) / 10,
                chartData,
                mostActiveDay: chartData.reduce((max, curr) => curr.messages > max.messages ? curr : max, chartData[0]),
            },
        });
    } catch (error) {
        logger.error("getUserActivityById error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
