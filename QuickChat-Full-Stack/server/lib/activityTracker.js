import User from "../models/User.js";
import logger from "./logger.js";

export const trackUserActivity = async (userId, { channelId = null, groupId = null } = {}) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await User.findByIdAndUpdate(userId, { lastActive: new Date() });

        const existingActivity = await User.findOne({
            _id: userId,
            "weeklyActivity.date": today,
        });

        if (existingActivity) {
            const updateOps = { $inc: { "weeklyActivity.$.messageCount": 1 } };
            if (channelId) updateOps.$set = { "weeklyActivity.$.channelId": channelId };
            if (groupId) updateOps.$set = { ...updateOps.$set, "weeklyActivity.$.groupId": groupId };

            await User.findOneAndUpdate(
                { _id: userId, "weeklyActivity.date": today },
                updateOps
            );
        } else {
            const activityEntry = { date: today, messageCount: 1 };
            if (channelId) activityEntry.channelId = channelId;
            if (groupId) activityEntry.groupId = groupId;

            await User.findByIdAndUpdate(userId, {
                $push: { weeklyActivity: activityEntry },
            });
        }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        await User.updateMany(
            { _id: userId, "weeklyActivity.date": { $lt: weekAgo } },
            { $pull: { weeklyActivity: { date: { $lt: weekAgo } } } }
        );
    } catch (err) {
        logger.warn("Activity tracking failed:", err.message);
    }
};

export default trackUserActivity;
