import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Home, 
  ZoomIn, 
  ZoomOut,
  Map
} from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { TimelineViewMode } from './TimelineGrid';
import { 
  navigateTimeline, 
  jumpToToday, 
  jumpToDate,
  VIEW_MODE_CONFIGS
} from '../lib/timelineViewport';

interface TimelineNavigationProps {
  currentStartDate: Date;
  viewMode: TimelineViewMode;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onViewModeChange: (mode: TimelineViewMode) => void;
  onDateJump: (date: Date) => void;
  onToggleMinimap?: () => void;
  showMinimap?: boolean;
}

export const TimelineNavigation: React.FC<TimelineNavigationProps> = ({
  currentStartDate,
  viewMode,
  onNavigate,
  onViewModeChange,
  onDateJump,
  onToggleMinimap,
  showMinimap = false
}) => {
  const { isDark } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Format the current date range display
  const getDateRangeDisplay = () => {
    const config = VIEW_MODE_CONFIGS[viewMode];
    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + config.visibleDays - 1);

    switch (viewMode) {
      case 'weekly':
        return `${format(currentStartDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
      case 'monthly':
        return format(currentStartDate, 'MMMM yyyy');
      case 'quarterly':
        return `Q${Math.ceil((currentStartDate.getMonth() + 1) / 3)} ${format(currentStartDate, 'yyyy')}`;
      default:
        return format(currentStartDate, 'MMM d, yyyy');
    }
  };

  const handleDatePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    if (!isNaN(selectedDate.getTime())) {
      onDateJump(selectedDate);
      setShowDatePicker(false);
    }
  };

  const viewModeButtons: Array<{ mode: TimelineViewMode; label: string; shortcut: string }> = [
    { mode: 'weekly', label: 'Weekly', shortcut: 'W' },
    { mode: 'monthly', label: 'Monthly', shortcut: 'M' },
    { mode: 'quarterly', label: 'Quarterly', shortcut: 'Q' }
  ];

  return (
    <div 
      className={`flex items-center justify-between p-4 border-b bg-opacity-95 backdrop-blur-sm sticky top-0 z-30`}
      style={{
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}
    >
      {/* Left Section - Navigation Controls */}
      <div className="flex items-center space-x-3">
        {/* Previous/Next Navigation */}
        <div className="flex items-center space-x-1">
          <motion.button
            onClick={() => onNavigate('prev')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Previous (←)"
          >
            <ChevronLeft size={18} />
          </motion.button>

          <motion.button
            onClick={() => onNavigate('next')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Next (→)"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>

        {/* Today Button */}
        <motion.button
          onClick={() => onNavigate('today')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Go to Today (T)"
        >
          <Home size={14} />
          <span>Today</span>
        </motion.button>

        {/* Date Range Display & Picker */}
        <div className="relative">
          <motion.button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 ${
              isDark
                ? 'hover:bg-gray-800 text-gray-200 hover:text-white'
                : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Jump to Date (D)"
          >
            <Calendar size={14} />
            <span>{getDateRangeDisplay()}</span>
          </motion.button>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 mt-2 p-3 rounded-lg border shadow-lg z-40`}
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
              }}
            >
              <input
                type="date"
                onChange={handleDatePickerChange}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#000000'
                }}
                defaultValue={format(currentStartDate, 'yyyy-MM-dd')}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Center Section - View Mode Toggle */}
      <div className="flex items-center space-x-1">
        {viewModeButtons.map(({ mode, label, shortcut }) => (
          <motion.button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              viewMode === mode
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white'
                : isDark
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={`${label} View (${shortcut})`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Right Section - Additional Controls */}
      <div className="flex items-center space-x-2">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <motion.button
            onClick={() => {
              const modes: TimelineViewMode[] = ['quarterly', 'monthly', 'weekly'];
              const currentIndex = modes.indexOf(viewMode);
              if (currentIndex > 0) {
                onViewModeChange(modes[currentIndex - 1]);
              }
            }}
            disabled={viewMode === 'quarterly'}
            className={`p-2 rounded-lg transition-all duration-200 ${
              viewMode === 'quarterly'
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            whileHover={viewMode !== 'quarterly' ? { scale: 1.05 } : {}}
            whileTap={viewMode !== 'quarterly' ? { scale: 0.95 } : {}}
            title="Zoom Out (-)"
          >
            <ZoomOut size={16} />
          </motion.button>

          <motion.button
            onClick={() => {
              const modes: TimelineViewMode[] = ['quarterly', 'monthly', 'weekly'];
              const currentIndex = modes.indexOf(viewMode);
              if (currentIndex < modes.length - 1) {
                onViewModeChange(modes[currentIndex + 1]);
              }
            }}
            disabled={viewMode === 'weekly'}
            className={`p-2 rounded-lg transition-all duration-200 ${
              viewMode === 'weekly'
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            whileHover={viewMode !== 'weekly' ? { scale: 1.05 } : {}}
            whileTap={viewMode !== 'weekly' ? { scale: 0.95 } : {}}
            title="Zoom In (+)"
          >
            <ZoomIn size={16} />
          </motion.button>
        </div>

        {/* Minimap Toggle */}
        {onToggleMinimap && (
          <motion.button
            onClick={onToggleMinimap}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showMinimap
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white'
                : isDark
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle Minimap (M)"
          >
            <Map size={16} />
          </motion.button>
        )}
      </div>

      {/* Click outside to close date picker */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
};