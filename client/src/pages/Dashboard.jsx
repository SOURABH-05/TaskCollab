import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getBoards, deleteBoard } from '../redux/slices/boardSlice';
import Navbar from '../components/Navbar';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { boards, isLoading } = useSelector((state) => state.board);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getBoards());
    }, [dispatch]);

    const handleDeleteBoard = async (boardId) => {
        const result = await dispatch(deleteBoard(boardId));
        if (result.meta.requestStatus === 'fulfilled') {
            toast.success('Board deleted successfully');
        } else {
            toast.error('Failed to delete board');
        }
    };

    // Calculate unique collaborators
    const uniqueCollaborators = new Set();
    if (boards) {
        boards.forEach(board => {
            if (board.owner) uniqueCollaborators.add(board.owner._id || board.owner);
            if (board.members) {
                board.members.forEach(member => {
                    uniqueCollaborators.add(member._id || member);
                });
            }
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header with Feature Highlights */}
                <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                Welcome back, {user?.name || 'there'}! 👋
                            </h1>
                            <p className="text-gray-500">
                                Manage and collaborate on your projects in real-time
                            </p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-5 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2 transform hover:scale-105"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>New Board</span>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {!isLoading && boards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-primary-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Boards</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{boards.length}</p>
                                </div>
                                <div className="p-3 bg-primary-100 rounded-lg">
                                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Active Projects</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{boards.length}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Collaborators</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">
                                        {uniqueCollaborators.size}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Boards Section Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Boards</h2>
                    {boards.length > 0 && (
                        <p className="text-sm text-gray-600">{boards.length} {boards.length === 1 ? 'board' : 'boards'}</p>
                    )}
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-20">
                        <div className="relative">
                            <div className="w-20 h-20 border-8 border-gray-200 rounded-full"></div>
                            <div className="w-20 h-20 border-8 border-primary-500 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
                        </div>
                        <p className="mt-6 text-gray-600 font-medium text-lg">Loading your boards...</p>
                    </div>
                ) : boards.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16">
                        <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="h-16 w-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No boards yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Create your first board to start organizing tasks and collaborating with your team in real-time!
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all inline-flex items-center space-x-3 transform hover:scale-105"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Create Your First Board</span>
                        </button>
                    </div>
                ) : (
                    /* Boards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map((board, index) => (
                            <div
                                key={board._id}
                                className="animate-fadeIn"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <BoardCard
                                    board={board}
                                    onClick={() => navigate(`/board/${board._id}`)}
                                    onDelete={handleDeleteBoard}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <CreateBoardModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default Dashboard;
