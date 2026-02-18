import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import {
    addTaskRealtime,
    updateTaskRealtime,
    deleteTaskRealtime,
} from '../redux/slices/taskSlice';
import {
    addListRealtime,
    updateListRealtime,
    deleteListRealtime,
} from '../redux/slices/listSlice';
import {
    updateBoardRealtime,
    taskUpdatedInBoard,
    taskCreatedInBoard,
    taskDeletedFromBoard,
    listCreatedInBoard,
    listDeletedFromBoard
} from '../redux/slices/boardSlice';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext();

export const SocketProvider = ({ boardId, children }) => {
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const { user } = useSelector((state) => state.auth);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    // Add notification with auto-remove
    const addNotification = useCallback((notification) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev.slice(-4), { ...notification, id }]); // Keep last 5
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    useEffect(() => {
        if (!boardId) return;

        // Initialize socket only once
        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
            });
        }

        const socket = socketRef.current;

        // Connection events
        const onConnect = () => {
            setIsConnected(true);
            socket.emit('joinBoard', {
                boardId,
                user: user ? {
                    _id: user._id || user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                } : null,
            });
        };

        const onDisconnect = () => setIsConnected(false);
        const onConnectError = () => setIsConnected(false);
        const onOnlineUsers = (users) => setOnlineUsers(users);

        const onUserJoined = (data) => {
            setOnlineUsers(data.onlineUsers);
            if (data.user) {
                addNotification({
                    type: 'userJoined',
                    message: `${data.user.name} joined the board`,
                    icon: '👋',
                });
            }
        };

        const onUserLeft = (data) => {
            setOnlineUsers(data.onlineUsers);
            if (data.user) {
                addNotification({
                    type: 'userLeft',
                    message: `${data.user.name} left the board`,
                    icon: '👋',
                });
            }
        };

        const onUserTyping = (data) => {
            if (data.isTyping) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u._id === data.user?._id)) {
                        return [...prev, data.user];
                    }
                    return prev;
                });
            } else {
                setTypingUsers(prev => prev.filter(u => u._id !== data.user?._id));
            }
        };

        const onTaskCreated = (task) => {
            dispatch(addTaskRealtime(task));
            dispatch(taskCreatedInBoard(task));
            if (task.sender) {
                toast.info(`${task.sender.name} created task "${task.title}"`);
            }
        };

        const onTaskUpdated = (task) => {
            dispatch(updateTaskRealtime(task));
            dispatch(taskUpdatedInBoard(task));
        };

        const onTaskMoved = (data) => {
            console.log('Task moved:', data);
            if (data.sender) {
                toast.info(`${data.sender.name} moved a task`);
            }
        };

        const onTaskDeleted = (data) => {
            dispatch(deleteTaskRealtime(data.taskId));
            dispatch(taskDeletedFromBoard(data.taskId));
            if (data.sender) {
                toast.info(`${data.sender.name} deleted a task`);
            }
        };

        const onListCreated = (list) => {
            dispatch(addListRealtime(list));
            dispatch(listCreatedInBoard(list));
            if (list.sender) {
                toast.info(`${list.sender.name} created list "${list.title}"`);
            }
        };

        const onListUpdated = (list) => {
            dispatch(updateListRealtime(list));
        };

        const onListDeleted = (data) => {
            dispatch(deleteListRealtime(data.listId));
            dispatch(listDeletedFromBoard(data.listId));
            if (data.sender) {
                toast.info(`${data.sender.name} deleted a list`);
            }
        };

        const onBoardUpdated = (board) => {
            dispatch(updateBoardRealtime(board));
        };

        // Attach listeners
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('onlineUsers', onOnlineUsers);
        socket.on('userJoined', onUserJoined);
        socket.on('userLeft', onUserLeft);
        socket.on('userTyping', onUserTyping);
        socket.on('taskCreated', onTaskCreated);
        socket.on('taskUpdated', onTaskUpdated);
        socket.on('taskMoved', onTaskMoved);
        socket.on('taskDeleted', onTaskDeleted);
        socket.on('listCreated', onListCreated);
        socket.on('listUpdated', onListUpdated);
        socket.on('listDeleted', onListDeleted);
        socket.on('boardUpdated', onBoardUpdated);

        // Cleanup
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('onlineUsers', onOnlineUsers);
            socket.off('userJoined', onUserJoined);
            socket.off('userLeft', onUserLeft);
            socket.off('userTyping', onUserTyping);
            socket.off('taskCreated', onTaskCreated);
            socket.off('taskUpdated', onTaskUpdated);
            socket.off('taskMoved', onTaskMoved);
            socket.off('taskDeleted', onTaskDeleted);
            socket.off('listCreated', onListCreated);
            socket.off('listUpdated', onListUpdated);
            socket.off('listDeleted', onListDeleted);
            socket.off('boardUpdated', onBoardUpdated);

            socket.emit('leaveBoard', boardId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [boardId, dispatch, user, addNotification]);

    const emitTaskCreated = (task) => {
        if (socketRef.current) {
            socketRef.current.emit('taskCreated', { boardId, task });
        }
    };

    const emitTaskUpdated = (task) => {
        if (socketRef.current) {
            socketRef.current.emit('taskUpdated', { boardId, task });
        }
    };

    const emitTaskMoved = (data) => {
        if (socketRef.current) {
            socketRef.current.emit('taskMoved', { boardId, ...data });
        }
    };

    const emitTaskDeleted = (taskId, listId) => {
        if (socketRef.current) {
            socketRef.current.emit('taskDeleted', { boardId, taskId, listId });
        }
    };

    const emitListCreated = (list) => {
        if (socketRef.current) {
            socketRef.current.emit('listCreated', { boardId, list });
        }
    };

    const emitListUpdated = (list) => {
        if (socketRef.current) {
            socketRef.current.emit('listUpdated', { boardId, list });
        }
    };

    const emitListDeleted = (listId) => {
        if (socketRef.current) {
            socketRef.current.emit('listDeleted', { boardId, listId });
        }
    };

    const emitBoardUpdated = (board) => {
        if (socketRef.current) {
            socketRef.current.emit('boardUpdated', { boardId, board });
        }
    };

    const emitTyping = (isTyping) => {
        if (socketRef.current) {
            socketRef.current.emit('userTyping', { boardId, isTyping });
        }
    };

    const value = {
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        notifications,
        typingUsers,
        emitTaskCreated,
        emitTaskUpdated,
        emitTaskMoved,
        emitTaskDeleted,
        emitListCreated,
        emitListUpdated,
        emitListDeleted,
        emitBoardUpdated,
        emitTyping,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
