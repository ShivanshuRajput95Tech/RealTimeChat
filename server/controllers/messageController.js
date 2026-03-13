import User from "../models/User.js";
import Message from "../models/message.js";
import { io, userSocketMap } from "../server.js"
// Get all users except the logged in user
export const getUsersForSidebar = async(req, res) => {
    try {
        const userId = req.user._id;

        // Optimized query with projection
        const filteredUsers = await User.find({
            _id: { $ne: userId }
        }).select("-password -__v").lean(); // Use lean() for better performance

        // Count unseen messages more efficiently
        const unseenMessages = {};

        // Use Promise.allSettled for better error handling
        const promises = filteredUsers.map(async(user) => {
            try {
                const count = await Message.countDocuments({
                    senderId: user._id,
                    receiverId: userId,
                    seen: false
                });
                if (count > 0) {
                    unseenMessages[user._id] = count;
                }
            } catch (error) {
                console.error(`Error counting messages for user ${user._id}:`, error);
            }
        });

        await Promise.allSettled(promises);

        res.json({
            success: true,
            users: filteredUsers,
            unseenMessages
        });

    } catch (error) {
        console.error("Error in getUsersForSidebar:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load users"
        });
    }
};
// Get all messages for selected user
export const getMessages = async(req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        // Optimized query with sorting and lean()
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        })
        .sort({ createdAt: 1 }) // Ensure chronological order
        .lean(); // Better performance

        // Mark messages as seen in bulk operation
        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { seen: true }
        );

        res.json({
            success: true,
            messages
        });

    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load messages"
        });
    }
};
export const markMessageAsSeen = async(req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Message ID is required"
            });
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            id,
            { seen: true },
            { new: true, runValidators: true }
        ).populate('senderId', 'fullName profilePic').lean();

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // Emit seen status to sender
        const senderSocketId = userSocketMap.get(updatedMessage.senderId._id.toString());
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageSeen", {
                messageId: id,
                seenBy: req.user._id
            });
        }

        res.json({
            success: true,
            message: updatedMessage
        });

    } catch (error) {
        console.error("Error in markMessageAsSeen:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark message as seen"
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

        // Input validation
        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Receiver ID is required"
            });
        }

        if (!text && !image) {
            return res.status(400).json({
                success: false,
                message: "Message must contain text or image"
            });
        }

        if (text && text.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message text cannot exceed 1000 characters"
            });
        }

        // Validate receiver exists
        const receiver = await User.findById(receiverId).select("_id").lean();
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        let imageUrl;

        // Upload image if exists with optimized settings
        if (image) {
            try {
                const upload = await cloudinary.uploader.upload(image, {
                    folder: "realtimechat/messages", // Organize uploads in folders
                    resource_type: "auto",
                    quality: "auto",
                    format: "auto"
                });
                imageUrl = upload.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload image"
                });
            }
        }

        // Create and save message
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text?.trim(),
            image: imageUrl
        });

        await newMessage.save();

        // Populate sender info for real-time emission
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'fullName profilePic')
            .lean();

        // Emit the new message to receiver's socket
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", populatedMessage);
        }

        // Also emit to sender's socket for consistency
        const senderSocketId = userSocketMap.get(senderId.toString());
        if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", populatedMessage);
        }

        res.status(201).json({
            success: true,
            message: populatedMessage
        });

    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
};