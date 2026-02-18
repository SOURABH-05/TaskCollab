import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { updateTask, deleteTask, addTaskComment, deleteTaskComment } from '../redux/slices/taskSlice';
import { taskUpdatedInBoard } from '../redux/slices/boardSlice';
import { useSocket } from '../hooks/useSocket';
import ActivityTimeline from './ActivityTimeline';

const TaskDetailModal = ({ task, boardId, onClose }) => {
    const dispatch = useDispatch();
    const { currentBoard } = useSelector((state) => state.board);
    const { user } = useSelector((state) => state.auth);
    const { emitTaskUpdated, emitTaskDeleted } = useSocket(boardId);

    // Find the latest task from the board state
    const latestTask = currentBoard?.lists
        ?.flatMap(list => list.tasks || [])
        .find(t => t._id === task._id) || task;

    const [title, setTitle] = useState(latestTask.title || '');
    const [description, setDescription] = useState(latestTask.description || '');
    const [priority, setPriority] = useState(latestTask.priority || 'medium');
    const [status, setStatus] = useState(latestTask.status || 'todo');
    const [dueDate, setDueDate] = useState(latestTask.dueDate ? latestTask.dueDate.split('T')[0] : '');
    const [assignedUsers, setAssignedUsers] = useState(latestTask.assignedUsers?.map(u => u._id) || []);

    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    // Sync state when latestTask changes from external updates
    useEffect(() => {
        if (latestTask) {
            setTitle(latestTask.title || '');
            setDescription(latestTask.description || '');
            setPriority(latestTask.priority || 'medium');
            setStatus(latestTask.status || 'todo');
            setDueDate(latestTask.dueDate ? latestTask.dueDate.split('T')[0] : '');
            setAssignedUsers(latestTask.assignedUsers?.map(u => u._id) || []);
        }
    }, [latestTask._id, latestTask.title, latestTask.priority, latestTask.status, latestTask.dueDate, latestTask.description, latestTask.assignedUsers]);

    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['todo', 'in-progress', 'done'];

    const priorityColors = {
        low: 'bg-green-100 text-green-800 border-green-300',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        high: 'bg-orange-100 text-orange-800 border-orange-300',
        urgent: 'bg-red-100 text-red-800 border-red-300',
    };

    const statusColors = {
        'todo': 'bg-gray-100 text-gray-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'done': 'bg-green-100 text-green-800',
    };

    // Get all board members
    const allMembers = [
        currentBoard?.owner,
        ...(currentBoard?.members || []),
    ].filter(Boolean);

    // Save with explicit values passed in - avoids stale closure!
    const saveUpdate = async (updates) => {
        setSaveStatus('saving');
        const taskData = {
            title,
            description,
            priority,
            status,
            dueDate,
            assignedUsers,
            ...updates, // Override with the new values
        };
        const result = await dispatch(
            updateTask({
                taskId: task._id,
                taskData,
            })
        );
        if (result.meta.requestStatus === 'fulfilled') {
            emitTaskUpdated(result.payload);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } else {
            setSaveStatus('');
        }
    };

    const handlePriorityChange = (newPriority) => {
        setPriority(newPriority);
        saveUpdate({ priority: newPriority });
    };

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        saveUpdate({ status: newStatus });
    };

    const handleDueDateChange = (newDate) => {
        setDueDate(newDate);
        saveUpdate({ dueDate: newDate });
    };

    const handleTitleBlur = () => {
        saveUpdate({ title });
    };

    const handleDescriptionBlur = () => {
        saveUpdate({ description });
    };

    const handleAddUser = (userId) => {
        if (!assignedUsers.includes(userId)) {
            const newAssignedUsers = [...assignedUsers, userId];
            setAssignedUsers(newAssignedUsers);
            saveUpdate({ assignedUsers: newAssignedUsers });
        }
        setShowUserDropdown(false);
    };

    const handleDelete = async () => {
        const result = await dispatch(deleteTask(task._id));
        if (result.meta.requestStatus === 'fulfilled') {
            emitTaskDeleted(task._id, task.listId);
            toast.success('Task deleted successfully');
            onClose();
        } else {
            toast.error(result.payload || 'Failed to delete task');
        }
    };

    const handleRemoveUser = (userId) => {
        const newAssignedUsers = assignedUsers.filter(id => id !== userId);
        setAssignedUsers(newAssignedUsers);
        saveUpdate({ assignedUsers: newAssignedUsers });
    };

    const [commentText, setCommentText] = useState('');
    const [isCommentLoading, setIsCommentLoading] = useState(false);

    // ... existing handlers ...

    const handleAddComment = async () => {
        if (!commentText.trim()) return;

        setIsCommentLoading(true);
        const result = await dispatch(addTaskComment({
            taskId: task._id,
            text: commentText
        }));

        if (result.meta.requestStatus === 'fulfilled') {
            const updatedTask = result.payload;
            emitTaskUpdated(updatedTask);
            dispatch(taskUpdatedInBoard(updatedTask));
            setCommentText('');
            toast.success('Comment added');
        } else {
            toast.error('Failed to add comment');
        }
        setIsCommentLoading(false);
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        const result = await dispatch(deleteTaskComment({
            taskId: task._id,
            commentId
        }));

        if (result.meta.requestStatus === 'fulfilled') {
            // Since deleteTaskComment returns commentId, we need to manually update the task object locally
            // or fetch the task again.
            // Actually, my backend for deleteComment returns the *updated comments array*! 
            // construct a new task object with updated comments

            // Wait, I should check what I made the backend return for deleteComment.
            // Backend returns: res.json(task.comments); -> Just the comments array.

            // So I need to construct the updated task manually to emit it.
            const updatedComments = result.payload; // This is actually from redux return... 
            // Redux thunk returns commentId. 
            // Ah, I need to check taskSlice.js again.
            // taskSlice returns commentId.
            // So I can't easily emit the full task unless I reconstruct it.

            // Let's rely on the fact that I should probably change the backend/slice to return the full task for consistency.
            // BUT, for now, let's just emit a custom event or strictly update local state.

            // Actually, simpler: I'll just refetch the board or task? No, that's heavy.

            // I'll update the local latestTask with the comments filtered.
            const updatedTask = {
                ...latestTask,
                comments: latestTask.comments.filter(c => c._id !== commentId)
            };

            emitTaskUpdated(updatedTask);
            dispatch(taskUpdatedInBoard(updatedTask));
            toast.success('Comment deleted');
        } else {
            toast.error('Failed to delete comment');
        }
    };

    // ... rest of handlers

    const assignedUserObjects = latestTask.assignedUsers || [];
    const unassignedMembers = allMembers.filter(
        member => !assignedUsers.includes(member._id)
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-5xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-8">
                    {/* Header with gradient */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-100">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent w-full border-none focus:ring-0 p-0 mb-3 placeholder-gray-400"
                                placeholder="Task title..."
                            />
                            <div className="flex items-center space-x-3 text-sm">
                                <span className="text-gray-500">in list</span>
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 font-medium rounded-full">
                                    {currentBoard?.lists?.find((l) =>
                                        l.tasks?.some((t) => t._id === task._id)
                                    )?.title || 'Unknown'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {/* Save Status Indicator */}
                            {saveStatus === 'saving' && (
                                <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg animate-pulse">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span>Saving...</span>
                                </div>
                            )}
                            {saveStatus === 'saved' && (
                                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Saved</span>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        {/* Main Content - 2/3 width */}
                        <div className="col-span-2 space-y-6">
                            {/* Description */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    <span>Description</span>
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Add a detailed description for this task..."
                                />
                            </div>

                            {/* Comments Section */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <span>Comments</span>
                                </label>

                                <div className="space-y-4 mb-4">
                                    {latestTask.comments && latestTask.comments.length > 0 ? (
                                        latestTask.comments.map((comment) => (
                                            <div key={comment._id} className="flex space-x-3 group">
                                                <img
                                                    src={comment.user?.avatar || 'https://via.placeholder.com/32'}
                                                    alt={comment.user?.name}
                                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <div className="bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-gray-800">{comment.user?.name}</span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                                                    </div>
                                                    {(user?._id === comment.user?._id || currentBoard?.owner?._id === user?._id) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="text-xs text-red-400 hover:text-red-600 ml-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic ml-1">No comments yet.</p>
                                    )}
                                </div>

                                <div className="flex items-start space-x-3">
                                    <img
                                        src={user?.avatar || 'https://via.placeholder.com/32'}
                                        alt={user?.name}
                                        className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
                                    />
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Write a comment..."
                                            rows={2}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-sm pr-20"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddComment();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim() || isCommentLoading}
                                            className="absolute bottom-2 right-2 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isCommentLoading ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Timeline */}
                            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
                                <div className="flex items-center space-x-2 mb-4">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-xl font-bold text-gray-900">Activity History</h3>
                                </div>
                                <ActivityTimeline taskId={task._id} lastUpdated={latestTask.updatedAt} />
                            </div>
                        </div>

                        {/* Sidebar - 1/3 width */}
                        <div className="space-y-5">
                            {/* Status */}
                            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Status</span>
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg font-medium border-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${statusColors[status]}`}
                                >
                                    {statuses.map((s) => (
                                        <option key={s} value={s}>
                                            {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Priority</span>
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => handlePriorityChange(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg font-medium border-2 transition-all focus:ring-2 focus:ring-primary-500 ${priorityColors[priority]}`}
                                >
                                    {priorities.map((p) => (
                                        <option key={p} value={p}>
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Due Date */}
                            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Due Date</span>
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => handleDueDateChange(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Assigned Users */}
                            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-4 border-2 border-primary-200 shadow-sm">
                                <label className="flex items-center justify-between mb-3">
                                    <span className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span>Team Members</span>
                                    </span>
                                    <button
                                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                                        className="p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all"
                                        title="Add member"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </label>

                                {/* Dropdown to add users */}
                                {showUserDropdown && unassignedMembers.length > 0 && (
                                    <div className="mb-3 bg-white rounded-lg shadow-lg border-2 border-primary-300 max-h-40 overflow-y-auto">
                                        {unassignedMembers.map((member) => (
                                            <button
                                                key={member._id}
                                                onClick={() => handleAddUser(member._id)}
                                                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-primary-50 transition-colors"
                                            >
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    className="w-8 h-8 rounded-full border-2 border-primary-300"
                                                />
                                                <span className="text-sm font-medium text-gray-700">{member.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Assigned users list */}
                                <div className="space-y-2">
                                    {assignedUserObjects.length > 0 ? (
                                        assignedUserObjects.map((u) => (
                                            <div
                                                key={u._id}
                                                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border-2 border-primary-200 shadow-sm"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={u.avatar}
                                                        alt={u.name}
                                                        className="w-8 h-8 rounded-full border-2 border-primary-300"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveUser(u._id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                                                    title="Remove"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <p className="text-sm text-gray-500">No members assigned</p>
                                            <p className="text-xs text-gray-400 mt-1">Click + to add team members</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Save & Close Button */}
                            <button
                                onClick={() => {
                                    saveUpdate({ title, description, priority, status, dueDate, assignedUsers });
                                    setTimeout(onClose, 300);
                                }}
                                className="w-full bg-gradient-to-r from-primary-500 to-purple-500 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Save & Close</span>
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={handleDelete}
                                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                                <span>Delete Task</span>
                            </button>

                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TaskDetailModal;
