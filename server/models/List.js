const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a list title'],
        trim: true,
        maxlength: [100, 'List title cannot be more than 100 characters'],
    },
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('List', listSchema);
