import User from "../models/User.js";
import Message from "../models/message.js";
import { io, userSocketMap } from "../server.js"
// Get all users except the logged in user
export const getUsersForSidebar = async(req, res) => {
    try {

        const userId = req.user._id;

        const filteredUsers = await User.find({
            _id: { $ne: userId }
        }).select("-password");

        // Count unseen messages
        const unseenMessages = {};

        const promises = filteredUsers.map(async(user) => {

            const count = await Message.countDocuments({
                senderId: user._id,
                receiverId: userId,
                seen: false
            });

            if (count > 0) {
                unseenMessages[user._id] = count;
            }

        });

        await Promise.all(promises);

        res.json({
            success: true,
            users: filteredUsers,
            unseenMessages
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Server error"
        });

    }
};
// Get all messages for selected user
export const getMessages = async(req, res) => {
    try {

        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        });

        // Mark messages as seen
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

        res.json({
            success: true,
            messages
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Server error"
        });

    }
};
export const markMessageAsSeen = async(req, res) => {
    try {

        const { id } = req.params;

        const updatedMessage = await Message.findByIdAndUpdate(
            id, { seen: true }, { new: true }
        );

        if (!updatedMessage) {
            return res.json({
                success: false,
                message: "Message not found"
            });
        }

        res.json({
            success: true,
            message: updatedMessage
        });

    } catch (error) {

        console.log(error.message);

        res.json({
            success: false,
            message: error.message
        });

    }
};
import cloudinary from "../lib/cloudinary.js";

// Send message to selected user
export const sendMessage = async(req, res) => {
    try {

        const { text, image } = req.body;

        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;

        // Upload image if exists
        if (image) {
            const upload = await cloudinary.uploader.upload(image);
            imageUrl = upload.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await newMessage.save();
        //emit  the new message to the recievers socket
        const receiverSocket = userSocketMap.get(receiverId);
        if (receiverSocket) {
            io.to(receiverSocket).emit("newMessage", newMessage);
        }

        res.json({
            success: true,
            message: newMessage
        });

    } catch (error) {

        console.log(error.message);

        res.json({
            success: false,
            message: "Server error"
        });

    }
};