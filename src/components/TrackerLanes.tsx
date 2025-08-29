import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectTracker } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { TimelineViewMode } from './TimelineGrid';
import { 
  assignLanesToTrackers,
  getTrackerLanes,
  getLaneHeight
} from '../lib/laneAssignment';
import { 
  getDatePixelPosition,
  getDateRangeWidth,
  isDateRangeVisible
} from '../lib/timelineViewport';
import { useDraggableTracker } from './DragDropProvider';

interface TrackerLanesProps {
  trackers: ProjectTracker[];
  startDate: Date;
  endDate: Date;
  viewMode: TimelineViewMode;
  pixelsPerDay: number;
  selectedTracker?: ProjectTracker;
  onTrackerClick: (tracker: ProjectTracker) => void;
  onTrackerDragStart?: (tracker: ProjectTracker) => void;
  onTrackerDragEnd?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
  loading?: boolean;
  // Additional props passed by InfiniteTimelineContainer
  viewportStartDate?: Date;
  totalWidth?: number;
}

interface TrackerBarProps {
  tracker: ProjectTracker;
  laneIndex: number;
  startDate: Date;
  pixelsPerDay: number;
  laneHeight: number;
  viewMode: TimelineViewMode;
  isSelected: boolean;
  onClick: (tracker: ProjectTracker) => void;
  onDragStart?: (tracker: ProjectTracker) => void;
  onDragEnd?: (tracker: ProjectTracker, newStartDate: Date, newEndDate: Date) => void;
}

