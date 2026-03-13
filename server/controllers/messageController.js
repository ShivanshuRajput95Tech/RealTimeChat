import User from "../models/User.js";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

/* ===============================
   GET USERS FOR SIDEBAR
================================ */

export const getUsersForSidebar = async(req, res) => {
    try {

        const userId = req.user._id;

        const users = await User.find({
            _id: { $ne: userId }
        }).select("-password");

        const unseenMessages = {};

        await Promise.all(
            users.map(async(user) => {

                const count = await Message.countDocuments({
                    senderId: user._id,
                    receiverId: userId,
                    seen: false
                });

                if (count > 0) unseenMessages[user._id] = count;

            })
        );

        res.json({
            success: true,
            users,
            unseenMessages
        });

    } catch (error) {

        console.error("Sidebar error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }
};


/* ===============================
   GET CHAT MESSAGES
================================ */

export const getMessages = async(req, res) => {

    try {

        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        await Message.updateMany({
            senderId: selectedUserId,
            receiverId: myId,
            seen: false
        }, { seen: true });

        res.json({
            success: true,
            messages
        });

    } catch (error) {

        console.error("Message fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};


/* ===============================
   MARK MESSAGE AS SEEN
================================ */

export const markMessageAsSeen = async(req, res) => {

    try {

        const { id } = req.params;

        const updatedMessage = await Message.findByIdAndUpdate(
            id, { seen: true }, { new: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        res.json({
            success: true,
            message: updatedMessage
        });

    } catch (error) {

        console.error("Seen error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};


/* ===============================
   SEND MESSAGE
================================ */

export const sendMessage = async(req, res) => {

    try {

        const { text, image } = req.body;

        const senderId = req.user._id;
        const receiverId = req.params.id;

        if (!text && !image) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

        let imageUrl;

        if (image) {

            const upload = await cloudinary.uploader.upload(image, {
                folder: "chat-messages"
            });

            imageUrl = upload.secure_url;

        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        const receiverSocket = userSocketMap.get(receiverId);

        if (receiverSocket) {
            io.to(receiverSocket).emit("newMessage", newMessage);
        }

        res.status(201).json({
            success: true,
            message: newMessage
        });

    } catch (error) {

        console.error("Send message error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};