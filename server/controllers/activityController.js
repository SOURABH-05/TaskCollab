const Activity = require('../models/Activity');

// @desc    Get activity logs for a task
// @route   GET /api/activity/:taskId
// @access  Private
const getTaskActivity = async (req, res) => {
    try {
        const activities = await Activity.find({ taskId: req.params.taskId })
            .populate('userId', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get activity logs for a board
// @route   GET /api/activity/board/:boardId
// @access  Private
const getBoardActivity = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const activities = await Activity.find({ boardId: req.params.boardId })
            .populate('userId', 'name email avatar')
            .populate('taskId', 'title')
            .limit(limit * 1)
            .sort({ createdAt: -1 });

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTaskActivity,
    getBoardActivity,
};
