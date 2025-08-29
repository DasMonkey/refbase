import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { TimelineGrid, TimelineViewMode } from './TimelineGrid';
import { TimelineNavigation } from './TimelineNavigation';
import { 
  createTimelineViewport,
  navigateTimeline,
  jumpToToday,
  jumpToDate,
  VIEW_MODE_CONFIGS,
  TimelineViewport
} from '../lib/timelineViewport';

interface TimelineContainerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  children?: React.ReactNode; // For tracker lanes
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({
  selectedDate,
  onDateSelect,
  children
}) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Timeline state
  const [viewport, setViewport] = useState<TimelineViewport>(() => 
    createTimelineViewport(jumpToToday('weekly'), 'weekly')
  );
  const [showMinimap, setShowMinimap] = useState(false);

  // Handle navigation
  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    setViewport(current => {
      let newStartDate: Date;
      
      if (direction === 'today') {
        newStartDate = jumpToToday(current.viewMode);
      } else {
        newStartDate = navigateTimeline(current.startDate, direction, current.viewMode);
      }
      
      return createTimelineViewport(newStartDate, current.viewMode, current.scrollPosition);
    });
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((newViewMode: TimelineViewMode) => {
    setViewport(current => {
      // Try to maintain the same center date when switching views
      const centerDate = new Date(current.startDate);
      centerDate.setDate(centerDate.getDate() + Math.floor(current.visibleDays / 2));
      
      const newStartDate = jumpToDate(centerDate, newViewMode);
      return createTimelineViewport(newStartDate, newViewMode);
    });
  }, []);

  // Handle date jump
  const handleDateJump = useCallback((targetDate: Date) => {
    setViewport(current => {
      const newStartDate = jumpToDate(targetDate, current.viewMode);
      return createTimelineViewport(newStartDate, current.viewMode);
    });
  }, []);

  // Handle horizontal scrolling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = event.currentTarget.scrollLeft;
    setViewport(current => ({
      ...current,
      scrollPosition: { ...current.scrollPosition, x: scrollLeft }
    }));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handleNavigate('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNavigate('next');
          break;
        case 't':
        case 'T':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleNavigate('today');
          }
          break;
        case 'w':
        case 'W':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleViewModeChange('weekly');
          }
          break;
        case 'm':
        case 'M':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleViewModeChange('monthly');
          }
          break;
        case 'q':
        case 'Q':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleViewModeChange('quarterly');
          }
          break;
        case 'Home':
          event.preventDefault();
          handleNavigate('today');
          break;
        case '+':
        case '=':
          event.preventDefault();
          // Zoom in
          if (viewport.viewMode === 'quarterly') handleViewModeChange('monthly');
          else if (viewport.viewMode === 'monthly') handleViewModeChange('weekly');
          break;
        case '-':
          event.preventDefault();
          // Zoom out
          if (viewport.viewMode === 'weekly') handleViewModeChange('monthly');
          else if (viewport.viewMode === 'monthly') handleViewModeChange('quarterly');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate, handleViewModeChange, viewport.viewMode]);

  // Auto-scroll to selected date when it changes
  useEffect(() => {
    if (containerRef.current && selectedDate) {
      const daysDiff = Math.floor(
        (selectedDate.getTime() - viewport.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Check if selected date is outside current viewport
      if (daysDiff < 0 || daysDiff >= viewport.visibleDays) {
        handleDateJump(selectedDate);
      }
    }
  }, [selectedDate, viewport.startDate, viewport.visibleDays, handleDateJump]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Timeline Navigation Header */}
      <TimelineNavigation
        currentStartDate={viewport.startDate}
        viewMode={viewport.viewMode}
        onNavigate={handleNavigate}
        onViewModeChange={handleViewModeChange}
        onDateJump={handleDateJump}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        showMinimap={showMinimap}
      />

      {/* Main Timeline Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline Grid */}
        <TimelineGrid
          startDate={viewport.startDate}
          viewMode={viewport.viewMode}
          selectedDate={selectedDate}
          onDateClick={onDateSelect}
          pixelsPerDay={viewport.pixelsPerDay}
          visibleDays={viewport.visibleDays}
        />

        {/* Scrollable Timeline Content */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
          onScroll={handleScroll}
          style={{
            backgroundColor: isDark ? '#0a0a0a' : '#fafafa'
          }}
        >
          {/* Timeline Content Area */}
          <div 
            className="relative"
            style={{
              width: `${viewport.visibleDays * viewport.pixelsPerDay}px`,
              minHeight: '400px'
            }}
          >
            {/* Grid Background */}
            <div className="absolute inset-0">
              {Array.from({ length: viewport.visibleDays + 1 }, (_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 bottom-0 ${
                    isDark ? 'border-gray-800' : 'border-gray-200'
                  }`}
                  style={{
                    left: `${i * viewport.pixelsPerDay}px`,
                    borderLeftWidth: i === 0 ? '0' : '1px'
                  }}
                />
              ))}
            </div>

            {/* Tracker Lanes Content */}
            {children}
          </div>
        </div>
      </div>

      {/* Minimap (if enabled) */}
      {showMinimap && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`border-t p-4`}
          style={{
            backgroundColor: isDark ? '#111111' : '#f8fafc',
            borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
          }}
        >
          <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Timeline Overview
          </div>
          <div className={`h-16 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Minimap content will be implemented in a future task */}
            <div className="flex items-center justify-center h-full text-xs text-gray-500">
              Minimap coming soon...
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};