import { useState } from 'react';
import { toast } from 'react-toastify';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { useDispatch } from 'react-redux';
import { createTask, deleteTask } from '../redux/slices/taskSlice';
import { deleteList } from '../redux/slices/listSlice';
import { useSocket } from '../hooks/useSocket';
import TaskCard from './TaskCard';
import ConfirmModal from './ConfirmModal';

const BoardList = ({ list, index, boardId, onTaskClick }) => {
    const dispatch = useDispatch();
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { emitTaskCreated, emitListDeleted } = useSocket(boardId);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;

        const taskData = {
            title: newTaskTitle,
            listId: list._id,
            boardId,
        };

        const result = await dispatch(createTask(taskData));

        if (result.meta.requestStatus === 'fulfilled') {
            emitTaskCreated(result.payload);
            toast.success('Task created successfully');
        } else {
            toast.error(result.payload || 'Failed to create task');
        }

        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    const confirmDeleteList = async () => {
        const result = await dispatch(deleteList(list._id));
        if (result.meta.requestStatus === 'fulfilled') {
            emitListDeleted(list._id);
            toast.success('List deleted successfully');
        } else {
            toast.error(result.payload || 'Failed to delete list');
        }
    };

    return (
        <div>
            <div className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-100 hover:border-primary-200 transition-all">
                {/* List Header */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900 text-lg">{list.title}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {list.tasks ? list.tasks.length : 0}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete list"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>

                {/* Tasks */}
                <Droppable droppableId={list._id} type="task">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[60px] space-y-3 ${snapshot.isDraggingOver ? 'bg-primary-50 rounded-lg p-2' : ''
                                }`}
                        >
                            {list.tasks &&
                                list.tasks.map((task, taskIndex) => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        index={taskIndex}
                                        onClick={() => onTaskClick(task)}
                                    />
                                ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                {/* Add Task */}
                <div className="mt-3">
                    {isAddingTask ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Enter task title..."
                                className="input-field text-sm"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleAddTask();
                                }}
                                autoFocus
                            />
                            <div className="flex space-x-2">
                                <button onClick={handleAddTask} className="btn-primary text-sm px-3 py-1">
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingTask(false);
                                        setNewTaskTitle('');
                                    }}
                                    className="btn-secondary text-sm px-3 py-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="w-full text-left text-sm text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add a task</span>
                        </button>
                    )}
                </div>
            </div>


            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteList}
                title="Delete List"
                message={`Are you sure you want to delete "${list.title}"? All tasks in this list will be permanently removed.`}
                confirmText="Delete List"
                confirmColor="red"
            />
        </div >
    );
};

export default BoardList;
