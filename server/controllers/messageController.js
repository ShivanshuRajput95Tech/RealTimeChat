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

<<<<<<< HEAD
        // Optimized query with projection
        const filteredUsers = await User.find({
=======
        const users = await User.find({
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
            _id: { $ne: userId }
        }).select("-password -__v").lean(); // Use lean() for better performance

<<<<<<< HEAD
        // Count unseen messages more efficiently
        const unseenMessages = {};

        // Use Promise.allSettled for better error handling
        const promises = filteredUsers.map(async(user) => {
            try {
=======
        const unseenMessages = {};

        await Promise.all(
            users.map(async(user) => {

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
                const count = await Message.countDocuments({
                    senderId: user._id,
                    receiverId: userId,
                    seen: false
                });
<<<<<<< HEAD
                if (count > 0) {
                    unseenMessages[user._id] = count;
                }
            } catch (error) {
                console.error(`Error counting messages for user ${user._id}:`, error);
            }
        });

        await Promise.allSettled(promises);
=======

                if (count > 0) unseenMessages[user._id] = count;

            })
        );
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

        res.json({
            success: true,
            users,
            unseenMessages
        });

    } catch (error) {
<<<<<<< HEAD
        console.error("Error in getUsersForSidebar:", error);
=======

        console.error("Sidebar error:", error);

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        res.status(500).json({
            success: false,
            message: "Failed to load users"
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

        // Optimized query with sorting and lean()
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
<<<<<<< HEAD
        })
        .sort({ createdAt: 1 }) // Ensure chronological order
        .lean(); // Better performance

        // Mark messages as seen in bulk operation
        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { seen: true }
        );
=======
        }).sort({ createdAt: 1 });

        await Message.updateMany({
            senderId: selectedUserId,
            receiverId: myId,
            seen: false
        }, { seen: true });
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

        res.json({
            success: true,
            messages
        });

    } catch (error) {
<<<<<<< HEAD
        console.error("Error in getMessages:", error);
=======

        console.error("Message fetch error:", error);

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        res.status(500).json({
            success: false,
            message: "Failed to load messages"
        });
    }

};


/* ===============================
   MARK MESSAGE AS SEEN
================================ */

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
<<<<<<< HEAD
        console.error("Error in markMessageAsSeen:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark message as seen"
=======

        console.error("Seen error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        });
    }

};


/* ===============================
   SEND MESSAGE
================================ */

export const sendMessage = async(req, res) => {

    try {
        const { text, image } = req.body;
<<<<<<< HEAD
        const receiverId = req.params.id;
=======

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        const senderId = req.user._id;
        const receiverId = req.params.id;

        if (!text && !image) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

<<<<<<< HEAD
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
=======
        let imageUrl;

        if (image) {

            const upload = await cloudinary.uploader.upload(image, {
                folder: "chat-messages"
            });

            imageUrl = upload.secure_url;

        }

        const newMessage = await Message.create({
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
            senderId,
            receiverId,
            text: text?.trim(),
            image: imageUrl
        });

<<<<<<< HEAD
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

=======
        const receiverSocket = userSocketMap.get(receiverId);

        if (receiverSocket) {
            io.to(receiverSocket).emit("newMessage", newMessage);
        }

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        res.status(201).json({
            success: true,
            message: populatedMessage
        });

    } catch (error) {
<<<<<<< HEAD
        console.error("Error in sendMessage:", error);
=======

        console.error("Send message error:", error);

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }

};