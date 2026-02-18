import { Draggable } from 'react-beautiful-dnd';

const TaskCard = ({ task, index, onClick }) => {
    const priorityColors = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800',
    };

    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    className={`bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
                        }`}
                >
                    <h4 className="font-medium text-gray-900 text-sm mb-2">{task.title}</h4>

                    {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                            {/* Priority Badge */}
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority] || priorityColors.medium
                                    }`}
                            >
                                {task.priority}
                            </span>

                            {/* Due Date */}
                            {task.dueDate && (
                                <span className="text-xs text-gray-500 flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span>{formatDate(task.dueDate)}</span>
                                </span>
                            )}
                        </div>

                        {/* Assigned Users */}
                        {task.assignedUsers && task.assignedUsers.length > 0 && (
                            <div className="flex -space-x-2">
                                {task.assignedUsers.slice(0, 3).map((user) => (
                                    <img
                                        key={user._id}
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-6 h-6 rounded-full border-2 border-white"
                                        title={user.name}
                                    />
                                ))}
                                {task.assignedUsers.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                        <span className="text-xs text-gray-600">+{task.assignedUsers.length - 3}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard;
