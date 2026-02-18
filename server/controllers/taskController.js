const Task = require('../models/Task');
const List = require('../models/List');
const Board = require('../models/Board');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get tasks with search and pagination
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        const { boardId, search, assignedUser, page = 1, limit = 50 } = req.query;

        if (!boardId) {
            return res.status(400).json({ message: 'Please provide boardId' });
        }

        // Check board access
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Build query
        const query = { boardId };

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (assignedUser) {
            query.assignedUsers = assignedUser;
        }

        const tasks = await Task.find(query)
            .populate('assignedUsers', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Task.countDocuments(query);

        res.json({
            tasks,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const { title, description, listId, boardId, priority, dueDate, assignedUsers } = req.body;

        if (!title || !listId || !boardId) {
            return res.status(400).json({ message: 'Please provide title, listId, and boardId' });
        }

        // Check board access
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check list exists
        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        const task = await Task.create({
            title,
            description,
            listId,
            boardId,
            priority: priority || 'medium',
            dueDate,
            assignedUsers: assignedUsers || [],
            createdBy: req.user._id,
            order: list.tasks.length,
        });

        // Add task to list
        list.tasks.push(task._id);
        await list.save();

        const populatedTask = await Task.findById(task._id)
            .populate('assignedUsers', 'name email avatar')
            .populate('createdBy', 'name email avatar');

        // Log activity
        await logActivity(
            'task_created',
            req.user._id,
            task._id,
            boardId,
            `${req.user.name} created task "${title}"`
        );

        res.status(201).json(populatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check board access
        const board = await Board.findById(task.boardId);
        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const {
            title,
            description,
            status,
            priority,
            assignedUsers,
            dueDate,
            listId,
            order,
        } = req.body;

        // Track what changed for activity logging
        const changes = [];

        if (title && title !== task.title) {
            changes.push(`title to "${title}"`);
            task.title = title;
        }

        if (description !== undefined && description !== task.description) {
            changes.push('description');
            task.description = description;
        }

        if (status && status !== task.status) {
            changes.push(`status to "${status}"`);
            task.status = status;
        }

        if (priority && priority !== task.priority) {
            // Don't add to changes array to avoid duplicate generic log
            task.priority = priority;
            await logActivity(
                'priority_changed',
                req.user._id,
                task._id,
                task.boardId,
                `changed priority to ${priority}`
            );
        }

        if (dueDate !== undefined && dueDate !== task.dueDate) {
            // Don't add to changes array
            task.dueDate = dueDate;
            await logActivity(
                'duedate_changed',
                req.user._id,
                task._id,
                task.boardId,
                `changed due date`
            );
        }

        if (assignedUsers !== undefined) {
            task.assignedUsers = assignedUsers;
            // assignedUsers changes could be logged here or generic, let's leave generic for now or add specific if needed
            // But complex to track added/removed specifically in this block without more logic
            changes.push('assignees');
        }

        if (order !== undefined) {
            task.order = order;
        }

        // Handle list change (task moved)
        if (listId && listId !== task.listId.toString()) {
            const oldList = await List.findById(task.listId);
            const newList = await List.findById(listId);

            if (!newList) {
                return res.status(404).json({ message: 'New list not found' });
            }

            // Remove from old list
            oldList.tasks = oldList.tasks.filter(id => id.toString() !== task._id.toString());
            await oldList.save();

            // Add to new list
            newList.tasks.push(task._id);
            await newList.save();

            task.listId = listId;

            await logActivity(
                'task_moved',
                req.user._id,
                task._id,
                task.boardId,
                `moved task to "${newList.title}"`
            );
        }

        const updatedTask = await task.save();

        // Log general update if there were changes
        if (changes.length > 0) {
            await logActivity(
                'task_updated',
                req.user._id,
                task._id,
                task.boardId,
                `updated ${changes.join(', ')}`
            );
        }

        const populatedTask = await Task.findById(updatedTask._id)
            .populate('assignedUsers', 'name email avatar')
            .populate('createdBy', 'name email avatar');

        res.json(populatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check board access
        const board = await Board.findById(task.boardId);
        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Remove task from list
        const list = await List.findById(task.listId);
        if (list) {
            list.tasks = list.tasks.filter(id => id.toString() !== task._id.toString());
            await list.save();
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add comment to task
const addTaskComment = async (req, res) => {
    try {
        const { text } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has access to board
        const board = await Board.findById(task.boardId);
        const hasAccess =
            board.owner.toString() === req.user._id.toString() ||
            board.members.some(member => member.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const newComment = {
            text,
            user: req.user._id,
            createdAt: new Date()
        };

        task.comments.push(newComment);
        await task.save();

        // Populate user details for the new comment
        await task.populate({
            path: 'comments.user',
            select: 'name avatar email'
        });

        const addedComment = task.comments[task.comments.length - 1];

        res.status(200).json(addedComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete comment
const deleteTaskComment = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if comment exists
        const comment = task.comments.find(
            comment => comment._id.toString() === req.params.commentId
        );

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is comment author or board owner
        const board = await Board.findById(task.boardId);
        const isOwner = board.owner.toString() === req.user._id.toString();
        const isAuthor = comment.user.toString() === req.user._id.toString();

        if (!isAuthor && !isOwner) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        task.comments = task.comments.filter(
            ({ _id }) => _id.toString() !== req.params.commentId
        );

        await task.save();

        res.json(task.comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    deleteTaskComment,
};
