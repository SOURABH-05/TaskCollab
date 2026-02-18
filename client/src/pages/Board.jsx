import { useEffect, useState, useMemo } from 'react';

import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { getBoard } from '../redux/slices/boardSlice';
import { updateTask } from '../redux/slices/taskSlice';
import { toast } from 'react-toastify';
import { useSocket, SocketProvider } from '../hooks/useSocket';
import Navbar from '../components/Navbar';
import BoardList from '../components/BoardList';
import CreateListButton from '../components/CreateListButton';
import TaskDetailModal from '../components/TaskDetailModal';
import ChatPanel from '../components/ChatPanel';
import CreateBoardModal from '../components/CreateBoardModal'; // Is this needed? Check imports
import CalendarView from '../components/CalendarView';

const BoardContent = () => {
    const { boardId } = useParams();
    const dispatch = useDispatch();
    const [selectedTask, setSelectedTask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [viewMode, setViewMode] = useState('board');

    const { currentBoard, isLoading } = useSelector((state) => state.board);

    const { emitTaskMoved, onlineUsers } = useSocket();

    useEffect(() => {
        if (boardId) {
            dispatch(getBoard(boardId));
        }
    }, [boardId, dispatch]);

    // Client-side filtering of tasks within lists
    const filteredLists = useMemo(() => {
        if (!currentBoard?.lists) return [];
        if (!searchTerm && !filterUser) return currentBoard.lists;

        const isSearching = searchTerm || filterUser;

        return currentBoard.lists
            .map((list) => {
                const filteredTasks = (list.tasks || []).filter((task) => {
                    let matchesSearch = true;
                    let matchesUser = true;

                    if (searchTerm) {
                        const term = searchTerm.toLowerCase();
                        matchesSearch =
                            task.title?.toLowerCase().includes(term) ||
                            task.description?.toLowerCase().includes(term);
                    }

                    if (filterUser) {
                        const users = task.assignedUsers || [];
                        matchesUser = users.some(
                            (u) => (u?._id || u) === filterUser
                        );
                    }

                    return matchesSearch && matchesUser;
                });

                return { ...list, tasks: filteredTasks };
            })
            // Hide lists with no matching tasks when searching
            .filter((list) => !isSearching || list.tasks.length > 0);
    }, [currentBoard?.lists, searchTerm, filterUser]);

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const sourceListId = source.droppableId;
        const destinationListId = destination.droppableId;
        const taskId = draggableId;

        // Update task in backend
        dispatch(
            updateTask({
                taskId,
                taskData: {
                    listId: destinationListId,
                    order: destination.index,
                },
            })
        );

        // Emit socket event for real-time sync
        emitTaskMoved({
            taskId,
            sourceListId,
            destinationListId,
            sourceIndex: source.index,
            destinationIndex: destination.index,
        });
    };

    const clearSearch = () => {
        setSearchTerm('');
        setFilterUser('');
    };



    const totalTasks = currentBoard?.lists?.reduce(
        (sum, list) => sum + (list.tasks?.length || 0), 0
    ) || 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <Navbar />
                <div className="flex justify-center items-center py-20">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                            <div className="w-16 h-16 border-4 border-primary-500 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
                        </div>
                        <p className="mt-4 text-gray-600 font-medium">Loading board...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentBoard) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                        <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Board Not Found</h2>
                        <p className="text-gray-600">The board you're looking for doesn't exist or you don't have access.</p>
                    </div>
                </div>
            </div>
        );
    }

    const allMembers = [
        currentBoard.owner,
        ...(currentBoard.members || []),
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Board Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Title + Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {currentBoard.title}
                            </h1>
                            {currentBoard.description && (
                                <p className="mt-1.5 text-gray-500 text-sm">{currentBoard.description}</p>
                            )}
                            {/* Quick Stats */}
                            <div className="flex items-center space-x-4 mt-3">
                                <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <span>{currentBoard.lists?.length || 0} lists</span>
                                </span>
                                <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{totalTasks} tasks</span>
                                </span>
                                {/* Team Avatars */}
                                <div className="flex items-center space-x-1">
                                    <div className="flex -space-x-1.5">
                                        {allMembers.slice(0, 4).map((member, i) => (
                                            member.avatar ? (
                                                <img key={member._id || i} src={member.avatar} alt={member.name}
                                                    className="w-6 h-6 rounded-full border-2 border-white" />
                                            ) : (
                                                <div key={member._id || i}
                                                    className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center">
                                                    <span className="text-white text-[9px] font-bold">{member.name?.charAt(0)?.toUpperCase()}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400 ml-1">{allMembers.length} members</span>
                                </div>
                            </div>
                        </div>




                        {/* Search + Filters */}
                        <div className="flex flex-col gap-3 md:w-80">
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('board')}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${viewMode === 'board' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span>Board</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${viewMode === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Calendar</span>
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchTerm && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-1.5 ${showFilters
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    <span>Filter</span>
                                </button>
                                <CreateListButton boardId={boardId} />
                            </div>

                            {showFilters && (
                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Filter by Member
                                    </label>
                                    <select
                                        value={filterUser}
                                        onChange={(e) => setFilterUser(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">All Members</option>
                                        {allMembers.map((member) => (
                                            <option key={member._id} value={member._id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Search Indicator */}
                {(searchTerm || filterUser) && (
                    <div className="mt-3 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Filtering:</span>
                        {searchTerm && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-200">
                                <span>"{searchTerm}"</span>
                                <button onClick={() => setSearchTerm('')} className="hover:text-primary-900">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}
                        {filterUser && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                                <span>{allMembers.find(m => m._id === filterUser)?.name || 'Member'}</span>
                                <button onClick={() => setFilterUser('')} className="hover:text-purple-900">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}
                        <button onClick={clearSearch} className="text-xs text-gray-400 hover:text-gray-600 underline">
                            Clear all
                        </button>
                    </div>
                )}


                {/* Main Content Area */}
                {viewMode === 'board' ? (
                    /* Kanban Board */
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="all-lists" direction="vertical" type="list">
                            {(provided, snapshot) => (
                                <div
                                    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${snapshot.isDraggingOver ? 'bg-primary-50/50 rounded-2xl p-4' : ''
                                        }`}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {filteredLists.map((list, index) => (
                                        <BoardList
                                            key={list._id}
                                            list={list}
                                            index={index}
                                            boardId={boardId}
                                            onTaskClick={setSelectedTask}
                                        />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                ) : (
                    /* Calendar View */
                    <div className="h-[calc(100vh-280px)] min-h-[600px]">
                        <CalendarView
                            tasks={filteredLists.flatMap(list => list.tasks)}
                            onTaskClick={setSelectedTask}
                        />
                    </div>
                )}

                {/* Empty State */}
                {filteredLists.length === 0 && !isLoading && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No lists yet</h3>
                        <p className="text-sm text-gray-500">Create your first list to start organizing tasks</p>
                    </div>
                )}
            </div>


            {
                selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        boardId={boardId}
                        onClose={() => setSelectedTask(null)}
                    />
                )
            }

            {/* Floating Chat Button */}
            {
                !isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center group"
                        title="Open Team Chat"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="absolute bottom-full right-0 mb-2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Team Chat
                        </span>
                    </button>
                )
            }

            {/* Chat Panel */}
            <ChatPanel
                boardId={boardId}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onlineUsers={onlineUsers}
                boardMembers={allMembers}
            />


        </div >
    );
};

const Board = () => {
    const { boardId } = useParams();
    return (
        <SocketProvider boardId={boardId}>
            <BoardContent />
        </SocketProvider>
    );
};

export default Board;
