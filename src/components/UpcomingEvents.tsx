import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { CalendarEvent } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useUpcomingEvents } from '../hooks/useEvents';
import { format, isToday, isTomorrow } from 'date-fns';

interface UpcomingEventsProps {
  projectId: string;
  onEventClick: (event: CalendarEvent) => void;
  maxEvents?: number;
  onRefreshReady?: (refreshFn: () => Promise<void>) => void;
}

const UpcomingEventsComponent: React.FC<UpcomingEventsProps> = ({ 
  projectId, 
  onEventClick, 
  maxEvents = 5,
  onRefreshReady 
}) => {
  const { isDark } = useTheme();
  const { upcomingEvents, loading, error, refreshUpcomingEvents } = useUpcomingEvents(projectId, 7);

  // Expose refresh function to parent
  React.useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(refreshUpcomingEvents);
    }
  }, [onRefreshReady, refreshUpcomingEvents]);

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500';
      case 'task':
        return 'bg-green-500';
      case 'milestone':
        return 'bg-purple-500';
      case 'bug':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format date for display
  const formatEventDate = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM d');
    }
  };

  const displayEvents = upcomingEvents;
  const hasMoreEvents = false; // We'll use scrolling instead of limiting

  if (loading) {
    return (
      <div className={`p-4 rounded-xl border`} style={{
        backgroundColor: isDark ? '#111111' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-xl border`} style={{
        backgroundColor: isDark ? '#111111' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className={`text-center py-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          <p className="text-sm">Failed to load upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border flex flex-col h-full`} style={{
      backgroundColor: isDark ? '#111111' : '#ffffff',
      borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
    }}>
      {/* Header */}
      <div className={`p-4 border-b flex-shrink-0`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
        <div className="flex items-center space-x-2">
          <Calendar size={16} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Upcoming Events
          </h3>
        </div>
      </div>

      {/* Events List */}
      <div className={`p-4 flex-1 min-h-0 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
        {displayEvents.length > 0 ? (
          <div className="space-y-3">
            {displayEvents.map((event, index) => (
              <motion.button
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onEventClick(event)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group`}
                style={{
                  backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                  borderColor: isDark ? '#1a1a1a' : '#e2e8f0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#1a1a1a' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#0a0a0a' : '#f8fafc';
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getEventTypeColor(event.type)}`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {event.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center space-x-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span>{formatEventDate(event.date)}</span>
                          </div>
                          <div className={`flex items-center space-x-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Clock size={10} />
                            <span>{event.startTime}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                          event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                          event.type === 'task' ? 'bg-green-100 text-green-700' :
                          event.type === 'milestone' ? 'bg-purple-100 text-purple-700' :
                          event.type === 'bug' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {event.type}
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight 
                    size={14} 
                    className={`flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`} 
                  />
                </div>
              </motion.button>
            ))}

          </div>
        ) : (
          <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium mb-1">No upcoming events</p>
            <p className="text-xs">Events for the next 7 days will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

UpcomingEventsComponent.displayName = 'UpcomingEvents';

export const UpcomingEvents = React.memo(UpcomingEventsComponent);