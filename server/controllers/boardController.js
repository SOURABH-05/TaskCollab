const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc    Get all boards for user
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [
                { owner: req.user._id },
                { members: req.user._id },
            ],
        })
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json(boards);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar')
            .populate({
                path: 'lists',
                populate: {
                    path: 'tasks',
                    populate: [
                        { path: 'assignedUsers', select: 'name email avatar' },
                        { path: 'createdBy', select: 'name email avatar' },
                    ],
                },
            });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user has access
        const hasAccess =
            board.owner._id.toString() === req.user._id.toString() ||
            board.members.some(member => member._id.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized to access this board' });
        }

        res.json(board);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
    try {
        const { title, description, members } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Please provide a board title' });
        }

        const board = await Board.create({
            title,
            description,
            owner: req.user._id,
            members: members || [],
        });

        const populatedBoard = await Board.findById(board._id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar');

        res.status(201).json(populatedBoard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user is owner
        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this board' });
        }

        const { title, description, members } = req.body;

        // Check for new members to notify
        let addedMembers = [];
        if (members) {
            const oldMemberIds = board.members.map(m => m.toString());
            // Filter IDs that are not in the old list
            addedMembers = members.filter(id => !oldMemberIds.includes(id.toString()));
        }

        board.title = title || board.title;
        board.description = description !== undefined ? description : board.description;
        board.members = members !== undefined ? members : board.members;

        const updatedBoard = await board.save();

        // Notify added members
        if (addedMembers.length > 0) {
            const io = req.app.get('io');
            if (io) {
                addedMembers.forEach(memberId => {
                    io.to(`user_${memberId}`).emit('notification', {
                        message: `You have been added to board: ${updatedBoard.title}`,
                        boardId: updatedBoard._id,
                        type: 'BOARD_INVITE',
                        timestamp: new Date()
                    });
                });
            }
        }
        const populatedBoard = await Board.findById(updatedBoard._id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar');

        res.json(populatedBoard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user is owner
        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this board' });
        }

        // Delete all lists and tasks in this board
        const lists = await List.find({ boardId: board._id });
        for (const list of lists) {
            await Task.deleteMany({ listId: list._id });
            await List.findByIdAndDelete(list._id);
        }

        // Delete all activities for this board
        await Activity.deleteMany({ boardId: board._id });

        await Board.findByIdAndDelete(req.params.id);

        res.json({ message: 'Board deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
};
