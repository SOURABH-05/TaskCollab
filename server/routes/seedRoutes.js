const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');

// @route   POST /api/seed
// @desc    Seed database with demo data
// @access  Public (remove in production!)
router.post('/', async (req, res) => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Board.deleteMany({});
        await List.deleteMany({});
        await Task.deleteMany({});

        // Create users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Demo123!', salt);

        const users = await User.create([
            {
                name: 'Demo User',
                email: 'demo@example.com',
                password: hashedPassword,
                avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=4F46E5&color=fff',
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
                avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=10B981&color=fff',
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: hashedPassword,
                avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=F59E0B&color=fff',
            },
        ]);

        // Create a board
        const board = await Board.create({
            title: 'Project Management',
            description: 'Main project board for team collaboration',
            owner: users[0]._id,
            members: [users[1]._id, users[2]._id],
        });

        // Create lists
        const lists = await List.create([
            { title: 'To Do', boardId: board._id, order: 0 },
            { title: 'In Progress', boardId: board._id, order: 1 },
            { title: 'Done', boardId: board._id, order: 2 },
        ]);

        // Create tasks
        const tasks = await Task.create([
            {
                title: 'Design homepage mockup',
                description: 'Create wireframes and high-fidelity designs',
                status: 'todo',
                priority: 'high',
                listId: lists[0]._id,
                boardId: board._id,
                createdBy: users[0]._id,
                assignedUsers: [users[1]._id],
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                order: 0,
            },
            {
                title: 'Setup authentication system',
                description: 'Implement JWT-based authentication',
                status: 'in-progress',
                priority: 'urgent',
                listId: lists[1]._id,
                boardId: board._id,
                createdBy: users[0]._id,
                assignedUsers: [users[0]._id, users[2]._id],
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                order: 0,
            },
            {
                title: 'Database schema design',
                description: 'Design MongoDB collections and relationships',
                status: 'done',
                priority: 'medium',
                listId: lists[2]._id,
                boardId: board._id,
                createdBy: users[1]._id,
                assignedUsers: [users[1]._id],
                order: 0,
            },
            {
                title: 'API documentation',
                description: 'Document all REST API endpoints',
                status: 'todo',
                priority: 'low',
                listId: lists[0]._id,
                boardId: board._id,
                createdBy: users[2]._id,
                order: 1,
            },
            {
                title: 'Implement drag and drop',
                description: 'Add react-beautiful-dnd to Kanban board',
                status: 'in-progress',
                priority: 'high',
                listId: lists[1]._id,
                boardId: board._id,
                createdBy: users[0]._id,
                assignedUsers: [users[0]._id],
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                order: 1,
            },
        ]);

        // Update board with lists
        board.lists = lists.map(l => l._id);
        await board.save();

        // Update lists with tasks
        lists[0].tasks = [tasks[0]._id, tasks[3]._id];
        lists[1].tasks = [tasks[1]._id, tasks[4]._id];
        lists[2].tasks = [tasks[2]._id];
        await Promise.all(lists.map(l => l.save()));

        res.json({
            success: true,
            message: 'Database seeded successfully!',
            data: {
                users: users.length,
                boards: 1,
                lists: lists.length,
                tasks: tasks.length,
                credentials: {
                    email: 'demo@example.com',
                    password: 'Demo123!',
                },
            },
        });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
