import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  calculateTimelineBars, 
  getTrackersForDate,
  getTrackerTypeColor,
  getTrackerStatusStyle,
  getTrackerPriorityBorder,
  TimelineBar
} from '../lib/timelineUtils';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import '../styles/timeline.css';

interface TimelineCalendarGridProps {
  currentDate: Date;
  selectedDate: Date;
  trackers: ProjectTracker[];
  selectedTracker?: ProjectTracker | null;
  onDateClick: (date: Date) => void;
  onTrackerClick: (tracker: ProjectTracker) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onAddTracker: () => void;
  onTrackerResize?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
  onTrackerMove?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date, newLane: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const TimelineCalendarGrid: React.FC<TimelineCalendarGridProps> = ({
  currentDate,
  selectedDate,
  trackers,
  selectedTracker,
  onDateClick,
  onTrackerClick,
  onNavigateMonth,
  onAddTracker,
  onTrackerResize,
  onTrackerMove,
  loading = false,
  error = null,
  onRetry
}) => {
  const { isDark } = useTheme();

  // Calculate timeline data
  const timelineData = useMemo(() => {
    return calculateTimelineBars(trackers, currentDate);
  }, [trackers, currentDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render a timeline bar
  const renderTimelineBar = (bar: TimelineBar, weekIndex: number) => {
    const { tracker, startPosition, width, stackIndex } = bar;
    const statusStyle = getTrackerStatusStyle(tracker.status);
    const priorityBorder = getTrackerPriorityBorder(tracker.priority);
    
    // Enhanced class names for better visual effects
    const trackerTypeClass = `tracker-${tracker.type}`;
    const statusClass = tracker.status === 'completed' ? 'status-completed' : '';
    const pulseClass = tracker.status === 'in_progress' ? 'timeline-bar-pulse' : '';
    
    return (
      <motion.div
        key={`${tracker.id}-${weekIndex}-${startPosition}`}
        className={`
          absolute rounded-md cursor-pointer transition-all duration-200 hover:shadow-lg z-10 interactive-element
          ${trackerTypeClass} ${statusClass} ${pulseClass} ${priorityBorder}
          ${statusStyle.opacity}
        `}
        style={{
          left: `${(startPosition / 7) * 100}%`,
          width: `${(width / 7) * 100}%`,
          top: `${stackIndex * 26 + 2}px`, // 24px height + 2px spacing
          height: '24px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onTrackerClick(tracker);
        }}
        whileHover={{ 
          scale: 1.02, 
          y: -2,
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)"
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
      >
        <div className="px-2 py-1 text-xs font-medium text-white truncate h-full flex items-center relative">
          {bar.displayText}
          
          {/* Priority indicator dot */}
          {tracker.priority === 'critical' && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        {/* Enhanced completion indicator */}
        {tracker.status === 'completed' && (
          <motion.div 
            className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          </motion.div>
        )}
        
        {/* Progress indicator for in-progress trackers */}
        {tracker.status === 'in_progress' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white bg-opacity-30 rounded-b-md overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
        )}
      </motion.div>
    );
  };

  // Calculate the maximum stack height for each week to adjust row heights
  const getWeekHeight = (weekIndex: number) => {
    const week = timelineData.weeks[weekIndex];
    if (!week || week.trackerBars.length === 0) {
      return 'h-16'; // Base height when no trackers
    }
    
    const maxStack = Math.max(...week.trackerBars.map(bar => bar.stackIndex));
    const height = 64 + (maxStack + 1) * 26; // Base height + stacked bars
    return `h-[${height}px]`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b flex-shrink-0`} style={{
        backgroundColor: isDark ? '#111111' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Project Timeline
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigateMonth('prev')}
                className={`p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} min-w-[140px] text-center`}>
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <button
                onClick={() => onNavigateMonth('next')}
                className={`p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <button
            onClick={onAddTracker}
            className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 border rounded-lg ${isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
          >
            <Plus size={16} className="mr-2" />
            Add Tracker
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Projects</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Features</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Bugs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 opacity-50 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Not Started</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 opacity-70 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Completed</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`flex-1 overflow-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div className="p-6">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {weekDays.map((day) => (
              <div key={day} className={`text-center text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} py-3`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Weeks */}
          <div className="space-y-px">
            {timelineData.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className={`grid grid-cols-7 gap-px ${getWeekHeight(weekIndex)} relative`}>
                {/* Day cells */}
                {week.days.map((day, dayIndex) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const dayTrackers = getTrackersForDate(trackers, day);

                  return (
                    <motion.button
                      key={dayIndex}
                      onClick={() => onDateClick(day)}
                      className={`
                        relative p-2 text-sm font-medium transition-all duration-200 border
                        ${isCurrentMonth ? `${isDark ? 'text-white' : 'text-gray-900'}` : `${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                        ${isSelected ? 'bg-blue-600 text-white border-blue-600' : ''}
                        ${isTodayDate && !isSelected ? `${isDark ? 'bg-blue-900 text-blue-200 border-blue-800' : 'bg-blue-100 text-blue-600 border-blue-200'}` : ''}
                        ${!isSelected && !isTodayDate ? `${isDark ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}` : ''}
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-start h-full">
                        <span className="mb-1">{format(day, 'd')}</span>
                        
                        {/* Tracker count indicator */}
                        {dayTrackers.length > 0 && (
                          <div className="flex space-x-1">
                            {dayTrackers.slice(0, 3).map((tracker, idx) => (
                              <div 
                                key={idx} 
                                className={`w-2 h-2 rounded-full ${getTrackerTypeColor(tracker.type)}`}
                              ></div>
                            ))}
                            {dayTrackers.length > 3 && (
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {/* Timeline bars overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="relative h-full pointer-events-auto">
                    {week.trackerBars.map((bar) => renderTimelineBar(bar, weekIndex))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {trackers.length === 0 && (
            <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
                <Plus className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-medium mb-2">No project trackers</p>
              <p className="text-sm">Create your first tracker to start planning your project timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};