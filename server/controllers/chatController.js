const Message = require('../models/Message');

// Get chat messages for a board
const getMessages = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.find({ boardId })
            .populate('sender', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Message.countDocuments({ boardId });

        res.json({
            messages: messages.reverse(), // Oldest first for display
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send a message (also called from socket handler)
const sendMessage = async (req, res) => {
    try {
        const { boardId, content, type } = req.body;
        const sender = req.user._id;

        const message = await Message.create({
            boardId,
            sender,
            content,
            type: type || 'text',
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email avatar');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMessages,
    sendMessage,
};
