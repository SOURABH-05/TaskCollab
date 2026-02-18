import { useSelector } from 'react-redux';

const BoardCard = ({ board, onClick, onDelete }) => {
    const { user } = useSelector((state) => state.auth);
    const isOwner = user?._id === board.owner?._id || user?._id === board.owner;

    return (
        <div
            onClick={onClick}
            className="card cursor-pointer transform hover:scale-105 transition-all duration-200"
        >
            <h3 className="text-xl font-bold text-gray-900 mb-2">{board.title}</h3>
            {board.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{board.description}</p>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                        {board.owner && (
                            <img
                                src={board.owner.avatar}
                                alt={board.owner.name}
                                className="w-8 h-8 rounded-full border-2 border-white"
                                title={`Owner: ${board.owner.name}`}
                            />
                        )}
                        {board.members && board.members.slice(0, 3).map((member) => (
                            <img
                                key={member._id}
                                src={member.avatar}
                                alt={member.name}
                                className="w-8 h-8 rounded-full border-2 border-white"
                                title={member.name}
                            />
                        ))}
                    </div>
                    {board.members && board.members.length > 3 && (
                        <span className="text-xs text-gray-500 font-medium">
                            +{board.members.length - 3}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 font-medium">
                        {board.lists?.length || 0} lists
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(board._id);
                        }}
                        className="flex items-center space-x-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors px-2 py-1 rounded-lg"
                        title="Delete Board"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-xs font-medium">Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoardCard;
