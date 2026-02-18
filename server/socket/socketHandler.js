// Track online users per board
const boardUsers = new Map(); // boardId -> Map(socketId -> userData)

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join board room with user data
        socket.on('joinBoard', (data) => {
            const boardId = typeof data === 'string' ? data : data.boardId;
            const user = typeof data === 'string' ? null : data.user;

            socket.join(`board_${boardId}`);
            socket.boardId = boardId;
            socket.userData = user;
            console.log(`Client ${socket.id} joined board_${boardId}`);

            // Join user-specific room for notifications
            if (user && user._id) {
                const userId = user._id.toString();
                socket.join(`user_${userId}`);
                console.log(`Socket ${socket.id} joined user room: user_${userId}`);
            } else if (user && user.id) {
                const userId = user.id.toString();
                socket.join(`user_${userId}`);
                console.log(`Socket ${socket.id} joined user room: user_${userId}`);
            }

            // Track online user
            if (user) {
                if (!boardUsers.has(boardId)) {
                    boardUsers.set(boardId, new Map());
                }
                boardUsers.get(boardId).set(socket.id, {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    joinedAt: new Date().toISOString(),
                });

                // Send current online users to the joining user
                const onlineUsers = Array.from(boardUsers.get(boardId).values());
                socket.emit('onlineUsers', onlineUsers);

                // Notify others that a user joined
                socket.to(`board_${boardId}`).emit('userJoined', {
                    user: boardUsers.get(boardId).get(socket.id),
                    onlineUsers,
                });
            }
        });

        // Explicit join user room (for dashboard/global notifications)
        socket.on('joinUserRoom', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                console.log(`Socket ${socket.id} joined user room: user_${userId}`);
            }
        });

        // Leave board room
        socket.on('leaveBoard', (boardId) => {
            socket.leave(`board_${boardId}`);
            console.log(`Client ${socket.id} left board_${boardId}`);

            // Remove from online users
            if (boardUsers.has(boardId)) {
                const userData = boardUsers.get(boardId).get(socket.id);
                boardUsers.get(boardId).delete(socket.id);
                if (boardUsers.get(boardId).size === 0) {
                    boardUsers.delete(boardId);
                }
                // Notify others
                const onlineUsers = boardUsers.has(boardId)
                    ? Array.from(boardUsers.get(boardId).values())
                    : [];
                socket.to(`board_${boardId}`).emit('userLeft', {
                    user: userData,
                    onlineUsers,
                });
            }
        });

        // Task events - broadcast to OTHER clients only (sender updates via Redux)
        socket.on('taskCreated', (data) => {
            socket.to(`board_${data.boardId}`).emit('taskCreated', {
                ...data.task,
                sender: socket.userData
            });
        });

        socket.on('taskUpdated', (data) => {
            socket.to(`board_${data.boardId}`).emit('taskUpdated', {
                ...data.task,
                sender: socket.userData
            });
        });

        socket.on('taskMoved', (data) => {
            socket.to(`board_${data.boardId}`).emit('taskMoved', {
                taskId: data.taskId,
                sourceListId: data.sourceListId,
                destinationListId: data.destinationListId,
                sourceIndex: data.sourceIndex,
                destinationIndex: data.destinationIndex,
                sender: socket.userData
            });
        });

        socket.on('taskDeleted', (data) => {
            socket.to(`board_${data.boardId}`).emit('taskDeleted', {
                taskId: data.taskId,
                listId: data.listId,
                sender: socket.userData
            });
        });

        // List events
        socket.on('listCreated', (data) => {
            socket.to(`board_${data.boardId}`).emit('listCreated', {
                ...data.list,
                sender: socket.userData
            });
        });

        socket.on('listUpdated', (data) => {
            socket.to(`board_${data.boardId}`).emit('listUpdated', {
                ...data.list,
                sender: socket.userData
            });
        });

        socket.on('listDeleted', (data) => {
            socket.to(`board_${data.boardId}`).emit('listDeleted', {
                listId: data.listId,
                sender: socket.userData
            });
        });

        // Board events
        socket.on('boardUpdated', (data) => {
            socket.to(`board_${data.boardId}`).emit('boardUpdated', data.board);
        });

        // ====== REAL-TIME CHAT ======
        // Chat message - save to DB and broadcast to all board users
        socket.on('chatMessage', async (data) => {
            try {
                const Message = require('../models/Message');
                const message = await Message.create({
                    boardId: data.boardId,
                    sender: data.senderId,
                    content: data.content,
                    type: data.type || 'text',
                });
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'name email avatar');

                // Broadcast to ALL users in the board room (including sender)
                io.to(`board_${data.boardId}`).emit('newChatMessage', populatedMessage);
            } catch (error) {
                console.error('Chat message error:', error);
                socket.emit('chatError', { message: 'Failed to send message' });
            }
        });

        // Chat typing indicator
        socket.on('chatTyping', (data) => {
            socket.to(`board_${data.boardId}`).emit('chatTyping', {
                user: socket.userData,
                isTyping: data.isTyping,
            });
        });

        // Typing indicator (for tasks)
        socket.on('userTyping', (data) => {
            socket.to(`board_${data.boardId}`).emit('userTyping', {
                user: socket.userData,
                isTyping: data.isTyping,
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Remove from all board rooms
            if (socket.boardId && boardUsers.has(socket.boardId)) {
                const userData = boardUsers.get(socket.boardId).get(socket.id);
                boardUsers.get(socket.boardId).delete(socket.id);
                if (boardUsers.get(socket.boardId).size === 0) {
                    boardUsers.delete(socket.boardId);
                }
                const onlineUsers = boardUsers.has(socket.boardId)
                    ? Array.from(boardUsers.get(socket.boardId).values())
                    : [];
                socket.to(`board_${socket.boardId}`).emit('userLeft', {
                    user: userData,
                    onlineUsers,
                });
            }
        });
    });
};

module.exports = socketHandler;
