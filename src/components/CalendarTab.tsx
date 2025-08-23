import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Edit3, Trash2, User, AlertCircle, Loader2 } from 'lucide-react';
import { Project, CalendarEvent } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useEvents, useEventOperations } from '../hooks/useEvents';
import { UpcomingEvents } from './UpcomingEvents';
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
  );
};