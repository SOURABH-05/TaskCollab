const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a board title'],
        trim: true,
        maxlength: [100, 'Board title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    lists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Board', boardSchema);
