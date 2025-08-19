import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Project } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

interface CalendarTabProps {
  project: Project;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({ project }) => {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

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

  const allDays = [...paddingDays, ...monthDays];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-6 border-b`} style={{ 
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Calendar</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateMonth('prev')}
                className={`p-3 rounded-xl transition-all duration-200 border`}
                style={{ 
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#1e293b' : '#e2e8f0'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc'}
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} min-w-[200px] text-center`}>
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className={`p-3 rounded-xl transition-all duration-200 border`}
                style={{ 
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#1e293b' : '#e2e8f0'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <Plus size={16} className="mr-2" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`flex-1 p-6`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div className={`rounded-2xl shadow-sm border p-6`} style={{ 
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}>
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-4 mb-6">
            {weekDays.map((day) => (
              <div key={day} className={`text-center text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} py-3`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-4">
            {allDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <motion.button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-3 rounded-xl text-sm font-semibold transition-all duration-200 relative border
                    ${isCurrentMonth ? `${isDark ? 'text-white' : 'text-gray-900'}` : `${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                    ${isSelected ? 'bg-blue-600 text-white border-blue-600' : ''}
                    ${isTodayDate && !isSelected ? 'bg-blue-100 text-blue-600 border-blue-200' : ''}
                  `}
                  style={{
                    backgroundColor: isSelected 
                      ? '#2563eb'
                      : isTodayDate && !isSelected 
                        ? (isDark ? '#1e3a8a' : '#dbeafe')
                        : 'transparent',
                    borderColor: isSelected
                      ? '#2563eb'
                      : isTodayDate && !isSelected
                        ? (isDark ? '#1e40af' : '#93c5fd')
                        : (isDark ? '#1e293b' : '#e2e8f0')
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isTodayDate) {
                      e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isTodayDate) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {format(day, 'd')}
                  
                  {/* Event indicators (placeholder) */}
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {/* Example event dots */}
                    {Math.random() > 0.8 && (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    )}
                    {Math.random() > 0.9 && (
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 rounded-2xl shadow-sm border p-6`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 text-lg`}>
              Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            
            <div className="space-y-3">
              {/* Placeholder events */}
              <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                  <CalendarIcon className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-medium mb-2">No events scheduled</p>
                <button
                  onClick={() => setShowEventModal(true)}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  Add an event
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 w-full max-w-md mx-4 border`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Add Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Event Title
                </label>
                <input
                  type="text"
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
                  Date
                </label>
                <input
                  type="date"
                  defaultValue={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
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
                    Start Time
                  </label>
                  <input
                    type="time"
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
                    End Time
                  </label>
                  <input
                    type="time"
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
                  placeholder="Event description (optional)"
                  rows={3}
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
                onClick={() => setShowEventModal(false)}
                className={`px-4 py-2 rounded-xl transition-colors font-medium`}
                style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEventModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
              >
                Add Event
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};