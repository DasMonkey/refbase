import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Edit3, Trash2, User, AlertCircle, Loader2 } from 'lucide-react';
import { Project, CalendarEvent, ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useEvents, useEventOperations } from '../hooks/useEvents';
import { useTrackerOperations } from '../hooks/useProjectTrackers';
import { useTimelineTrackers } from '../hooks/useTimelineTrackers';
import { UpcomingEvents } from './UpcomingEvents';
import { SubTabNavigation, CalendarMode } from './SubTabNavigation';
import { ProjectTrackerModal } from './ProjectTrackerModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

interface CalendarTabProps {
  project: Project;
}

// Event Modal Component (moved outside to prevent recreation)
const EventModal: React.FC<{
  selectedEvent: CalendarEvent | null;
  selectedDate: Date;
  isDark: boolean;
  project: Project;
  onClose: () => void;
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  operationLoading: boolean;
  onSuccess: () => Promise<void>;
}> = ({ selectedEvent, selectedDate, isDark, project, onClose, createEvent, updateEvent, operationLoading, onSuccess }) => {
  const [formData, setFormData] = useState(() => ({
    title: selectedEvent?.title || '',
    type: selectedEvent?.type || 'meeting',
    date: selectedEvent ? format(selectedEvent.date, 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd'),
    startTime: selectedEvent?.startTime || '09:00',
    endTime: selectedEvent?.endTime || '10:00',
    description: selectedEvent?.description || '',
    attendees: selectedEvent?.attendees?.join(', ') || ''
  }));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async () => {
    try {
      setValidationErrors([]);
      
      const trimmedTitle = formData.title?.trim() || '';
      const trimmedDescription = formData.description?.trim() || '';
      
      const clientErrors: string[] = [];
      if (!trimmedTitle) {
        clientErrors.push('Event title is required');
      }
      if (!formData.date) {
        clientErrors.push('Event date is required');
      }
      if (!formData.startTime) {
        clientErrors.push('Start time is required');
      }
      if (!formData.endTime) {
        clientErrors.push('End time is required');
      }
      
      if (clientErrors.length > 0) {
        setValidationErrors(clientErrors);
        return;
      }

      const attendeesList = formData.attendees
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      const eventData = {
        projectId: project.id,
        title: trimmedTitle,
        description: trimmedDescription || undefined,
        date: new Date(formData.date),
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type as CalendarEvent['type'],
        attendees: attendeesList.length > 0 ? attendeesList : undefined
      };

      if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventData);
      } else {
        await createEvent(eventData);
      }

      // Explicitly call refresh after successful operation
      await onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        const errors = error.message.split(', ');
        setValidationErrors(errors);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`rounded-2xl p-6 w-full max-w-lg mx-4 border max-h-[90vh] overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
        style={{
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}
      >
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
          {selectedEvent ? 'Edit Event' : 'Add New Event'}
        </h3>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4">
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Please fix the following errors:</p>
                  <ul className="text-sm space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Event Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            >
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
              <option value="milestone">Milestone</option>
              <option value="bug">Bug Fix</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Event description (optional)"
              rows={3}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Attendees (comma-separated)
            </label>
            <input
              type="text"
              value={formData.attendees}
              onChange={(e) => handleInputChange('attendees', e.target.value)}
              placeholder="John Doe, Jane Smith"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              style={{
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            disabled={operationLoading}
            className={`px-4 py-2 rounded-xl transition-colors font-medium ${
              operationLoading ? 'opacity-50 cursor-not-allowed' : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={operationLoading}
            className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center space-x-2 ${
              operationLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {operationLoading && <Loader2 size={16} className="animate-spin" />}
            <span>{selectedEvent ? 'Update Event' : 'Add Event'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const CalendarTab: React.FC<CalendarTabProps> = ({ project }) => {
  const { isDark } = useTheme();
  
  // Mode switching state
  const [currentMode, setCurrentMode] = useState<CalendarMode>('calendar');
  
  // Shared calendar state (preserved across modes)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Event management hooks
  const { events, loading: eventsLoading, error: eventsError, refreshEvents } = useEvents(project.id);
  
  // Upcoming events refresh function - using useRef to avoid stale closure issues
  const refreshUpcomingEventsRef = useRef<(() => Promise<void>) | null>(null);
  
  // Function to set the refresh function
  const setRefreshUpcomingEvents = useCallback((fn: (() => Promise<void>) | null) => {
    refreshUpcomingEventsRef.current = fn;
  }, []);
  
  // Combined refresh function for both main events and upcoming events
  const refreshAllEvents = useCallback(async () => {
    await refreshEvents();
    if (refreshUpcomingEventsRef.current && typeof refreshUpcomingEventsRef.current === 'function') {
      await refreshUpcomingEventsRef.current();
    }
  }, [refreshEvents]);
  
  const { createEvent, updateEvent, deleteEvent, loading: operationLoading, error: operationError } = useEventOperations(refreshAllEvents);

  // Project tracker state (for planner mode)
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<ProjectTracker | null>(null);
  
  // Drag state for timeline scrolling
  const [dragStart, setDragStart] = useState({ x: 0, date: new Date() });
  const dragRef = useRef<HTMLDivElement>(null);
  
  // Timeline operation state for optimistic updates
  const [pendingOperations, setPendingOperations] = useState<Map<string, ProjectTracker>>(new Map());
  const [operationErrors, setOperationErrors] = useState<Map<string, string>>(new Map());
  
  const [isDragging, setIsDragging] = useState(false);
  

  // Project tracker management hooks - optimized timeline loading (loads ~6 months, expands as needed)
  const { trackers, loading: trackersLoading, error: trackersError, refreshTrackers } = useTimelineTrackers(
    project.id,
    currentDate
  );
  const { createTracker, updateTracker, deleteTracker, loading: trackerOperationLoading } = useTrackerOperations(refreshTrackers);

  // Memoize calendar calculations for performance
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding days to start from Sunday
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (firstDayOfWeek - i));
      return date;
    });

    return {
      monthStart,
      monthEnd,
      allDays: [...paddingDays, ...monthDays]
    };
  }, [currentDate]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  }, [currentDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Memoize events for selected date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  }, [events]);

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

  const selectedDateEvents = getEventsForDate(selectedDate);

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  // Handle upcoming event click - navigate to event date
  const handleUpcomingEventClick = useCallback((event: CalendarEvent) => {
    setSelectedDate(event.date);
    // If the event is in a different month, navigate to that month
    if (!isSameMonth(event.date, currentDate)) {
      setCurrentDate(event.date);
    }
  }, [currentDate]);

  // Project tracker handlers
  const handleTrackerClick = useCallback((tracker: ProjectTracker) => {
    setSelectedTracker(tracker);
  }, []);

  const handleEditTracker = useCallback((tracker: ProjectTracker) => {
    setSelectedTracker(tracker);
    setShowTrackerModal(true);
  }, []);

  const handleDeleteTracker = useCallback(async (trackerId: string) => {
    if (window.confirm('Are you sure you want to delete this tracker?')) {
      try {
        await deleteTracker(trackerId);
      } catch (error) {
        console.error('Failed to delete tracker:', error);
      }
    }
  }, [deleteTracker]);

  // Remove unused handleAddTracker - adding trackers is handled through the timeline interface



  // Create optimistic trackers with pending operations applied (moved up to avoid hoisting issues)
  const optimisticTrackers = useMemo(() => {
    return trackers.map(tracker => {
      const pendingUpdate = pendingOperations.get(tracker.id);
      return pendingUpdate ? { ...tracker, ...pendingUpdate } : tracker;
    });
  }, [trackers, pendingOperations]);

  // Batch operation handlers




  // Drag and drop handlers



  // Drag handlers for smooth timeline scrolling
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentMode !== 'planner') return;
    
    // Don't start dragging if clicking on a tracker bar
    const target = e.target as HTMLElement;
    if (target.closest('[data-tracker-bar]')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, 
      date: new Date(currentDate) 
    });
    
    // Prevent text selection
    e.preventDefault();
  }, [currentMode, currentDate]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || currentMode !== 'planner') return;
    
    const deltaX = e.clientX - dragStart.x;
    // Get timeline container width for responsive calculation
    const timelineElement = dragRef.current?.closest('.min-w-max');
    const timelineWidth = timelineElement ? timelineElement.clientWidth - 192 : 840; // Subtract left column width
    const pixelsPerDay = timelineWidth / 14; // 14 days visible
    const daysToMove = Math.round(deltaX / pixelsPerDay);
    
    if (Math.abs(daysToMove) >= 1) {
      const newDate = new Date(dragStart.date);
      newDate.setDate(dragStart.date.getDate() - daysToMove);
      setCurrentDate(newDate);
      
      // Reset drag start to prevent accumulating small movements
      setDragStart({
        x: e.clientX,
        date: new Date(newDate)
      });
    }
  }, [isDragging, dragStart, currentMode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse events for smooth dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup effects for mode switching
  React.useEffect(() => {
    // Clear timeline-specific state when switching away from planner mode
    if (currentMode !== 'planner') {
      setPendingOperations(new Map());
      setOperationErrors(new Map());
      setSelectedTracker(null);
    }
  }, [currentMode]);

  // Cleanup pending operations on tracker data refresh
  React.useEffect(() => {
    // Remove pending operations for trackers that no longer exist
    setPendingOperations(prev => {
      const trackerIds = new Set(trackers.map(t => t.id));
      const filtered = new Map();
      prev.forEach((value, key) => {
        if (trackerIds.has(key)) {
          filtered.set(key, value);
        }
      });
      return filtered;
    });

    // Clear operation errors for trackers that no longer exist
    setOperationErrors(prev => {
      const trackerIds = new Set(trackers.map(t => t.id));
      const filtered = new Map();
      prev.forEach((value, key) => {
        if (trackerIds.has(key)) {
          filtered.set(key, value);
        }
      });
      return filtered;
    });
  }, [trackers]);



  // Error display component
  const ErrorDisplay = ({ error }: { error: string }) => (
    <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
      <div className="flex items-center space-x-2">
        <AlertCircle size={16} />
        <span className="text-sm font-medium">Error: {error}</span>
      </div>
    </div>
  );


  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Sub-tab Navigation */}
      <SubTabNavigation 
        currentMode={currentMode} 
        onModeChange={setCurrentMode} 
      />
      
      {/* Calendar Mode (existing functionality) */}
      {currentMode === 'calendar' && (
        <div className="flex h-full w-full overflow-hidden">
      {/* Left Side - Calendar */}
      <div className={`w-96 border-r flex flex-col flex-shrink-0`} style={{
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        {/* Calendar Header */}
        <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Calendar</h2>
            <button
              onClick={() => {
                setSelectedEvent(null); // Ensure we're creating a new event
                setShowEventModal(true);
              }}
              className={`flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 border ${isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
            >
              <Plus size={14} className="mr-1" />
              Add Event
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth('prev')}
              className={`p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className={`p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Compact Calendar */}
        <div className="p-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className={`text-center text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                {day.substring(0, 2)}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.allDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const dayEvents = getEventsForDate(day);
              const hasEvents = dayEvents.length > 0;

              return (
                <motion.button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-1 rounded-lg text-xs font-medium transition-all duration-200 relative
                    ${isCurrentMonth ? `${isDark ? 'text-white' : 'text-gray-900'}` : `${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                    ${isSelected ? 'bg-blue-600 text-white' : ''}
                    ${isTodayDate && !isSelected ? `${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'}` : ''}
                    ${!isSelected && !isTodayDate ? `hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}` : ''}
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {format(day, 'd')}

                  {/* Event indicators */}
                  {hasEvents && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <div key={idx} className={`w-1 h-1 rounded-full ${getEventTypeColor(event.type)}`}></div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="p-4 flex-1 min-h-0 flex flex-col">
          <UpcomingEvents 
            projectId={project.id}
            onEventClick={handleUpcomingEventClick}
            onRefreshReady={setRefreshUpcomingEvents}
          />
        </div>
      </div>

      {/* Right Side - Event Details */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* Events Header */}
        <div className={`px-6 py-4 border-b flex-shrink-0`} style={{
          backgroundColor: isDark ? '#111111' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-1`}>
                {format(selectedDate, 'EEEE, MMMM d')}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'} scheduled
              </p>
            </div>

          </div>
        </div>

        {/* Events List */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
          <div className="p-6">
            {/* Error Display */}
            {(eventsError || operationError) && (
              <div className="mb-4">
                <ErrorDisplay error={eventsError || operationError || ''} />
              </div>
            )}

            {/* Loading State */}
            {eventsLoading ? (
              <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading events...</p>
              </div>
            ) : selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-sm`}
                    style={{
                      backgroundColor: isDark ? '#111111' : '#ffffff',
                      borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
                    }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-2 ${getEventTypeColor(event.type)}`}></div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{event.title}</h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <Clock size={12} />
                              <span>{event.startTime} - {event.endTime}</span>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                                event.type === 'task' ? 'bg-green-100 text-green-800' :
                                  event.type === 'milestone' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}>
                              {event.type}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900 text-gray-400 hover:text-red-200' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id);
                          }}
                          disabled={operationLoading}
                        >
                          {operationLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>

                    {event.description && (
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{event.description}</p>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <User size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                        <div className="flex items-center space-x-1">
                          {event.attendees.slice(0, 3).map((attendee, idx) => (
                            <div
                              key={idx}
                              className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {attendee}
                            </div>
                          ))}
                          {event.attendees.length > 3 && (
                            <div className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                              +{event.attendees.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
                  <CalendarIcon className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-medium mb-2">No events scheduled</p>
                <p className="text-sm">Use the "Add Event" button above to create your first event</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <EventModal
          selectedEvent={selectedEvent}
          selectedDate={selectedDate}
          isDark={isDark}
          project={project}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          createEvent={createEvent}
          updateEvent={updateEvent}
          operationLoading={operationLoading}
          onSuccess={refreshAllEvents}
        />
      )}
        </div>
      )}
      
      {/* Project Planner Mode - SIMPLIFIED */}
      {currentMode === 'planner' && (
        <div className="flex h-full w-full overflow-hidden">
          {/* Timeline View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between`} style={{
              backgroundColor: isDark ? '#111111' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button onClick={() => navigateMonth('prev')} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <ChevronLeft size={16} />
                  </button>
                  <h3 className={`text-lg font-semibold text-center w-40 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {format(currentDate, 'MMMM yyyy')}
                  </h3>
                  <button onClick={() => navigateMonth('next')} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                  Today
                </button>
              </div>
              
              <button onClick={() => { setSelectedTracker(null); setShowTrackerModal(true); }} className={`flex items-center px-3 py-2 text-sm font-medium border ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}>
                <Plus size={14} className="mr-1" />
                Add Tracker
              </button>
            </div>

            {/* Content */}
            <div className={`flex-1 relative overflow-x-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
              {trackersError && (
                <div className="p-4">
                  <ErrorDisplay error={trackersError} />
                </div>
              )}

              {trackersLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading trackers...</p>
                  </div>
                </div>
              ) : (
                <div className="min-w-max">
                  {/* Date Headers */}
                  <div className={`border-b sticky top-0 z-10 flex`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0', backgroundColor: isDark ? '#0a0a0a' : '#f8fafc', height: '76.8px' }}>
                    <div className="w-48 p-4 border-r h-full flex items-center" style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Timeline Tracking</div>
                    </div>
                    <div 
                      className={`flex flex-1 h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onMouseDown={handleTimelineMouseDown}
                      ref={dragRef}
                    >
                    {Array.from({ length: 14 }, (_, i) => {
                      // Center 14 days around current date (-7 to +6)
                      const date = new Date(currentDate);
                      date.setDate(currentDate.getDate() - 7 + i);
                      const isTodayDate = isToday(date);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday (0) or Saturday (6)
                      
                      let bgColor = '';
                      if (isTodayDate) {
                        bgColor = isDark ? 'bg-blue-900/50' : 'bg-blue-50';
                      } else if (isWeekend) {
                        bgColor = isDark ? 'bg-gray-800/30' : 'bg-gray-100/50';
                      }
                      
                      return (
                        <div key={i} className={`flex-1 min-w-[60px] h-full p-2 flex flex-col justify-center border-r relative ${bgColor}`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
                          <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{format(date, 'EEE')}</div>
                          <div className={`text-xs ${isTodayDate ? (isDark ? 'text-blue-300' : 'text-blue-600') : (isDark ? 'text-white' : 'text-gray-900')}`}>{format(date, 'MMM d')}</div>
                          
                          {/* Today red line with extended height to avoid gaps */}
                          {isTodayDate && (() => {
                            const now = new Date();
                            const currentHour = now.getHours();
                            const currentMinute = now.getMinutes();
                            const timeProgress = (currentHour + currentMinute / 60) / 24; // 0 to 1
                            
                            return (
                              <div 
                                className="absolute w-0.5 bg-red-500 pointer-events-none z-10"
                                style={{ 
                                  left: `${timeProgress * 100}%`,
                                  top: 0,
                                  height: '200vh' // Extend way down to cover all rows
                                }}
                              >
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                    </div>
                  </div>


                  {/* Tracker Rows */}
                  {optimisticTrackers.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className={`font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No project trackers</p>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Use the "Add Tracker" button to create your first tracker</p>
                      </div>
                    </div>
                  ) : (
                    optimisticTrackers.map(tracker => {
                      // Normalize tracker dates to remove time components for comparison
                      const startDate = new Date(tracker.startDate);
                      const endDate = new Date(tracker.endDate);
                      const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                      const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                      const getColor = (type: string) => type === 'project' ? 'bg-blue-500' : type === 'feature' ? 'bg-green-500' : 'bg-red-500';
                      
                      return (
                        <div key={tracker.id} className={`flex border-b ${selectedTracker?.id === tracker.id ? (isDark ? 'bg-gray-800/50' : 'bg-blue-50/50') : ''}`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
                          <div 
                            className={`w-48 p-4 border-r flex items-center cursor-pointer transition-colors hover:${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}`} 
                            style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}
                            onClick={() => handleTrackerClick(tracker)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{tracker.title}</div>
                              <div className="flex items-center space-x-1 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${tracker.type === 'project' ? 'bg-blue-100 text-blue-800' : tracker.type === 'feature' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{tracker.type}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${tracker.priority === 'critical' ? 'bg-red-100 text-red-800' : tracker.priority === 'high' ? 'bg-orange-100 text-orange-800' : tracker.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{tracker.priority}</span>
                              </div>
                            </div>
                          </div>
                          <div 
                            className={`flex-1 relative flex ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            onMouseDown={handleTimelineMouseDown}
                            style={{ height: '76.8px' }}
                          >
                            {Array.from({ length: 14 }, (_, i) => {
                              const date = new Date(currentDate);
                              date.setDate(currentDate.getDate() - 7 + i);
                              const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                              const isInRange = dayDate >= normalizedStartDate && dayDate <= normalizedEndDate;
                              const isStart = dayDate.getTime() === normalizedStartDate.getTime();
                              const isEnd = dayDate.getTime() === normalizedEndDate.getTime();
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday (0) or Saturday (6)
                              const isTodayDate = isToday(date);
                              
                              let bgColor = '';
                              if (isTodayDate) {
                                bgColor = isDark ? 'bg-blue-900/20' : 'bg-blue-50/30';
                              } else if (isWeekend) {
                                bgColor = isDark ? 'bg-gray-800/20' : 'bg-gray-100/30';
                              }
                              
                              return (
                                <div key={i} className={`flex-1 min-w-[60px] h-full flex items-center relative ${bgColor}`}>
                                  {isInRange && (
                                    <div
                                      data-tracker-bar
                                      className={`h-8 w-full ${getColor(tracker.type)} text-white text-xs font-medium flex items-center justify-center cursor-pointer ${isStart && isEnd ? 'rounded-lg' : isStart ? 'rounded-l-lg' : isEnd ? 'rounded-r-lg' : ''}`}
                                      onClick={() => handleTrackerClick(tracker)}
                                    >
                                      {isStart && <span className="px-2 truncate">{tracker.title}</span>}
                                      {isEnd && tracker.status === 'completed' && <div className="ml-auto flex items-center space-x-1 text-white text-xs font-medium pr-2"><span>✓</span><span>Done</span></div>}
                                      {isEnd && tracker.status === 'in_progress' && <div className="ml-auto flex items-center space-x-1 text-white text-xs font-medium pr-2"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div><span>Active</span></div>}
                                    </div>
                                  )}
                                  
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Tracker Details */}
            <div className={`w-80 border-l flex flex-col flex-shrink-0`} style={{
            backgroundColor: isDark ? '#111111' : '#f8fafc',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}>
            <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Tracker Details
              </h3>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
              {selectedTracker ? (
                <div>
                  <div className={`p-4 rounded-xl border`} style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
                  }}>
                    <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedTracker.title}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Type:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedTracker.type === 'project' ? 'bg-blue-100 text-blue-800' :
                          selectedTracker.type === 'feature' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedTracker.type}
                        </span>
                      </div>
                      
                      <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedTracker.status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedTracker.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTracker.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Priority:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedTracker.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          selectedTracker.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          selectedTracker.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTracker.priority}
                        </span>
                      </div>
                      
                      <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Start:</span>
                        <span>{format(new Date(selectedTracker.startDate), 'MMM d, yyyy')}</span>
                      </div>
                      
                      <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>End:</span>
                        <span>{format(new Date(selectedTracker.endDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    
                    {selectedTracker.description && (
                      <div className="mt-3">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedTracker.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleEditTracker(selectedTracker)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isDark
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTracker(selectedTracker.id)}
                        className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Select a tracker to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Operation Error Notifications */}
      <AnimatePresence>
        {operationErrors.size > 0 && (
          <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {Array.from(operationErrors.entries()).map(([trackerId, error]) => {
            const tracker = trackers.find(t => t.id === trackerId);
            return (
              <motion.div
                key={trackerId}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`p-4 rounded-lg shadow-lg border max-w-sm ${
                  isDark 
                    ? 'bg-red-900 border-red-700 text-red-100' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {tracker ? tracker.title : 'Unknown Tracker'}
                    </div>
                    <div className="text-sm opacity-90 mt-1">
                      {error}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOperationErrors(prev => {
                        const newErrors = new Map(prev);
                        newErrors.delete(trackerId);
                        return newErrors;
                      });
                    }}
                    className={`text-current opacity-60 hover:opacity-100 transition-opacity`}
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            );
          })}
          </div>
        )}
      </AnimatePresence>

      {/* Project Tracker Modal */}
      {showTrackerModal && (
        <ProjectTrackerModal
          selectedTracker={selectedTracker}
          selectedDate={selectedDate}
          isDark={isDark}
          project={project}
          onClose={() => {
            setShowTrackerModal(false);
            setSelectedTracker(null);
          }}
          createTracker={createTracker}
          updateTracker={updateTracker}
          operationLoading={trackerOperationLoading}
          onSuccess={refreshTrackers}
        />
      )}
    </div>
  );
};