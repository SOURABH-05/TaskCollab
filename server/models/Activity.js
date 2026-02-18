const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true,
        enum: [
            'task_created',
            'task_updated',
            'task_moved',
            'task_deleted',
            'user_assigned',
            'user_unassigned',
            'priority_changed',
            'duedate_changed',
            'description_updated',
            'title_updated',
        ],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Activity', activitySchema);