const TrackerBar: React.FC<TrackerBarProps> = ({
  tracker,
  laneIndex,
  startDate,
  pixelsPerDay,
  laneHeight,
  viewMode,
  isSelected,
  onClick,
  onDragStart,
}) => {
  const { isDark } = useTheme();
  
  // Use drag and drop hook
  const { 
    handleMouseDown, 
    isDragging, 
    dragType, 
    previewStyles 
  } = useDraggableTracker(tracker, laneIndex, onDragStart);

  // Calculate position and size with debugging
  const left = getDatePixelPosition(tracker.startDate, startDate, pixelsPerDay);
  const width = getDateRangeWidth(tracker.startDate, tracker.endDate, pixelsPerDay);
  const top = laneIndex * (laneHeight + 4) + 4; // 4px spacing between lanes
  

  // Get tracker colors based on type
  const getTrackerColors = () => {
    const baseColors = {
      project: { bg: '#3B82F6', border: '#2563EB', text: '#FFFFFF' },
      feature: { bg: '#10B981', border: '#059669', text: '#FFFFFF' },
      bug: { bg: '#EF4444', border: '#DC2626', text: '#FFFFFF' }
    };

    const colors = baseColors[tracker.type] || baseColors.feature;
    
    // Adjust opacity based on status
    let opacity = 1;
    if (tracker.status === 'not_started') opacity = 0.6;
    else if (tracker.status === 'completed') opacity = 0.8;

    return {
      backgroundColor: colors.bg,
      borderTopColor: colors.border,
      borderRightColor: colors.border,
      borderBottomColor: colors.border,
      // borderLeftColor will be set by priority border or default to colors.border
      color: colors.text,
      opacity
    };
  };

  // Get priority border style
  const getPriorityBorder = () => {
    switch (tracker.priority) {
      case 'critical':
        return { borderLeftWidth: '4px', borderLeftColor: '#DC2626' };
      case 'high':
        return { borderLeftWidth: '3px', borderLeftColor: '#F59E0B' };
      case 'low':
        return { borderLeftWidth: '2px', borderLeftColor: '#6B7280', borderLeftStyle: 'dashed' };
      default:
        return {};
    }
  };

  const colors = getTrackerColors();
  const priorityBorder = getPriorityBorder();

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isDragging) {
      onClick(tracker);
    }
  };

  // Determine if tracker should be visible (performance optimization)
  const isVisible = width > 10; // Only render if wide enough to be meaningful

  if (!isVisible) return null;

  return (
    <motion.div
      className={`absolute cursor-pointer select-none rounded-lg border transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
      } ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${laneHeight - 8}px`, // Account for spacing
        ...colors,
        // Apply priority border styles without conflicts
        borderLeftWidth: priorityBorder.borderLeftWidth || '1px',
        borderLeftColor: priorityBorder.borderLeftColor || colors.borderTopColor,
        borderLeftStyle: (priorityBorder.borderLeftStyle as any) || 'solid',
        ...previewStyles,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: colors.opacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        scale: 1.02, 
        y: -1,
        boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      layout
    >
      {/* Status indicator */}
      {tracker.status === 'in_progress' && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ backgroundColor: colors.backgroundColor }}
        />
      )}

      {/* Completed checkmark */}
      {tracker.status === 'completed' && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Tracker content */}
      <div className="px-2 py-1 h-full flex items-center justify-between min-w-0">
        <div className="flex-1 min-w-0">
          <div 
            className="font-medium text-sm truncate"
            style={{ color: colors.color }}
            title={tracker.title}
          >
            {tracker.title}
          </div>
          
          {/* Show additional info in weekly view */}
          {viewMode === 'weekly' && width > 100 && (
            <div 
              className="text-xs opacity-75 truncate"
              style={{ color: colors.color }}
            >
              {tracker.type} • {tracker.priority}
            </div>
          )}
        </div>

        {/* Enhanced Resize handles */}
        {viewMode === 'weekly' && width > 60 && !isDragging && (
          <>
            {/* Left resize handle */}
            <motion.div 
              className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 hover:opacity-100 bg-white bg-opacity-40 rounded-l-lg flex items-center justify-center group z-10"
              whileHover={{ width: 4 }}
              title="Drag to adjust start date"
              onMouseDown={(e) => {
                e.stopPropagation();
                // The useDraggableTracker will handle this automatically based on mouse position
              }}
            >
              <div className="w-0.5 h-4 bg-white bg-opacity-60 rounded-full group-hover:bg-opacity-80" />
            </motion.div>
            
            {/* Right resize handle */}
            <motion.div 
              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 hover:opacity-100 bg-white bg-opacity-40 rounded-r-lg flex items-center justify-center group z-10"
              whileHover={{ width: 4 }}
              title="Drag to adjust end date"
              onMouseDown={(e) => {
                e.stopPropagation();
                // The useDraggableTracker will handle this automatically based on mouse position
              }}
            >
              <div className="w-0.5 h-4 bg-white bg-opacity-60 rounded-full group-hover:bg-opacity-80" />
            </motion.div>
          </>
        )}
        
        {/* Resize indicators during drag */}
        {isDragging && (dragType === 'resize-start' || dragType === 'resize-end') && (
          <div className="absolute inset-0 border-2 border-dashed border-white border-opacity-50 rounded-lg pointer-events-none">
            <div className={`absolute top-1/2 transform -translate-y-1/2 text-xs font-bold text-white ${
              dragType === 'resize-start' ? 'left-1' : 'right-1'
            }`}>
              {dragType === 'resize-start' ? '◀' : '▶'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const TrackerLanes: React.FC<TrackerLanesProps> = ({
  trackers,
  startDate,
  endDate,
  viewMode,
  pixelsPerDay,
  selectedTracker,
  onTrackerClick,
  onTrackerDragStart,
  onTrackerDragEnd,
  loading = false,
  viewportStartDate,
}) => {
  const { isDark } = useTheme();

  // Use viewportStartDate from InfiniteTimelineContainer if provided, otherwise use startDate
  const effectiveStartDate = viewportStartDate || startDate;

  // Calculate lane assignments
  const { trackerLanes, totalLanes } = useMemo(() => {
    // If we have viewportStartDate, InfiniteTimelineContainer has already filtered trackers
    // So we don't need to filter again - just use all provided trackers
    const visibleTrackers = viewportStartDate ? trackers : trackers.filter(tracker =>
      isDateRangeVisible(tracker.startDate, tracker.endDate, effectiveStartDate, endDate)
    );

    const assignments = assignLanesToTrackers(visibleTrackers);
    const lanes = getTrackerLanes(visibleTrackers, assignments);
    
    
    return {
      trackerLanes: lanes,
      totalLanes: Math.max(lanes.length, 1) // At least 1 lane for empty state
    };
  }, [trackers, effectiveStartDate, endDate, viewportStartDate]);

  const laneHeight = getLaneHeight(viewMode);
  const totalHeight = totalLanes * (laneHeight + 4) + 20; // Extra padding

  // Loading state
  if (loading) {
    return (
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={`absolute rounded-lg animate-pulse ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}
            style={{
              left: `${i * 150 + 20}px`,
              top: `${i * (laneHeight + 4) + 4}px`,
              width: `${120 + i * 30}px`,
              height: `${laneHeight - 8}px`
            }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (trackers.length === 0) {
    return (
      <div 
        className="relative flex items-center justify-center"
        style={{ height: `${Math.max(totalHeight, 200)}px` }}
      >
        <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="text-lg font-medium mb-2">No trackers in this timeline</div>
          <div className="text-sm">Create a new tracker to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {/* Transparent lane areas - no visual background */}
      {Array.from({ length: totalLanes }, (_, i) => (
        <div
          key={`lane-${i}`}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${i * (laneHeight + 4)}px`,
            height: `${laneHeight + 4}px`
          }}
        />
      ))}

      {/* Tracker bars */}
      <AnimatePresence>
        {trackerLanes.flatMap(lane => 
          lane.trackers.map(tracker => (
            <TrackerBar
              key={tracker.id}
              tracker={tracker}
              laneIndex={lane.laneIndex}
              startDate={viewportStartDate || effectiveStartDate}
              pixelsPerDay={pixelsPerDay}
              laneHeight={laneHeight}
              viewMode={viewMode}
              isSelected={selectedTracker?.id === tracker.id}
              onClick={onTrackerClick}
              onDragStart={onTrackerDragStart}
              onDragEnd={onTrackerDragEnd}
            />
          ))
        )}
      </AnimatePresence>

    </div>
  );
};