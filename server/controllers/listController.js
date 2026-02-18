const List = require('../models/List');
const Board = require('../models/Board');
const Task = require('../models/Task');

// @desc    Create list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
    try {
        const { title, boardId, order } = req.body;

        if (!title || !boardId) {
            return res.status(400).json({ message: 'Please provide title and boardId' });
        }

        // Check if board exists and user has access
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized to access this board' });
        }

        const list = await List.create({
            title,
            boardId,
            order: order !== undefined ? order : board.lists.length,
        });

        // Add list to board
        board.lists.push(list._id);
        await board.save();

        res.status(201).json(list);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Check board access
        const board = await Board.findById(list.boardId);
        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, order } = req.body;

        list.title = title || list.title;
        list.order = order !== undefined ? order : list.order;

        const updatedList = await list.save();
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Check board access
        const board = await Board.findById(list.boardId);
        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete all tasks in this list
        await Task.deleteMany({ listId: list._id });

        // Remove list from board
        board.lists = board.lists.filter(id => id.toString() !== list._id.toString());
        await board.save();

        await List.findByIdAndDelete(req.params.id);

        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createList,
    updateList,
    deleteList,
};
