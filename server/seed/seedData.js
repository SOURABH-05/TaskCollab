require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Board.deleteMany({});
        await List.deleteMany({});
        await Task.deleteMany({});
        console.log('Cleared existing data');

        // Create demo user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Demo123!', salt);

        const demoUser = await User.create({
            name: 'Alex Morgan',
            email: 'alex@example.com',
            password: hashedPassword,
            avatar: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=4F46E5&color=fff',
        });

        // Create additional users
        const user2 = await User.create({
            name: 'Sarah Chen',
            email: 'sarah@example.com',
            password: hashedPassword,
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=10B981&color=fff',
        });

        const user3 = await User.create({
            name: 'Mike Ross',
            email: 'mike@example.com',
            password: hashedPassword,
            avatar: 'https://ui-avatars.com/api/?name=Mike+Ross&background=F59E0B&color=fff',
        });

        console.log('Created users');

        // Create demo board
        const board = await Board.create({
            title: 'Project Management Demo',
            description: 'A sample board to demonstrate the task collaboration platform',
            owner: demoUser._id,
            members: [user2._id, user3._id],
        });

        console.log('Created board');

        // Create lists
        const todoList = await List.create({
            title: 'To Do',
            boardId: board._id,
            order: 0,
        });

        const inProgressList = await List.create({
            title: 'In Progress',
            boardId: board._id,
            order: 1,
        });

        const doneList = await List.create({
            title: 'Done',
            boardId: board._id,
            order: 2,
        });

        console.log('Created lists');

        // Update board with lists
        board.lists = [todoList._id, inProgressList._id, doneList._id];
        await board.save();

        // Create tasks for To Do list
        const task1 = await Task.create({
            title: 'Design landing page mockup',
            description: 'Create a modern, responsive design for the landing page',
            listId: todoList._id,
            boardId: board._id,
            priority: 'high',
            assignedUsers: [user2._id],
            createdBy: demoUser._id,
            order: 0,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        const task2 = await Task.create({
            title: 'Setup authentication system',
            description: 'Implement JWT-based authentication with secure password hashing',
            listId: todoList._id,
            boardId: board._id,
            priority: 'urgent',
            assignedUsers: [demoUser._id],
            createdBy: demoUser._id,
            order: 1,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });

        const task3 = await Task.create({
            title: 'Write API documentation',
            description: 'Document all REST API endpoints with examples',
            listId: todoList._id,
            boardId: board._id,
            priority: 'medium',
            assignedUsers: [user3._id],
            createdBy: demoUser._id,
            order: 2,
        });

        // Create tasks for In Progress list
        const task4 = await Task.create({
            title: 'Implement drag and drop',
            description: 'Add react-beautiful-dnd for task dragging between lists',
            listId: inProgressList._id,
            boardId: board._id,
            priority: 'high',
            status: 'in-progress',
            assignedUsers: [demoUser._id, user2._id],
            createdBy: demoUser._id,
            order: 0,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        });

        const task5 = await Task.create({
            title: 'Setup Socket.io for real-time updates',
            description: 'Implement real-time synchronization across all clients',
            listId: inProgressList._id,
            boardId: board._id,
            priority: 'urgent',
            status: 'in-progress',
            assignedUsers: [user2._id],
            createdBy: demoUser._id,
            order: 1,
        });

        // Create tasks for Done list
        const task6 = await Task.create({
            title: 'Setup MongoDB database',
            description: 'Configure MongoDB with Mongoose schemas',
            listId: doneList._id,
            boardId: board._id,
            priority: 'high',
            status: 'done',
            assignedUsers: [demoUser._id],
            createdBy: demoUser._id,
            order: 0,
        });

        const task7 = await Task.create({
            title: 'Create React project structure',
            description: 'Setup React app with Tailwind CSS and Redux Toolkit',
            listId: doneList._id,
            boardId: board._id,
            priority: 'medium',
            status: 'done',
            assignedUsers: [user3._id],
            createdBy: demoUser._id,
            order: 1,
        });

        // Update lists with tasks
        todoList.tasks = [task1._id, task2._id, task3._id];
        await todoList.save();

        inProgressList.tasks = [task4._id, task5._id];
        await inProgressList.save();

        doneList.tasks = [task6._id, task7._id];
        await doneList.save();

        console.log('Created tasks');
        console.log('\n✅ Seed data created successfully!');
        console.log('\n📧 Demo Credentials:');
        console.log('Email: demo@example.com');
        console.log('Password: Demo123!');
        console.log('\nOther users:');
        console.log('Email: john@example.com | Password: Demo123!');
        console.log('Email: jane@example.com | Password: Demo123!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
