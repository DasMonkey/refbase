import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { TimelineGrid, TimelineViewMode } from './TimelineGrid';
import { TimelineNavigation } from './TimelineNavigation';
import { ProjectTracker } from '../types';
import { 
  createTimelineViewport,
  navigateTimeline,
  jumpToToday,
  jumpToDate,
  VIEW_MODE_CONFIGS,
  TimelineViewport,
  getDatePixelPosition,
  isDateRangeVisible
} from '../lib/timelineViewport';
import { addWeeks, subWeeks, startOfWeek, format, addDays, differenceInWeeks } from 'date-fns';

interface InfiniteTimelineContainerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  trackers: ProjectTracker[];
  children?: React.ReactNode;
}

// Smart scrolling configuration - minimal preloading with dynamic loading
const SMART_SCROLL_CONFIG = {
  visibleWeeks: 3,    // Always show exactly 3 weeks (prev + current + next)
  loadThreshold: 0.8, // Load new week when scrolled 80% into adjacent week (more conservative)
  weekWidth: 840      // 7 days × 120px per day = 840px per week
};

interface TimelineSegment {
  startDate: Date;
  endDate: Date;
  width: number;
  left: number;
  id: string;
}

export const InfiniteTimelineContainer: React.FC<InfiniteTimelineContainerProps> = ({
  selectedDate,
  onDateSelect,
  trackers,
  children
}) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const lastScrollTime = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const hasInitializedCenterDate = useRef(false);
  const lastWeekSwitch = useRef(0); // Debounce week switching
  
  // Current view state
  const [viewMode, setViewMode] = useState<TimelineViewMode>('weekly');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // If we have trackers, start from the earliest tracker date
    if (trackers.length > 0) {
      const earliestDate = new Date(Math.min(...trackers.map(t => t.startDate.getTime())));
      return startOfWeek(earliestDate, { weekStartsOn: 1 });
    }
    // Otherwise, start from today
    return startOfWeek(jumpToToday('weekly'), { weekStartsOn: 1 });
  });
  const [scrollOffset, setScrollOffset] = useState(0); // Horizontal scroll position within 3-week window
  const [showMinimap, setShowMinimap] = useState(false);
  
  const config = VIEW_MODE_CONFIGS[viewMode];
  
  // Calculate 3-week sliding window (smart scrolling)
  const timelineWeeks = useMemo(() => {
    const weeks: TimelineSegment[] = [];
    
    // Always show: previous week, current week, next week
    for (let i = -1; i <= 1; i++) {
      const weekStart = addWeeks(currentWeekStart, i);
      const weekEnd = addWeeks(weekStart, 1);
      
      weeks.push({
        startDate: weekStart,
        endDate: weekEnd,
        width: SMART_SCROLL_CONFIG.weekWidth,
        left: (i + 1) * SMART_SCROLL_CONFIG.weekWidth, // Position: 0, 840, 1680
        id: `week-${format(weekStart, 'yyyy-MM-dd')}`
      });
    }
    
    return weeks;
  }, [currentWeekStart]);
  
  // Total timeline width - exactly 3 weeks
  const totalWidth = SMART_SCROLL_CONFIG.visibleWeeks * SMART_SCROLL_CONFIG.weekWidth;
  
  // Current viewport based on scroll position within 3-week window
  const viewport = useMemo(() => {
    const viewportWidth = containerRef.current?.clientWidth || 1200;
    
    // Calculate which portion of the 3-week window is visible
    const dayOffset = Math.floor(scrollOffset / config.pixelsPerDay);
    const viewportStart = addDays(subWeeks(currentWeekStart, 1), dayOffset); // Start from previous week
    
    return createTimelineViewport(viewportStart, viewMode, { x: scrollOffset, y: 0 });
  }, [currentWeekStart, viewMode, scrollOffset, config.pixelsPerDay]);
  
  // Filter trackers visible in current 3-week window
  const visibleTrackers = useMemo(() => {
    const windowStart = timelineWeeks[0]?.startDate;
    const windowEnd = timelineWeeks[timelineWeeks.length - 1]?.endDate;
    
    if (!windowStart || !windowEnd) return [];
    
    return trackers.filter(tracker =>
      isDateRangeVisible(tracker.startDate, tracker.endDate, windowStart, windowEnd)
    );
  }, [trackers, timelineWeeks]);

  // Smart scroll detection - shift weeks when scrolled >80% into adjacent week
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastSwitch = now - lastWeekSwitch.current;
    
    // Debounce: don't switch if we just switched within 300ms
    if (timeSinceLastSwitch < 300) return;
    
    const currentWeekPosition = SMART_SCROLL_CONFIG.weekWidth; // Middle week position (840px)
    const threshold = SMART_SCROLL_CONFIG.weekWidth * SMART_SCROLL_CONFIG.loadThreshold; // 672px (80%)
    
    // Only switch if we've scrolled significantly beyond the threshold
    const nextWeekThreshold = currentWeekPosition + threshold;
    const prevWeekThreshold = currentWeekPosition - threshold;
    
    // Scrolled >80% into next week
    if (scrollOffset > nextWeekThreshold) {
      lastWeekSwitch.current = now;
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
      setScrollOffset(scrollOffset - SMART_SCROLL_CONFIG.weekWidth);
    }
    // Scrolled >80% into previous week  
    else if (scrollOffset < prevWeekThreshold) {
      lastWeekSwitch.current = now;
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
      setScrollOffset(scrollOffset + SMART_SCROLL_CONFIG.weekWidth);
    }
  }, [scrollOffset, currentWeekStart]);
  
  // Mouse drag handlers for smart timeline scrolling
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: event.pageX,
      scrollLeft: scrollOffset
    };
    
    // Prevent text selection while dragging
    event.preventDefault();
  }, [scrollOffset]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    
    event.preventDefault();
    const deltaX = event.pageX - dragStartRef.current.x;
    const newScrollOffset = dragStartRef.current.scrollLeft - deltaX;
    
    // Clamp scroll offset to valid range (0 to totalWidth - viewport width)
    const maxScroll = totalWidth - (containerRef.current?.clientWidth || 1200);
    const clampedOffset = Math.max(0, Math.min(newScrollOffset, maxScroll));
    
    setScrollOffset(clampedOffset);
  }, [totalWidth]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Initialize scroll position to center on current week
  useEffect(() => {
    if (containerRef.current && scrollOffset === 0) {
      // Center the viewport on the current week (middle of 3-week window)
      const currentWeekPosition = SMART_SCROLL_CONFIG.weekWidth; // 840px
      const viewportWidth = containerRef.current.clientWidth;
      const centeredPosition = currentWeekPosition - viewportWidth / 2;
      setScrollOffset(Math.max(0, centeredPosition));
    }
  }, [timelineWeeks.length, scrollOffset]);

  // Update current week when trackers are first loaded
  useEffect(() => {
    if (trackers.length > 0 && !hasInitializedCenterDate.current) {
      const earliestDate = new Date(Math.min(...trackers.map(t => t.startDate.getTime())));
      const weekStart = startOfWeek(earliestDate, { weekStartsOn: 1 });
      console.log('Setting currentWeekStart to:', weekStart, 'from earliest tracker:', earliestDate);
      setCurrentWeekStart(weekStart);
      hasInitializedCenterDate.current = true;
    }
  }, [trackers]); // Changed from trackers.length to trackers to catch actual data changes
  
  // Navigation handlers
  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      setCurrentWeekStart(todayWeekStart);
      
      // Center the scroll on current week
      if (containerRef.current) {
        const currentWeekPosition = SMART_SCROLL_CONFIG.weekWidth;
        const centeredPosition = currentWeekPosition - containerRef.current.clientWidth / 2;
        setScrollOffset(Math.max(0, centeredPosition));
      }
    } else {
      // Navigate by week
      const newWeekStart = direction === 'next' 
        ? addWeeks(currentWeekStart, 1)
        : subWeeks(currentWeekStart, 1);
      setCurrentWeekStart(newWeekStart);
    }
  }, [currentWeekStart]);
  
  const handleViewModeChange = useCallback((newViewMode: TimelineViewMode) => {
    setViewMode(newViewMode);
    // Recalculate position for new view mode
    if (containerRef.current) {
      const currentCenterPosition = scrollOffset + containerRef.current.clientWidth / 2;
      const dayOffset = Math.floor(currentCenterPosition / config.pixelsPerDay);
      
      // Apply new config
      const newConfig = VIEW_MODE_CONFIGS[newViewMode];
      const newScrollOffset = dayOffset * newConfig.pixelsPerDay - containerRef.current.clientWidth / 2;
      
      setScrollOffset(Math.max(0, newScrollOffset));
    }
  }, [scrollOffset, config.pixelsPerDay]);
  
  const handleDateJump = useCallback((targetDate: Date) => {
    const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    setCurrentWeekStart(targetWeekStart);
    
    // Center the scroll on the target date within the 3-week window
    if (containerRef.current && timelineWeeks[0]?.startDate) {
      const targetPosition = getDatePixelPosition(targetDate, timelineWeeks[0].startDate, config.pixelsPerDay);
      const centeredPosition = targetPosition - containerRef.current.clientWidth / 2;
      
      setScrollOffset(Math.max(0, centeredPosition));
    }
  }, [config.pixelsPerDay, timelineWeeks]);
  
  // No need for initial scroll to center - virtual scroll starts at 0
  // Virtual scroll position can be anywhere without being constrained to DOM scroll

  // Dynamic data loading disabled to prevent infinite loops
  // TODO: Implement proper infinite scrolling with debounced updates

  // No auto-centering on scroll - only snap to center when "Today" button is clicked
  // This allows free scrolling without jumping back to center
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setScrollOffset(prev => Math.max(0, prev - config.pixelsPerDay));
          break;
        case 'ArrowRight':
          event.preventDefault();
          const maxScroll = totalWidth - (containerRef.current?.clientWidth || 1200);
          setScrollOffset(prev => Math.min(maxScroll, prev + config.pixelsPerDay));
          break;
        case 't':
        case 'T':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleNavigate('today');
          }
          break;
        case 'Home':
          event.preventDefault();
          handleNavigate('today');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate, config.pixelsPerDay, totalWidth]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Timeline Navigation Header */}
      <TimelineNavigation
        currentStartDate={viewport.startDate}
        viewMode={viewMode}
        onNavigate={handleNavigate}
        onViewModeChange={handleViewModeChange}
        onDateJump={handleDateJump}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        showMinimap={showMinimap}
      />

      {/* Main Timeline Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Virtual scroll container - NO horizontal scrolling */}
        <div 
          ref={containerRef}
          className={`flex-1 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing select-none`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: isDark ? '#0a0a0a' : '#fafafa'
          }}
        >
          {/* Timeline Grid Header - 3 weeks only */}
          <div 
            className="sticky top-0 z-20" 
            style={{ 
              width: '100%',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${totalWidth}px`,
                transform: `translateX(${-scrollOffset}px)`
              }}
            >
              <TimelineGrid
                startDate={timelineWeeks[0]?.startDate || currentWeekStart}
                viewMode={viewMode}
                selectedDate={selectedDate}
                onDateClick={onDateSelect}
                pixelsPerDay={config.pixelsPerDay}
                visibleDays={21} // 3 weeks × 7 days = 21 days
              />
            </div>
          </div>
          {/* Timeline Content Area - smart 3-week scrolling */}
          <div 
            className="relative flex-1"
            style={{
              overflow: 'hidden',
              minHeight: '400px'
            }}
          >
            <div
              style={{
                width: `${totalWidth}px`,
                height: '100%',
                transform: `translateX(${-scrollOffset}px)`
              }}
            >
            {/* Grid Background - 3 weeks only */}
            <div className="absolute inset-0">
              {timelineWeeks.map(week => {
                const daysInWeek = 7;
                return Array.from({ length: daysInWeek + 1 }, (_, i) => (
                  <div
                    key={`${week.id}-grid-${i}`}
                    className={`absolute top-0 bottom-0 ${
                      isDark ? 'border-gray-800' : 'border-gray-200'
                    }`}
                    style={{
                      left: `${week.left + (i * config.pixelsPerDay)}px`,
                      borderLeftWidth: '1px'
                    }}
                  />
                ));
              })}
            </div>

            {/* Today indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none"
              style={{
                left: `${getDatePixelPosition(
                  new Date(), 
                  timelineWeeks[0]?.startDate || new Date(), 
                  config.pixelsPerDay
                )}px`
              }}
            />

            {/* Tracker Lanes Content */}
            <div className="relative z-0">
              {children && React.isValidElement(children) 
                ? React.cloneElement(children, {
                    trackers: visibleTrackers,
                    viewportStartDate: viewport.startDate,
                    startDate: viewport.startDate, // Use the actual viewport start date
                    endDate: viewport.endDate,
                    pixelsPerDay: config.pixelsPerDay,
                    totalWidth: totalWidth
                  } as any)
                : children
              }
            </div>
            </div> {/* Close the transform div */}
          </div> {/* Close the content area */}
        </div> {/* Close the virtual scroll container */}
      </div>

      {/* Minimap */}
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
          <div className={`h-16 rounded-lg border relative overflow-hidden ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Minimap timeline */}
            <div className="absolute inset-0 p-2">
              <div className="h-full bg-gradient-to-r from-blue-500/20 to-blue-500/10 rounded">
                {/* Current viewport indicator */}
                <div
                  className="absolute top-0 bottom-0 bg-blue-500/40 border-2 border-blue-500 rounded"
                  style={{
                    left: `${(scrollOffset / totalWidth) * 100}%`,
                    width: `${((containerRef.current?.clientWidth || 0) / totalWidth) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`p-2 text-xs border-t ${isDark ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <div>
            Scroll: {Math.round(scrollOffset)}px | 
            Week: {format(currentWeekStart, 'MMM d, yyyy')} | 
            Visible: {visibleTrackers.length} trackers | 
            Width: {Math.round(totalWidth)}px
          </div>
        </div>
      )}
    </div>
  );
};