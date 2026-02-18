const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        type: {
            type: String,
            enum: ['text', 'system'],
            default: 'text',
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
messageSchema.index({ boardId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
