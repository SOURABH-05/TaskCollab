import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import * as chatService from '../services/chatService';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ChatPanel = ({ boardId, isOpen, onClose, onlineUsers = [], boardMembers = [] }) => {
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Check if a board member is online
    const isUserOnline = (memberId) => {
        return onlineUsers.some(u => u._id === memberId);
    };

    // Load message history
    useEffect(() => {
        if (!isOpen || !boardId) return;

        const loadMessages = async () => {
            setIsLoading(true);
            try {
                const data = await chatService.getMessages(boardId);
                setMessages(data.messages || []);
            } catch (error) {
                console.error('Failed to load messages:', error);
                toast.error('Failed to load chat messages');
            }
            setIsLoading(false);
        };

        loadMessages();
    }, [isOpen, boardId]);

    // Socket for chat
    useEffect(() => {
        if (!isOpen || !boardId) return;

        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.emit('joinBoard', {
            boardId,
            user: user ? {
                _id: user._id || user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            } : null,
        });

        socketRef.current.on('newChatMessage', (message) => {
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        });

        socketRef.current.on('chatTyping', (data) => {
            if (data.isTyping) {
                setTypingUsers(prev => {
                    if (prev.find(u => u._id === data.user?._id)) return prev;
                    return [...prev, data.user];
                });
            } else {
                setTypingUsers(prev => prev.filter(u => u._id !== data.user?._id));
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leaveBoard', boardId);
                socketRef.current.disconnect();
            }
        };
    }, [isOpen, boardId, user, scrollToBottom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = () => {
        if (!newMessage.trim() || !socketRef.current) return;

        socketRef.current.emit('chatMessage', {
            boardId,
            senderId: user._id || user.id,
            content: newMessage.trim(),
            type: 'text',
        });

        socketRef.current.emit('chatTyping', { boardId, isTyping: false });
        setNewMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (socketRef.current) {
            socketRef.current.emit('chatTyping', { boardId, isTyping: true });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.emit('chatTyping', { boardId, isTyping: false });
                }
            }, 2000);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatDate(message.createdAt);
        if (!groups[date]) groups[date] = [];
        groups[date].push(message);
        return groups;
    }, {});

    const isMyMessage = (msg) => {
        const senderId = msg.sender?._id || msg.sender;
        const myId = user?._id || user?.id;
        return senderId === myId;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ animation: 'chatSlideUp 0.3s ease-out' }}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Team Chat</h3>
                        <p className="text-xs text-white text-opacity-80">
                            {boardMembers.length} members
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Board Members Bar */}
            <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center space-x-2 overflow-x-auto flex-shrink-0">
                <span className="text-xs text-gray-500 flex-shrink-0 font-medium">Members:</span>
                {boardMembers.map((member, i) => (
                    <div key={member._id || i} className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full border flex-shrink-0">
                        {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary-400 to-purple-400 flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">{member.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                        )}
                        <span className="text-xs font-medium text-gray-700">{member.name?.split(' ')[0]}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${isUserOnline(member._id) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                ))}
                {boardMembers.length === 0 && (
                    <span className="text-xs text-gray-400">No members</span>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gray-50">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm mt-1">Start chatting with your team!</p>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="flex items-center justify-center my-3">
                                <div className="bg-gray-200 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
                                    {date}
                                </div>
                            </div>

                            {msgs.map((msg) => {
                                const mine = isMyMessage(msg);

                                if (msg.type === 'system') {
                                    return (
                                        <div key={msg._id} className="flex justify-center my-2">
                                            <p className="text-xs text-gray-400 italic bg-gray-100 px-3 py-1 rounded-full">
                                                {msg.content}
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-3`}>
                                        <div className={`flex ${mine ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[80%]`}>
                                            {!mine && (
                                                <div className="flex-shrink-0 mr-2">
                                                    {msg.sender?.avatar ? (
                                                        <img
                                                            src={msg.sender.avatar}
                                                            alt={msg.sender?.name}
                                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-purple-400 flex items-center justify-center border-2 border-white shadow-sm">
                                                            <span className="text-white text-xs font-bold">
                                                                {msg.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div>
                                                {!mine && (
                                                    <p className="text-xs text-gray-500 mb-1 ml-1 font-medium">
                                                        {msg.sender?.name}
                                                    </p>
                                                )}
                                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${mine
                                                    ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-br-md'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                                                    }`}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                </div>
                                                <p className={`text-xs mt-1 ${mine ? 'text-right text-gray-400 mr-1' : 'text-gray-400 ml-1'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}

                {typingUsers.length > 0 && (
                    <div className="flex items-center space-x-2 text-gray-400 px-2">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs">
                            {typingUsers.map(u => u?.name?.split(' ')[0]).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t-2 border-gray-100 flex-shrink-0">
                <div className="flex items-end space-x-2">
                    <div className="flex-1">
                        <textarea
                            value={newMessage}
                            onChange={handleTyping}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-sm"
                            style={{ maxHeight: '100px' }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${newMessage.trim()
                            ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:shadow-lg'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>

            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ChatPanel;
