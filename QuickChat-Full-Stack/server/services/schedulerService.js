import Message from "../models/Message.js";
import Reminder from "../models/Reminder.js";
import User from "../models/User.js";
import { getIO, userSocketMap } from "../socket.js";
import redis from "../lib/redis.js";
import logger from "../lib/logger.js";

class SchedulerService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
    }

    async processScheduledMessages() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            const now = new Date();

            const scheduledMessages = await Message.find({
                scheduled: true,
                scheduledAt: { $lte: now },
                sentAt: { $exists: false },
            })
                .populate("senderId", "fullName profilePic")
                .populate("replyTo", "text senderId")
                .lean();

            for (const message of scheduledMessages) {
                try {
                    await Message.findByIdAndUpdate(message._id, {
                        scheduled: false,
                        sentAt: now,
                    });

                    try {
                        const ioInstance = getIO();
                        if (message.receiverId) {
                            const receiverSocketId = userSocketMap[message.receiverId.toString()];
                            if (receiverSocketId) {
                                ioInstance.to(receiverSocketId).emit("newMessage", {
                                    ...message,
                                    scheduled: false,
                                    sentAt: now,
                                });
                            }
                        }

                        if (message.channelId) {
                            ioInstance.to(`channel:${message.channelId}`).emit("newMessage", {
                                ...message,
                                scheduled: false,
                                sentAt: now,
                            });
                        }

                        if (message.groupId) {
                            ioInstance.to(`group:${message.groupId}`).emit("newMessage", {
                                ...message,
                                scheduled: false,
                                sentAt: now,
                            });
                        }
                    } catch (ioErr) {
                        logger.warn("Socket.IO not available for scheduled message notification");
                    }

                    await redis.zrem("scheduled:messages", message._id.toString());

                    logger.info(`Scheduled message sent: ${message._id}`);
                } catch (error) {
                    logger.error(`Failed to send scheduled message ${message._id}:`, error.message);
                }
            }

            if (scheduledMessages.length > 0) {
                logger.info(`Processed ${scheduledMessages.length} scheduled messages`);
            }
        } catch (error) {
            logger.error("Scheduler process error:", error.message);
        } finally {
            this.isRunning = false;
        }
    }

    async processReminders() {
        try {
            const now = new Date();

            const dueReminders = await Reminder.find({
                sent: false,
                remindAt: { $lte: now },
            }).lean();

            for (const reminder of dueReminders) {
                try {
                    const user = await User.findById(reminder.userId).select("fullName").lean();
                    const socketId = userSocketMap[reminder.userId.toString()];

                    if (socketId) {
                        const ioInstance = getIO();
                        ioInstance.to(socketId).emit("notification", {
                            type: "system",
                            title: "Reminder",
                            body: reminder.message,
                            link: reminder.channelId
                                ? `/channel/${reminder.channelId}`
                                : reminder.groupId
                                ? `/group/${reminder.groupId}`
                                : "",
                            createdAt: new Date(),
                        });
                    }

                    await Reminder.findByIdAndUpdate(reminder._id, { sent: true });

                    if (reminder.recurring) {
                        const nextDate = new Date(reminder.remindAt);
                        switch (reminder.recurring) {
                            case "daily": nextDate.setDate(nextDate.getDate() + 1); break;
                            case "weekly": nextDate.setDate(nextDate.getDate() + 7); break;
                            case "monthly": nextDate.setMonth(nextDate.getMonth() + 1); break;
                        }
                        if (nextDate <= now) {
                            nextDate.setTime(now.getTime() + 60000);
                        }
                        await Reminder.create({
                            userId: reminder.userId,
                            message: reminder.message,
                            remindAt: nextDate,
                            channelId: reminder.channelId,
                            groupId: reminder.groupId,
                            conversationId: reminder.conversationId,
                            sourceMessageId: reminder.sourceMessageId,
                            recurring: reminder.recurring,
                        });
                    }

                    logger.info(`Reminder sent to user ${reminder.userId}`);
                } catch (error) {
                    logger.error(`Failed to process reminder ${reminder._id}:`, error.message);
                }
            }

            if (dueReminders.length > 0) {
                logger.info(`Processed ${dueReminders.length} reminders`);
            }
        } catch (error) {
            logger.error("Reminder processing error:", error.message);
        }
    }

    start(intervalMs = 30000) {
        logger.info(`Scheduler started with ${intervalMs}ms interval`);
        this.processScheduledMessages();
        this.processReminders();
        this.intervalId = setInterval(() => {
            this.processScheduledMessages();
            this.processReminders();
        }, intervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info("Scheduler stopped");
        }
    }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
