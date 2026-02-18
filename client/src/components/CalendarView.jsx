import { useState, useMemo } from 'react';

const CalendarView = ({ tasks, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Group tasks by date string (YYYY-MM-DD)
    const tasksByDate = useMemo(() => {
        const grouped = {};
        tasks.forEach(task => {
            if (task.dueDate) {
                const dateStr = new Date(task.dueDate).toISOString().split('T')[0];
                if (!grouped[dateStr]) grouped[dateStr] = [];
                grouped[dateStr].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const renderCalendarGrid = () => {
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="bg-gray-50 border border-gray-100 min-h-[120px]"></div>);
        }

        // Days of current month
        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div key={d} className={`border border-gray-100 min-h-[120px] p-2 bg-white hover:bg-gray-50 transition-colors relative group ${isToday ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-600 text-white shadow-md' : 'text-gray-700'}`}>
                            {d}
                        </span>
                        {dayTasks.length > 0 && (
                            <span className="text-xs text-gray-400 font-medium">{dayTasks.length} tasks</span>
                        )}
                    </div>

                    <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] scrollbar-thin scrollbar-thumb-gray-200">
                        {dayTasks.map(task => (
                            <button
                                key={task._id}
                                onClick={() => onTaskClick(task)}
                                className={`w-full text-left px-2 py-1 rounded text-xs truncate border-l-4 shadow-sm hover:shadow-md transition-all ${task.priority === 'urgent' ? 'bg-red-50 border-red-500 text-red-700' :
                                        task.priority === 'high' ? 'bg-orange-50 border-orange-500 text-orange-700' :
                                            task.priority === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' :
                                                'bg-green-50 border-green-500 text-green-700'
                                    }`}
                                title={task.title}
                            >
                                {task.title}
                            </button>
                        ))}
                    </div>

                    {/* Plus button to add task could go here */}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex space-x-1">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <button
                    onClick={goToToday}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                    Today
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                {renderCalendarGrid()}
            </div>
        </div>
    );
};

export default CalendarView;
