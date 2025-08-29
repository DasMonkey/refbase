import React from 'react';
import { motion } from 'framer-motion';
import { format, addDays, isSameDay, isToday, isWeekend } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

export type TimelineViewMode = 'weekly' | 'monthly' | 'quarterly';

interface TimelineGridProps {
  startDate: Date;
  viewMode: TimelineViewMode;
  selectedDate: Date;
  onDateClick: (date: Date) => void;
  pixelsPerDay: number;
  visibleDays: number;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  startDate,
  viewMode,
  selectedDate,
  onDateClick,
  pixelsPerDay,
  visibleDays
}) => {
  const { isDark } = useTheme();

  // Generate visible dates
  const dates = Array.from({ length: visibleDays }, (_, i) => addDays(startDate, i));

  // Get date format based on view mode
  const getDateFormat = (date: Date) => {
    switch (viewMode) {
      case 'weekly':
        return {
          day: format(date, 'EEE'),
          date: format(date, 'd'),
          full: format(date, 'MMM d')
        };
      case 'monthly':
        return {
          day: format(date, 'EE'),
          date: format(date, 'd'),
          full: format(date, 'M/d')
        };
      case 'quarterly':
        return {
          day: '',
          date: format(date, 'd'),
          full: format(date, 'M/d')
        };
      default:
        return {
          day: format(date, 'EEE'),
          date: format(date, 'd'),
          full: format(date, 'MMM d')
        };
    }
  };

  return (
    <div className="timeline-grid">
      {/* Date Headers */}
      <div 
        className={`flex border-b sticky top-0 z-10`}
        style={{
          backgroundColor: isDark ? '#111111' : '#f8fafc',
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
        }}
      >
        {dates.map((date, index) => {
          const isSelectedDate = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isWeekendDate = isWeekend(date);
          const dateFormat = getDateFormat(date);

          return (
            <motion.div
              key={date.toISOString()}
              className={`
                flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                border-r relative
                ${isSelectedDate ? 'bg-blue-100 dark:bg-blue-900' : ''}
                ${isTodayDate ? 'bg-blue-50 dark:bg-blue-950' : ''}
                ${isWeekendDate ? 'bg-gray-50 dark:bg-gray-900' : ''}
                hover:bg-gray-100 dark:hover:bg-gray-800
              `}
              style={{
                width: `${pixelsPerDay}px`,
                minWidth: `${pixelsPerDay}px`,
                height: viewMode === 'weekly' ? '60px' : viewMode === 'monthly' ? '50px' : '40px',
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
              }}
              onClick={() => onDateClick(date)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Today Indicator */}
              {isTodayDate && (
                <div 
                  className="absolute top-0 left-0 right-0 h-1 bg-blue-500"
                />
              )}

              {/* Day Name */}
              {dateFormat.day && (
                <div className={`text-xs font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                } ${isWeekendDate ? 'text-red-500 dark:text-red-400' : ''}`}>
                  {dateFormat.day}
                </div>
              )}

              {/* Date Number */}
              <div className={`text-sm font-semibold ${
                isSelectedDate 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : isTodayDate 
                    ? 'text-blue-500' 
                    : isDark 
                      ? 'text-white' 
                      : 'text-gray-900'
              } ${isWeekendDate && !isSelectedDate && !isTodayDate ? 'text-red-600 dark:text-red-400' : ''}`}>
                {dateFormat.date}
              </div>

              {/* Full Date (for smaller views) */}
              {viewMode !== 'weekly' && (
                <div className={`text-xs ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {dateFormat.full}
                </div>
              )}

              {/* Selected Date Indicator */}
              {isSelectedDate && (
                <motion.div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Grid Lines */}
      <div className="relative">
        {dates.map((date, index) => (
          <div
            key={`grid-${date.toISOString()}`}
            className={`absolute top-0 bottom-0 border-r ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } ${isToday(date) ? 'border-blue-300 dark:border-blue-700 border-2' : ''}`}
            style={{
              left: `${index * pixelsPerDay}px`,
              width: '1px'
            }}
          />
        ))}

        {/* Today Line */}
        {dates.some(date => isToday(date)) && (
          <motion.div
            className="absolute top-0 bottom-0 bg-blue-500 opacity-30 pointer-events-none z-20"
            style={{
              left: `${dates.findIndex(date => isToday(date)) * pixelsPerDay}px`,
              width: `${pixelsPerDay}px`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>
    </div>
  );
};