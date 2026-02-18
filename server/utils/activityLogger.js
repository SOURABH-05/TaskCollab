const Activity = require('../models/Activity');
const Task = require('../models/Task');

const logActivity = async (actionType, userId, taskId, boardId, message, metadata = {}) => {
    try {
        const activity = await Activity.create({
            actionType,
            userId,
            taskId,
            boardId,
            message,
            metadata,
        });

        // Add activity to task's activityLogs array
        await Task.findByIdAndUpdate(taskId, {
            $push: { activityLogs: activity._id },
        });

        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        return null;
    }
};

module.exports = { logActivity };
