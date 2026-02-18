import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { getTaskActivity } from '../services/taskService';

const ActivityTimeline = ({ taskId, lastUpdated }) => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                // Don't set loading to true on subsequent updates to avoid flicker
                if (activities.length === 0) setIsLoading(true);
                const data = await getTaskActivity(taskId, user.token);
                setActivities(data);
            } catch (error) {
                console.error('Error fetching activities:', error);
                toast.error('Failed to load activity history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, [taskId, user.token, lastUpdated]);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
        );
    }

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.map((activity) => (
                <div key={activity._id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                        {activity.userId?.avatar ? (
                            <img
                                src={activity.userId.avatar}
                                alt={activity.userId.name}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                                {activity.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.userId?.name}</span>{' '}
                            <span className="text-gray-600">{activity.message}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatTime(activity.createdAt || activity.timestamp)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;
