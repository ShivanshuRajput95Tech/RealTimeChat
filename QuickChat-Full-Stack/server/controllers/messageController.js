import MessageService from "../services/messageService.js";
import { validateSendMessage, validatePagination } from "../lib/validators.js";
import { asyncHandler } from "../lib/errors.js";
import logger from "../lib/logger.js";
import { io, userSocketMap } from "../server.js";

// Get all users except the logged in user with unseen message counts
export const getUsersForSidebar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    logger.debug("Fetching users for sidebar", { userId });

    const { users, unseenMessages } = await MessageService.getUsersForSidebar(userId);
    
    res.json({ success: true, users, unseenMessages });
});

// Get all messages for selected user with pagination
export const getMessages = asyncHandler(async (req, res) => {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    logger.debug("Fetching messages", { userId: myId, selectedUserId, page, limit });

    const result = await MessageService.getMessages(myId, selectedUserId, page, limit);
    
    res.json({ success: true, ...result });
});

// Mark message as seen using message id
export const markMessageAsSeen = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.debug("Marking message as seen", { messageId: id });
    
    await MessageService.markMessageAsRead(id);
    
    res.json({ success: true });
});

// Send message to selected user with image upload support
export const sendMessage = asyncHandler(async (req, res) => {
    const validatedData = validateSendMessage(req.body);
    const receiverId = req.params.id;
    const senderId = req.user._id;

    logger.debug("Sending message", { senderId, receiverId, hasImage: !!validatedData.image });

    const newMessage = await MessageService.sendMessage(senderId, receiverId, validatedData);

    // Emit the new message to the receiver's socket(s)
    const receiverSockets = userSocketMap.get(receiverId);
    if (receiverSockets && receiverSockets.size > 0) {
        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("newMessage", newMessage);
        });
    }

    logger.info("Message sent successfully", { messageId: newMessage._id, senderId, receiverId });

    res.json({ success: true, newMessage });
});