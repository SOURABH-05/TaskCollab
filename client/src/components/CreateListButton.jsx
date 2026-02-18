import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { createList } from '../redux/slices/listSlice';
import { useSocket } from '../hooks/useSocket';

const CreateListButton = ({ boardId }) => {
    const dispatch = useDispatch();
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const { emitListCreated } = useSocket(boardId);
    const inputRef = useRef(null);
    const popoverRef = useRef(null);

    // Focus input when creating
    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    // Close popover on click outside
    useEffect(() => {
        if (!isCreating) return;
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setIsCreating(false);
                setTitle('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCreating]);

    const handleCreate = async () => {
        if (!title.trim()) return;

        const result = await dispatch(createList({ title, boardId }));

        if (result.meta.requestStatus === 'fulfilled') {
            emitListCreated(result.payload);
            toast.success('List created successfully');
        } else {
            toast.error(result.payload || 'Failed to create list');
        }

        setTitle('');
        setIsCreating(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:shadow-md transition-all"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add List</span>
            </button>

            {isCreating && (
                <div
                    ref={popoverRef}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50"
                    style={{ animation: 'popoverFade 0.15s ease-out' }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter list title..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={handleCreate}
                            disabled={!title.trim()}
                            className={`flex-1 text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${title.trim()
                                ? 'bg-primary-500 text-white hover:bg-primary-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Create
                        </button>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setTitle('');
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes popoverFade {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CreateListButton;
